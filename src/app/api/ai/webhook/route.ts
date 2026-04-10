/**
 * AI API Stripe Webhook
 * POST /api/ai/webhook
 * 
 * Stripe Dashboard → Webhooks → 添加端点 → https://rivergpu.com/api/ai/webhook
 * 监听事件: checkout.session.completed, invoice.payment_succeeded
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function generateApiKey(): string {
  return 'riv_' + crypto.randomBytes(24).toString('base64url');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    console.error('[Webhook] Signature verification failed:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const planSlug = session.metadata?.plan_slug;
        const userId = session.metadata?.user_id;

        if (!orderId || !userId) break;

        // 查订单和套餐信息
        const { data: order } = await supabaseAdmin
          .from('ai_orders')
          .select('*, ai_plans(*)')
          .eq('id', orderId)
          .single();

        if (!order || order.status !== 'pending_payment') break;

        // 生成 API Key
        const keyFull = generateApiKey();
        const keyPrefix = keyFull.slice(0, 12) + '...';
        const keyHash = crypto.createHash('sha256').update(keyFull).update('rivergpu_salt').digest('hex');

        const { data: apiKey, error: keyError } = await supabaseAdmin
          .from('ai_api_keys')
          .insert({
            profile_id: userId,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            key_full: keyFull, // TODO: 生产环境加密存储
            name: `${order.ai_plans?.name || 'Default'} API Key`,
            plan_id: order.plan_id,
            monthly_limit: order.ai_plans?.credits_amount || null,
            status: 'active',
          })
          .select()
          .single();

        if (keyError) {
          console.error('[Webhook] Failed to create API key:', keyError);
          break;
        }

        // 更新订单状态
        await supabaseAdmin
          .from('ai_orders')
          .update({
            status: 'active',
            api_key_id: apiKey.id,
            stripe_payment_intent_id: session.payment_intent as string || session.id,
            paid_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', orderId);

        // 插入交易记录
        await supabaseAdmin.from('ai_transactions').insert({
          profile_id: userId,
          order_id: orderId,
          type: 'topup',
          amount_usd: order.subtotal,
          credits_added: order.ai_plans?.credits_amount || 0,
          description: `AI API ${planSlug} subscription activated`,
          stripe_id: session.id,
        });

        console.log(`[Webhook] Order ${orderId} activated, API Key created for user ${userId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        // 续费：月订阅自动续费
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // 查找对应订单并续期
        const { data: orders } = await supabaseAdmin
          .from('ai_orders')
          .select('id, api_key_id, expires_at')
          .eq('stripe_session_id', subscriptionId)
          .eq('status', 'active')
          .single();

        if (orders) {
          const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await supabaseAdmin
            .from('ai_orders')
            .update({ expires_at: newExpiry.toISOString() })
            .eq('id', orders.id);

          await supabaseAdmin
            .from('ai_api_keys')
            .update({
              used_this_month: 0, // 重置月度用量
              status: 'active',
            })
            .eq('id', orders.api_key_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // 扣费失败：暂停 Key
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        const { data: orders } = await supabaseAdmin
          .from('ai_orders')
          .select('api_key_id')
          .eq('stripe_session_id', subscriptionId)
          .single();

        if (orders?.api_key_id) {
          await supabaseAdmin
            .from('ai_api_keys')
            .update({ status: 'suspended' })
            .eq('id', orders.api_key_id);
        }
        break;
      }
    }
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
