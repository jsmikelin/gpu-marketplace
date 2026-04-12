/**
 * 任务状态更新
 * PUT /api/compute/tasks/[id]
 * 节点完成任务后调用，更新状态
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateTaskStatus } from '@/lib/compute-scheduler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = request.headers.get('X-Node-Token') || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing node token' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const nodeHash = require('crypto').createHash('sha256').update(apiKey).update('rivergpu_node_salt').digest('hex');

    const { data: node } = await supabase
      .from('compute_nodes')
      .select('id')
      .eq('api_key_hash', nodeHash)
      .single();

    if (!node) {
      return NextResponse.json({ error: 'Invalid node token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 验证任务属于该节点
    const { data: task } = await supabase
      .from('compute_tasks')
      .select('id, node_id, status, started_at')
      .eq('id', id)
      .single();

    if (!task || task.node_id !== node.id) {
      return NextResponse.json({ error: 'Task not found or not owned by this node' }, { status: 404 });
    }

    // 更新状态
    await updateTaskStatus(id, body.status, {
      output_result: body.output_result,
      error_message: body.error_message,
      duration_seconds: body.duration_seconds,
      gpu_hours: body.gpu_hours,
      cost_usd: body.cost_usd,
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[Task Update Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: task, error } = await supabase
      .from('compute_tasks')
      .select(`
        id, task_number, status, task_type, model, prompt,
        priority, cost_usd, supplier_payout, platform_commission,
        duration_seconds, output_result, error_message,
        queued_at, started_at, completed_at, created_at,
        compute_nodes(name, gpu_model, location)
      `)
      .eq('id', id)
      .single();

    if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json(task);

  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
