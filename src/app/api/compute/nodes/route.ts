/**
 * 节点管理
 * GET    /api/compute/nodes      - 列出我的节点
 * POST   /api/compute/nodes      - 注册新节点
 * PUT    /api/compute/nodes/[id] - 更新节点
 * DELETE /api/compute/nodes/[id] - 删除节点
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getUserClient(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function generateNodeToken(): { token: string; hash: string } {
  const token = 'rvcn_' + crypto.randomBytes(24).toString('base64url');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).update('rivergpu_node_salt').digest('hex'),
  };
}

// 列出我的节点
export async function GET(request: NextRequest) {
  try {
    const userClient = getUserClient(request);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: nodes, error } = await userClient
      .from('compute_nodes')
      .select('id, name, gpu_model, gpu_count, vram_gb, location, region_code, price_per_hour, status, current_tasks, max_concurrent_tasks, is_active, last_heartbeat, created_at')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ nodes: nodes || [] });

  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 注册新节点
export async function POST(request: NextRequest) {
  try {
    const userClient = getUserClient(request);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // 生成节点 Token
    const { token, hash } = generateNodeToken();

    const { data: node, error } = await userClient
      .from('compute_nodes')
      .insert({
        supplier_id: user.id,
        name: body.name,
        gpu_model: body.gpu_model,
        gpu_count: body.gpu_count || 1,
        vram_gb: body.vram_gb,
        location: body.location,
        region_code: body.region_code,
        price_per_hour: body.price_per_hour,
        price_per_minute: body.price_per_minute || body.price_per_hour / 60,
        max_concurrent_tasks: body.max_concurrent_tasks || 4,
        endpoint: body.endpoint || null,
        tags: body.tags || [],
        api_key_hash: hash, // 用于节点认证
        status: 'online',
        last_heartbeat: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      node,
      node_token: token, // 只在创建时返回一次
      setup_instructions: '保存此 Token，在节点 Agent 配置中使用',
    });

  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
