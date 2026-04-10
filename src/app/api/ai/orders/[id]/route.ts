/**
 * 获取订单详情（含 API Key）
 * GET /api/ai/orders/[id]
 */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: order, error } = await supabase
      .from('ai_orders')
      .select(`
        id, order_number, status, subtotal, created_at, paid_at, expires_at,
        ai_plans(name, credits_monthly, credits_amount),
        api_key_id
      `)
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 获取 API Key
    let apiKey = null;
    if (order.api_key_id) {
      const { data: key } = await supabase
        .from('ai_api_keys')
        .select('key_full, key_prefix, name, monthly_limit, used_this_month')
        .eq('id', order.api_key_id)
        .single();
      apiKey = key;
    }

    return NextResponse.json({ ...order, api_key: apiKey });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
