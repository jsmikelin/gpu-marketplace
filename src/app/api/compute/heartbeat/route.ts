/**
 * 节点心跳 + 注册
 * POST /api/compute/heartbeat
 * 
 * 供应商节点每 10-30 秒调用一次，上报状态
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordNodeHeartbeat } from '@/lib/compute-scheduler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // 供应商认证（用 API Key）
    const apiKey = request.headers.get('X-Node-Token') || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing node token' }, { status: 401 });
    }

    // 验证 Node Token
    const supabase = createClient(supabaseUrl, supabaseKey);
    const nodeHash = require('crypto').createHash('sha256').update(apiKey).update('rivergpu_node_salt').digest('hex');

    const { data: node, error: nodeError } = await supabase
      .from('compute_nodes')
      .select('id, status')
      .eq('api_key_hash', nodeHash)
      .single();

    if (nodeError || !node) {
      return NextResponse.json({ error: 'Invalid node token' }, { status: 401 });
    }

    const body = await request.json();

    // 记录心跳
    await recordNodeHeartbeat(node.id, {
      gpu_utilization: body.gpu_utilization,
      memory_used_gb: body.memory_used_gb,
      memory_total_gb: body.memory_total_gb,
      disk_used_gb: body.disk_used_gb,
      disk_total_gb: body.disk_total_gb,
      active_tasks: body.active_tasks,
      cpu_percent: body.cpu_percent,
      temperature_c: body.temperature_c,
      latency_ms: body.latency_ms,
    });

    // 检查是否有分配给我的待处理任务
    const { data: pendingTasks } = await supabase
      .from('compute_tasks')
      .select('id, task_number, task_type, model, prompt, input_data, priority')
      .eq('node_id', node.id)
      .eq('status', 'assigned')
      .order('priority', { ascending: false })
      .limit(5);

    return NextResponse.json({
      ok: true,
      node_status: node.status,
      pending_tasks: pendingTasks || [],
      server_time: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Heartbeat Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
