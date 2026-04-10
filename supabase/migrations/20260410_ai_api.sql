-- AI API 转售系统 - 数据库结构
-- 运行此迁移来创建 AI API 相关表

-- AI 供应商（Mars AI / OpenAI / Azure / 其他）
create table if not exists public.ai_suppliers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,                    -- 供应商名称，如 "Mars AI"
  slug text not null unique,            -- slug，如 "mars-ai"
  logo_url text,
  api_base_url text not null,            -- API 基础地址，如 https://api.marsai.cloud
  api_key_encrypted text not null,       -- 加密存储的 API Key
  markup_percent numeric(5,2) not null default 0,  -- 加价百分比，如 50 = 50%
  status text not null default 'active', -- active / suspended
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 可用模型（按供应商分组）
create table if not exists public.ai_models (
  id uuid default uuid_generate_v4() primary key,
  supplier_id uuid references public.ai_suppliers(id) on delete cascade not null,
  model_id text not null,                -- 供应商的模型 ID，如 "gpt-4o-mini"
  display_name text not null,            -- 显示名称，如 "GPT-4o Mini"
  provider text not null,                 -- 来自哪家：openai / anthropic / google / deepseek / other
  input_price_per_m text,                -- 输入价格 ($/1M tokens)，空=不支持
  output_price_per_m text,               -- 输出价格 ($/1M tokens)
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(supplier_id, model_id)
);

-- AI 套餐
create table if not exists public.ai_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,                    -- 套餐名，如 "Starter"
  slug text not null unique,
  description text,
  credits_monthly text not null,         -- 每月额度描述，如 "1M tokens"
  credits_amount int not null,            -- 额度数值（token数）
  price_usd numeric(10,2) not null,       -- 月费（美元）
  price_cny numeric(10,2),                -- 月费（人民币，可选）
  features jsonb,                         -- 特性列表
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 客户 API Key
create table if not exists public.ai_api_keys (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  key_hash text not null unique,         -- SHA256 哈希存储（安全）
  key_prefix text not null,               -- 前缀用于显示，如 "riv_xxxx"
  key_full text not null,                 -- 完整 Key（加密存储，用户只能看到一次）
  name text not null,                    -- Key 名称，如 "我的开发 Key"
  plan_id uuid references public.ai_plans(id),
  monthly_limit int,                      -- 每月限额（token），空=不限
  used_this_month int not null default 0, -- 本月已用
  status text not null default 'active',  -- active / suspended / expired
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 用量日志（只保留最近90天）
create table if not exists public.ai_usage_logs (
  id bigint default nextval('ai_usage_logs_id_seq'::regclass) primary key,
  api_key_id uuid references public.ai_api_keys(id) on delete cascade not null,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  cost_usd numeric(12,6) not null default 0,  -- 这次调用的成本
  supplier_id uuid references public.ai_suppliers(id),
  latency_ms int,
  error_message text,
  created_at timestamptz not null default now()
);

-- 序列（如果不存在）
create sequence if not exists ai_usage_logs_id_seq;

-- AI 订单（套餐订阅）
create table if not exists public.ai_orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null,
  profile_id uuid references public.profiles(id) not null,
  plan_id uuid references public.ai_plans(id) not null,
  api_key_id uuid references public.ai_api_keys(id),
  billing_type text not null default 'monthly',  -- monthly / yearly
  unit_price numeric(10,2) not null,
  subtotal numeric(12,2) not null,
  status text not null default 'pending_payment',  -- pending_payment / active / cancelled / expired
  stripe_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  expires_at timestamptz,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now()
);

-- AI 交易记录
create table if not exists public.ai_transactions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) not null,
  order_id uuid references public.ai_orders(id),
  type text not null,                    -- topup / refund / charge
  amount_usd numeric(12,4) not null,
  credits_added int,                     -- 本次增加的 token 额度
  balance_before int,                    -- 操作前余额
  balance_after int,                     -- 操作后余额
  description text,
  stripe_id text,
  created_at timestamptz not null default now()
);

-- 索引
create index if not exists idx_ai_api_keys_profile on public.ai_api_keys(profile_id);
create index if not exists idx_ai_api_keys_key_hash on public.ai_api_keys(key_hash);
create index if not exists idx_ai_usage_logs_key_id on public.ai_usage_logs(api_key_id);
create index if not exists idx_ai_usage_logs_created on public.ai_usage_logs(created_at);
create index if not exists idx_ai_orders_profile on public.ai_orders(profile_id);
create index if not exists idx_ai_models_supplier on public.ai_models(supplier_id);

-- RLS
alter table public.ai_suppliers enable row level security;
alter table public.ai_models enable row level security;
alter table public.ai_plans enable row level security;
alter table public.ai_api_keys enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.ai_orders enable row level security;
alter table public.ai_transactions enable row level security;

-- 管理员可读写，供应商可读自己的
create policy ai_suppliers_read on public.ai_suppliers for select using (true);
create policy ai_suppliers_admin on public.ai_suppliers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy ai_models_read on public.ai_models for select using (is_active = true);
create policy ai_models_admin on public.ai_models for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy ai_plans_read on public.ai_plans for select using (is_active = true);
create policy ai_plans_admin on public.ai_plans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy ai_api_keys_own on public.ai_api_keys for all using (profile_id = auth.uid());
create policy ai_api_keys_admin on public.ai_api_keys for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy ai_usage_logs_own on public.ai_usage_logs for select using (
  exists (select 1 from public.ai_api_keys where id = api_key_id and profile_id = auth.uid())
);
create policy ai_usage_logs_admin on public.ai_usage_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy ai_orders_own on public.ai_orders for select using (profile_id = auth.uid());
create policy ai_orders_insert on public.ai_orders for insert with check (profile_id = auth.uid());
create policy ai_orders_admin on public.ai_orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy ai_transactions_own on public.ai_transactions for select using (profile_id = auth.uid());
