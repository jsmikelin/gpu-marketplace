/**
 * 算力调度引擎
 * 核心逻辑：
 * 1. 接收任务请求
 * 2. 按调度策略选择最优节点
 * 3. 分配任务，返回执行地址
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 调度策略
export type SchedulerStrategy = 'price' | 'latency' | 'utilization' | 'random';

export interface NodeInfo {
  id: string;
  supplier_id: string;
  name: string;
  gpu_model: string;
  gpu_count: number;
  vram_gb: number;
  location: string;
  region_code: string;
  price_per_hour: number;
  max_concurrent_tasks: number;
  current_tasks: number;
  gpu_utilization: number | null;
  memory_available_gb: number | null;
  status: 'online' | 'offline' | 'busy' | 'maintenance';
  last_heartbeat: string | null;
  endpoint: string | null;
  tags: string[];
  commission_rate: number; // 平台佣金率
}

export interface TaskRequest {
  task_type: 'inference' | 'training' | 'batch';
  model: string;
  prompt?: string;
  input_data?: Record<string, unknown>;
  base_model?: string;
  training_data?: string;
  priority?: number;
  max_budget?: number;
  preferred_regions?: string[];
  require_gpu?: string[];
  customer_id: string;
}

// 调度策略选择最优节点
async function selectBestNode(
  task: TaskRequest,
  strategy: SchedulerStrategy = 'price'
): Promise<NodeInfo | null> {
  // 查询所有在线节点
  const { data: nodes, error } = await supabase
    .from('compute_nodes')
    .select('*')
    .eq('is_active', true)
    .in('status', ['online', 'busy'])
    .gt('max_concurrent_tasks', 0);

  if (error || !nodes || nodes.length === 0) {
    console.error('[Scheduler] No nodes available:', error);
    return null;
  }

  // 过滤条件：有余量 + 心跳不过期（60秒）
  const heartbeatTimeout = 60 * 1000;
  const now = Date.now();
  const available = (nodes as NodeInfo[]).filter(n => {
    if (n.current_tasks >= n.max_concurrent_tasks) return false;
    if (!n.last_heartbeat) return false;
    if (now - new Date(n.last_heartbeat).getTime() > heartbeatTimeout) return false;
    // GPU 型号要求
    if (task.require_gpu?.length && task.require_gpu.length > 0) {
      if (!task.require_gpu.some(gpu => n.gpu_model.toUpperCase().includes(gpu.toUpperCase()))) {
        return false;
      }
    }
    // 区域偏好
    if (task.preferred_regions?.length && task.preferred_regions.length > 0) {
      if (!task.preferred_regions.includes(n.region_code)) return false;
    }
    // 预算上限
    if (task.max_budget && n.price_per_hour > task.max_budget) return false;
    return true;
  });

  if (available.length === 0) return null;

  // 按策略排序
  switch (strategy) {
    case 'price':
      // 价格优先：选最便宜的
      available.sort((a, b) => a.price_per_hour - b.price_per_hour);
      break;
    case 'latency':
      // 延迟优先：选心跳最新的
      available.sort((a, b) =>
        new Date(b.last_heartbeat!).getTime() - new Date(a.last_heartbeat!).getTime()
      );
      break;
    case 'utilization':
      // 利用率优先：选 GPU 利用率最低的（最空闲）
      available.sort((a, b) =>
        (a.gpu_utilization ?? 0) - (b.gpu_utilization ?? 0)
      );
      break;
    case 'random':
      // 随机：打散负载
      available.sort(() => Math.random() - 0.5);
      break;
  }

  return available[0];
}

// 核心调度函数
export async function scheduleTask(task: TaskRequest): Promise<{
  success: boolean;
  task_id?: string;
  node?: NodeInfo;
  endpoint?: string;
  estimated_cost?: number;
  error?: string;
}> {
  try {
    // 1. 生成任务编号
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    const taskNumber = `TASK-${date}-${random}`;

    // 2. 获取调度策略
    const { data: config } = await supabase
      .from('compute_scheduler_config')
      .select('value')
      .eq('key', 'default_strategy')
      .single();

    const strategy = (config?.value?.replace(/"/g, '') as SchedulerStrategy) || 'price';

    // 3. 选择最优节点
    const node = await selectBestNode(task, strategy);
    if (!node) {
      // 没有可用节点，放入等待队列
      const { data: queuedTask, error: queueError } = await supabase
        .from('compute_tasks')
        .insert({
          task_number: taskNumber,
          customer_id: task.customer_id,
          task_type: task.task_type,
          model: task.model,
          prompt: task.prompt,
          input_data: task.input_data || null,
          base_model: task.base_model || null,
          training_data: task.training_data || null,
          priority: task.priority || 5,
          max_budget: task.max_budget || null,
          preferred_regions: task.preferred_regions || null,
          require_gpu: task.require_gpu || null,
          status: 'pending',
          status_message: 'No available nodes, queued for matching',
        })
        .select()
        .single();

      if (queueError) {
        return { success: false, error: queueError.message };
      }

      return {
        success: true,
        task_id: queuedTask?.id,
        error: 'No available nodes, task queued',
      };
    }

    // 4. 计算预估成本
    const estimatedDuration = task.task_type === 'inference' ? 300 : 3600; // 秒
    const commissionRate = 0.15; // 平台佣金 15%
    const platformPrice = node.price_per_hour * (1 + commissionRate);
    const estimatedCost = (platformPrice * estimatedDuration) / 3600;

    // 5. 更新节点当前任务数
    await supabase
      .from('compute_nodes')
      .update({ current_tasks: node.current_tasks + 1 })
      .eq('id', node.id);

    // 6. 创建任务记录
    const { data: newTask, error: taskError } = await supabase
      .from('compute_tasks')
      .insert({
        task_number: taskNumber,
        customer_id: task.customer_id,
        node_id: node.id,
        task_type: task.task_type,
        model: task.model,
        prompt: task.prompt,
        input_data: task.input_data || null,
        base_model: task.base_model || null,
        training_data: task.training_data || null,
        priority: task.priority || 5,
        max_budget: task.max_budget || null,
        preferred_regions: task.preferred_regions || null,
        require_gpu: task.require_gpu || null,
        status: 'assigned',
        status_message: `Assigned to node ${node.name}`,
        estimated_cost: estimatedCost,
      })
      .select()
      .single();

    if (taskError) {
      // 回滚节点任务数
      await supabase
        .from('compute_nodes')
        .update({ current_tasks: node.current_tasks })
        .eq('id', node.id);
      return { success: false, error: taskError.message };
    }

    return {
      success: true,
      task_id: newTask?.id,
      node,
      endpoint: node.endpoint || `${process.env.NEXT_PUBLIC_APP_URL}/api/compute/execute`,
      estimated_cost: estimatedCost,
    };

  } catch (err) {
    console.error('[Scheduler] Error:', err);
    return { success: false, error: (err as Error).message };
  }
}

// 更新任务状态
export async function updateTaskStatus(
  taskId: string,
  status: string,
  opts: {
    output_result?: Record<string, unknown>;
    error_message?: string;
    duration_seconds?: number;
    gpu_hours?: number;
    cost_usd?: number;
  } = {}
) {
  const updates: Record<string, unknown> = { status };

  if (opts.output_result) updates.output_result = opts.output_result;
  if (opts.error_message) updates.error_message = opts.error_message;
  if (opts.duration_seconds) {
    updates.duration_seconds = opts.duration_seconds;
    updates.completed_at = new Date().toISOString();
  }
  if (opts.gpu_hours) updates.gpu_hours = opts.gpu_hours;
  if (opts.cost_usd) {
    updates.cost_usd = opts.cost_usd;
    updates.supplier_payout = opts.cost_usd * 0.85; // 供应商拿 85%
    updates.platform_commission = opts.cost_usd * 0.15; // 平台拿 15%
  }

  const { data: task } = await supabase
    .from('compute_tasks')
    .select('node_id')
    .eq('id', taskId)
    .single();

  if (task?.node_id) {
    // 任务完成，释放节点任务槽
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      await supabase.rpc('decrement_node_tasks', { node_id: task.node_id });
    }
  }

  await supabase
    .from('compute_tasks')
    .update(updates)
    .eq('id', taskId);
}

// 节点心跳
export async function recordNodeHeartbeat(
  nodeId: string,
  metrics: {
    gpu_utilization?: number;
    memory_used_gb?: number;
    memory_total_gb?: number;
    disk_used_gb?: number;
    disk_total_gb?: number;
    active_tasks?: number;
    cpu_percent?: number;
    temperature_c?: number;
    latency_ms?: number;
  }
) {
  // 更新节点状态
  const { error: nodeError } = await supabase
    .from('compute_nodes')
    .update({
      last_heartbeat: new Date().toISOString(),
      gpu_utilization: metrics.gpu_utilization || null,
      memory_available_gb: metrics.memory_total_gb
        ? metrics.memory_total_gb - (metrics.memory_used_gb || 0)
        : null,
      current_tasks: metrics.active_tasks || 0,
      status: metrics.active_tasks !== undefined
        ? (metrics.active_tasks >= 3 ? 'busy' : 'online')
        : 'online',
      updated_at: new Date().toISOString(),
    })
    .eq('id', nodeId);

  // 记录心跳日志
  await supabase.from('compute_heartbeats').insert({
    node_id: nodeId,
    gpu_utilization: metrics.gpu_utilization,
    memory_used_gb: metrics.memory_used_gb,
    memory_total_gb: metrics.memory_total_gb,
    disk_used_gb: metrics.disk_used_gb,
    active_tasks: metrics.active_tasks,
    cpu_percent: metrics.cpu_percent,
    temperature_c: metrics.temperature_c,
    latency_ms: metrics.latency_ms,
  });
}

// 获取调度统计
export async function getSchedulerStats() {
  const [nodesResult, tasksResult] = await Promise.all([
    supabase
      .from('compute_nodes')
      .select('status, gpu_model, gpu_count, price_per_hour'),
    supabase
      .from('compute_tasks')
      .select('status, task_type, cost_usd, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const nodes = nodesResult.data || [];
  const tasks = tasksResult.data || [];

  return {
    total_nodes: nodes.length,
    online_nodes: nodes.filter((n: Record<string, unknown>) => n.status === 'online').length,
    busy_nodes: nodes.filter((n: Record<string, unknown>) => n.status === 'busy').length,
    total_gpus: nodes.reduce((sum: number, n: Record<string, unknown>) => sum + ((n.gpu_count as number) || 0), 0),
    available_gpus: nodes
      .filter((n: Record<string, unknown>) => (n.status as string) === 'online')
      .reduce((sum: number, n: Record<string, unknown>) => sum + ((n.gpu_count as number) || 0), 0),
    total_tasks_7d: tasks.length,
    completed_tasks_7d: tasks.filter((t: Record<string, unknown>) => (t.status as string) === 'completed').length,
    revenue_7d: tasks
      .filter((t: Record<string, unknown>) => (t.status as string) === 'completed')
      .reduce((sum: number, t: Record<string, unknown>) => sum + ((t.cost_usd as number) || 0), 0),
    avg_task_duration: tasks
      .filter((t: Record<string, unknown>) => (t.status as string) === 'completed')
      .reduce((sum: number, t: Record<string, unknown>, _, arr) =>
        sum + (((t as Record<string, unknown>).duration_seconds as number) || 0) / arr.length, 0),
  };
}
