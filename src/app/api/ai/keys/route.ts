/**
 * AI API Key 管理
 * POST   /api/ai/keys      - 创建新 Key
 * GET    /api/ai/keys      - 列出我的 Keys
 * DELETE /api/ai/keys?id=  - 删除 Key
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getSupabaseUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).update('rivergpu_salt').digest('hex');
}

function generateApiKey(): { full: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(24).toString('base64url');
  const full = `riv_${random}`;
  return {
    full,
    prefix: full.slice(0, 12) + '...',
    hash: hashKey(full),
  };
}

// 创建 API Key
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const supabaseUser = getSupabaseUser(request);
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name: string = body.name || 'My API Key';
    const planId: string | null = body.plan_id || null;

    const { full, prefix, hash } = generateApiKey();

    const { data, error } = await supabaseAdmin
      .from('ai_api_keys')
      .insert({
        profile_id: user.id,
        key_hash: hash,
        key_prefix: prefix,
        key_full: full, // 实际环境建议加密存储
        name,
        plan_id: planId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 返回完整 Key（用户只能看到这一次）
    return NextResponse.json({
      id: data.id,
      name: data.name,
      key: full,
      key_prefix: prefix,
      status: data.status,
      created_at: data.created_at,
      message: 'Save this key — it will not be shown again',
    });

  } catch (err) {
    console.error('[AI Keys POST Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 列出我的 Keys
export async function GET(request: NextRequest) {
  try {
    const supabaseUser = getSupabaseUser(request);
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseUser
      .from('ai_api_keys')
      .select('id, name, key_prefix, status, monthly_limit, used_this_month, last_used_at, created_at, expires_at, ai_plans(name, credits_amount)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: data });

  } catch (err) {
    console.error('[AI Keys GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 删除 API Key
export async function DELETE(request: NextRequest) {
  try {
    const supabaseUser = getSupabaseUser(request);
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('ai_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('profile_id', user.id); // 确保只能删除自己的

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[AI Keys DELETE Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
