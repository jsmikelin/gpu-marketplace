-- 算力调度网 - 数据库结构
-- Phase 1: 调度核心

-- GPU 节点注册表
create table if not exists public.compute_nodes (
  id uuid default uuid_generate_v4() primary key,
  supplier_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,                          -- 节点名称，如 "US West H100"
  gpu_model text not null,                     -- NVIDIA H100 / A100 / RTX 4090
  gpu_count int not null default 1,             -- GPU 数量
  vram_gb int,                                 -- 每卡显存 GB
  location text not null,                       -- 数据中心位置
  region_code text,                             -- us-west / eu-central / ap-southeast
  price_per_hour numeric(10,4) not null,        -- 每小时价格（美元）
  price_per_minute numeric(10,6),              -- 每分钟价格（可选）
  currency text not null default 'USD',
  max_concurrent_tasks int not null default 4,  -- 最大并发任务数
  current_tasks int not null default 0,         -- 当前任务数
  gpu_utilization int,                          -- GPU 利用率 %
  memory_available_gb numeric(6,2),             -- 可用内存 GB
  disk_available_gb int,                        -- 可用磁盘 GB
  status text not null default 'offline',       -- online / offline / busy / maintenance
  last_heartbeat timestamptz,                   -- 最后心跳时间
  endpoint text,                                -- 节点 API 地址（WebSocket/HTTP）
  agent_version text,                           -- Agent 版本
  tags text[],                                  -- 标签，如 ["h100","nvlink","rdma"]
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 算力任务表
create table if not exists public.compute_tasks (
  id uuid default uuid_generate_v4() primary key,
  task_number text unique not null,             -- 任务编号，如 "TASK-20260413-001"
  customer_id uuid references public.profiles(id) not null,
  node_id uuid references public.compute_nodes(id), -- 分配的节点（调度后填入）
  task_type text not null,                      -- inference / training / batch
  
  -- 任务内容
  model text not null,                          -- 要运行的模型，如 "llama3-70b"
  input_data jsonb,                             -- 输入数据
  prompt text,                                  -- 推理 prompt
  base_model text,                              -- 微调基础模型
  training_data text,                            -- 训练数据（URL 或内联）
  
  -- 调度参数
  priority int not null default 5,              -- 优先级 1-10，10最高
  max_budget numeric(10,4),                    -- 客户愿意出的最高价
  preferred_regions text[],                     -- 偏好区域
  require_gpu text[],                           -- 需要的 GPU 型号，如 ["H100"]
  
  -- 状态机
  status text not null default 'pending',       
  -- pending → matching → assigned → running → completed / failed / cancelled
  status_message text,
  
  -- 计量
  duration_seconds int,                          -- 实际运行时长
  gpu_hours numeric(10,4),                     -- GPU 小时数
  cost_usd numeric(10,4),                      -- 客户应付金额
  supplier_payout numeric(10,4),               -- 供应商所得
  platform_commission numeric(10,4),            -- 平台佣金
  
  -- 结果
  output_result jsonb,                          -- 推理结果 / 训练产出
  error_message text,
  
  -- 时间戳
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 节点心跳日志（用于监控）
create table if not exists public.compute_heartbeats (
  id bigint default nextval('compute_heartbeats_id_seq'::regclass) primary key,
  node_id uuid references public.compute_nodes(id) on delete cascade not null,
  gpu_utilization int,
  memory_used_gb numeric(6,2),
  memory_total_gb numeric(6,2),
  disk_used_gb int,
  disk_total_gb int,
  active_tasks int,
  cpu_percent numeric(5,2),
  temperature_c int,
  latency_ms int,
  created_at timestamptz not null default now()
);

create sequence if not exists compute_heartbeats_id_seq;

-- 调度策略配置
create table if not exists public.compute_scheduler_config (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- 默认调度策略
insert into public.compute_scheduler_config (key, value, description) values
('default_strategy', '"price"', '默认调度策略: price（价格优先）| latency（延迟优先）| utilization（利用率优先）'),
('commission_rate', '0.15', '平台佣金率 15%'),
('max_task_wait_seconds', '300', '任务最大等待时间（秒），超时自动取消'),
('heartbeat_timeout_seconds', '60', '心跳超时时间（秒），超时判定节点下线'),
('min_gpu_utilization_alert', '80', 'GPU 利用率告警阈值')
on conflict (key) do nothing;

-- 索引
create index if not exists idx_compute_nodes_supplier on public.compute_nodes(supplier_id);
create index if not exists idx_compute_nodes_status on public.compute_nodes(status);
create index if not exists idx_compute_nodes_region on public.compute_nodes(region_code);
create index if not exists idx_compute_tasks_customer on public.compute_tasks(customer_id);
create index if not exists idx_compute_tasks_status on public.compute_tasks(status);
create index if not exists idx_compute_tasks_priority on public.compute_tasks(priority desc, created_at asc);
create index if not exists idx_compute_heartbeats_node on public.compute_heartbeats(node_id, created_at desc);

-- RLS
alter table public.compute_nodes enable row level security;
alter table public.compute_tasks enable row level security;
alter table public.compute_heartbeats enable row level security;
alter table public.compute_scheduler_config enable row level security;

-- 节点策略：供应商能读写自己的节点，管理员可读写所有
create policy compute_nodes_supplier on public.compute_nodes for all using (
  supplier_id = auth.uid()
);

-- 任务策略：客户只能读自己的任务，供应商能读分配给自己的任务
create policy compute_tasks_customer on public.compute_tasks for select using (
  customer_id = auth.uid()
);
create policy compute_tasks_insert on public.compute_tasks for insert with check (
  customer_id = auth.uid()
);

-- 供应商能看分配给自己的任务
create policy compute_tasks_supplier on public.compute_tasks for select using (
  exists (
    select 1 from public.compute_nodes cn
    where cn.id = compute_tasks.node_id and cn.supplier_id = auth.uid()
  )
);

-- 心跳：供应商只能写自己的节点
create policy compute_heartbeats_supplier on public.compute_heartbeats for insert with check (
  exists (
    select 1 from public.compute_nodes cn
    where cn.id = node_id and cn.supplier_id = auth.uid()
  )
);

-- 调度配置：所有人可读，管理员可写
create policy compute_config_read on public.compute_scheduler_config for select using (true);
create policy compute_config_admin on public.compute_scheduler_config for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
