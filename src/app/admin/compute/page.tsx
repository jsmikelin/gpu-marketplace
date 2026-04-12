import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

async function getNodes(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('compute_nodes')
    .select('*')
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false });
  return data || [];
}

async function getTasks(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('compute_tasks')
    .select('id, task_number, task_type, model, status, cost_usd, duration_seconds, created_at, compute_nodes(name)')
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { getSchedulerStats } = await import('@/lib/compute-scheduler');
  return getSchedulerStats();
}

export default async function ComputeAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
            前往登录 →
          </Link>
        </div>
      </div>
    );
  }

  const [nodes, tasks, stats] = await Promise.all([
    getNodes(supabase),
    getTasks(supabase),
    getStats(supabase),
  ]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚡ 算力调度管理</h1>
            <p className="text-gray-400 text-sm mt-1">节点管理 · 任务监控 · 调度统计</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              ← 返回主后台
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: '在线节点', value: stats.online_nodes, total: stats.total_nodes, color: 'text-green-400' },
              { label: '可用 GPU', value: stats.available_gpus, total: stats.total_gpus, color: 'text-blue-400' },
              { label: '本周任务', value: stats.completed_tasks_7d, total: stats.total_tasks_7d, color: 'text-purple-400' },
              { label: '本周收入', value: `$${stats.revenue_7d.toFixed(2)}`, color: 'text-yellow-400' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                {s.total !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">/ {s.total} 总计</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Nodes */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">节点列表</h2>
              <Link
                href="/admin/compute/nodes/new"
                className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg"
              >
                + 添加节点
              </Link>
            </div>

            <div className="space-y-3">
              {nodes.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">🖥️</div>
                  <p className="text-gray-400 text-sm mb-4">还没有注册节点</p>
                  <Link
                    href="/admin/compute/nodes/new"
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    添加第一个节点 →
                  </Link>
                </div>
              ) : (
                nodes.map((node: Record<string, unknown>) => (
                  <div key={node.id as string} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">{node.name as string}</div>
                        <div className="text-xs text-gray-500">{(node.gpu_model as string)} · {(node.gpu_count as number)}卡</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        node.status === 'online' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                        node.status === 'busy' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                      }`}>
                        {node.status === 'online' ? '● 在线' : node.status === 'busy' ? '◐ 忙碌' : '○ 离线'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mt-3">
                      <div>
                        <div className="text-gray-500">位置</div>
                        <div>{node.location as string}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">价格</div>
                        <div>${node.price_per_hour as string}/时</div>
                      </div>
                      <div>
                        <div className="text-gray-500">任务</div>
                        <div>{node.current_tasks as number}/{node.max_concurrent_tasks as number}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">最近任务</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-4">任务号</th>
                    <th className="text-left py-3 px-4">类型</th>
                    <th className="text-left py-3 px-4">模型</th>
                    <th className="text-left py-3 px-4">节点</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-right py-3 px-4">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        暂无任务
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task: Record<string, unknown>) => (
                      <tr key={task.id as string} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 px-4 font-mono text-xs">{(task.task_number as string)}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{task.task_type as string}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{task.model as string}</td>
                        <td className="py-3 px-4 text-xs text-gray-400">{(task.compute_nodes as Record<string, unknown>)?.name as string || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs ${
                            task.status === 'completed' ? 'text-green-400' :
                            task.status === 'running' ? 'text-blue-400' :
                            task.status === 'pending' ? 'text-yellow-400' :
                            task.status === 'failed' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-green-400 font-mono">
                          {task.cost_usd ? `$${(task.cost_usd as number).toFixed(4)}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Agent 安装指引 */}
            <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3">🖥️ 节点 Agent 安装</h3>
              <p className="text-gray-400 text-sm mb-4">
                在你的 GPU 服务器上安装节点程序，连接到调度网络：
              </p>
              <div className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-green-400 mb-4">
{`# 1. 下载 Agent
git clone https://github.com/jsmikelin/gpu-marketplace
cd gpu-marketplace/agents/compute-node

# 2. 安装依赖
npm install

# 3. 配置 Token（从后台获取）
export RGPU_NODE_TOKEN=你的节点Token

# 4. 启动
node node-agent.js --token $RGPU_NODE_TOKEN`}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/compute/nodes/new"
                  className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
                >
                  注册节点获取 Token
                </Link>
                <a
                  href="/agents/compute-node"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  查看完整文档 →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
