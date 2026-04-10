/**
 * AI API 套餐购买 - 创建 Stripe Checkout Session
 * POST /api/ai/checkout
 * Body: { planSlug: string }
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// 套餐配置（与数据库 ai_plans 对应）
const PLAN_CONFIG: Record<string, {
  name: string;
  priceId: string; // Stripe Price ID（需要先在 Stripe 后台创建产品）
  creditsAmount: number;
  priceUsd: number;
}> = {
  'starter': {
    name: 'AI API Starter',
    priceId: '', // TODO: 创建 Stripe 产品后填入
    creditsAmount: 1_000_000,
    priceUsd: 9.90,
  },
  'pro': {
    name: 'AI API Pro',
    priceId: '', // TODO: 创建 Stripe 产品后填入
    creditsAmount: 10_000_000,
    priceUsd: 69.00,
  },
};

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 2. 读取 plan
    const body = await request.json();
    const planSlug = body.planSlug as string;
    const planConfig = PLAN_CONFIG[planSlug];
    if (!planConfig) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    // 3. 生成订单号
    const orderNumber = `AI-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // 4. 插入 pending 订单（等 webhook 回调后更新状态）
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 查 plan_id
    const { data: plan } = await supabaseAdmin
      .from('ai_plans')
      .select('id')
      .eq('slug', planSlug)
      .single();

    if (!plan) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 404 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('ai_orders')
      .insert({
        order_number: orderNumber,
        profile_id: user.id,
        plan_id: plan.id,
        billing_type: 'monthly',
        unit_price: planConfig.priceUsd,
        subtotal: planConfig.priceUsd,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 5. 创建 Stripe Checkout Session
    // 如果有 Stripe Price ID，用固定价格；否则用动态价格（测试用）
    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (planConfig.priceId) {
      // 正式模式：使用 Stripe 产品价格
      sessionConfig = {
        mode: 'subscription',
        customer_email: user.email!,
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai-api/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai-api/pricing?cancelled=true`,
        metadata: { order_id: order.id, plan_slug: planSlug, user_id: user.id },
      };
    } else {
      // 测试模式：动态定价（只用测试卡）
      sessionConfig = {
        mode: 'payment',
        customer_email: user.email!,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: `${(planConfig.creditsAmount / 1_000_000).toFixed(0)}M tokens/month AI API access`,
            },
            unit_amount: Math.round(planConfig.priceUsd * 100),
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai-api/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai-api/pricing?cancelled=true`,
        metadata: { order_id: order.id, plan_slug: planSlug, user_id: user.id },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // 更新订单的 stripe session id
    await supabaseAdmin
      .from('ai_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('[AI Checkout Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
