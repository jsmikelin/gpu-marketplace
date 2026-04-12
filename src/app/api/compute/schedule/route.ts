/**
 * 算力调度 - 提交任务
 * POST /api/compute/schedule
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scheduleTask, type TaskRequest } from '@/lib/compute-scheduler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getUserClient(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const userClient = getUserClient(request);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();

    const taskRequest: TaskRequest = {
      customer_id: user.id,
      task_type: body.task_type || 'inference',
      model: body.model,
      prompt: body.prompt,
      input_data: body.input_data,
      base_model: body.base_model,
      training_data: body.training_data,
      priority: body.priority || 5,
      max_budget: body.max_budget,
      preferred_regions: body.preferred_regions,
      require_gpu: body.require_gpu,
    };

    if (!taskRequest.model) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 });
    }

    const result = await scheduleTask(taskRequest);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      task_id: result.task_id,
      status: result.node ? 'assigned' : 'queued',
      node: result.node ? {
        id: result.node.id,
        name: result.node.name,
        gpu_model: result.node.gpu_model,
        location: result.node.location,
        price_per_hour: result.node.price_per_hour,
      } : null,
      endpoint: result.endpoint,
      estimated_cost: result.estimated_cost,
      message: result.node
        ? `Task assigned to ${result.node.name}`
        : 'No nodes available, task queued',
    });

  } catch (err) {
    console.error('[Compute Schedule Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取调度统计
export async function GET(request: NextRequest) {
  try {
    const userClient = getUserClient(request);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { getSchedulerStats } = await import('@/lib/compute-scheduler');
    const stats = await getSchedulerStats();

    return NextResponse.json(stats);

  } catch (err) {
    console.error('[Compute Stats Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
