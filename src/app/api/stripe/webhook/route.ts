import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { createInstance, getInstanceConnectionInfo, REGION_REQUIREMENTS, type RegionKey } from '@/lib/aliyun'
import type Stripe from 'stripe'

// ─── GPU Model → AliCloud Instance Type mapping ────────────────────────────────
const GPU_INSTANCE_MAP: Record<string, string> = {
  'A100 40GB':    'ecs.gn7i-c8g1.4xlarge',
  'A100 80GB':    'ecs.gn7i-c16g1.4xlarge',
  'H800':         'ecs.gn7i-c8g1.4xlarge',   // H800 uses same instance type as A100
  'V100 16GB':    'ecs.gn6v-c10g1.4xlarge',
  'V100 32GB':    'ecs.gn6v-c10g1.4xlarge',
  'L40S':         'ecs.gn7i-c8g1.4xlarge',
  'RTX 4090':    'ecs.gn7i-c8g1.4xlarge',
  'A6000':        'ecs.gn7i-c8g1.4xlarge',
}

function resolveInstanceType(gpuModel: string): string {
  for (const [key, val] of Object.entries(GPU_INSTANCE_MAP)) {
    if (gpuModel.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'ecs.gn7i-c8g1.4xlarge' // default fallback
}

function resolveRegion(location: string): RegionKey {
  const loc = location.toLowerCase()
  if (loc.includes('singapore') || loc.includes('sg')) return 'ap-southeast-1'
  if (loc.includes('us') || loc.includes('california') || loc.includes('virginia')) return 'us-west-1'
  if (loc.includes('hk') || loc.includes('hong kong') || loc.includes('香港')) return 'cn-hongkong'
  return 'ap-southeast-1' // default to Singapore
}

// ─── Provision GPU Instance (async, non-blocking) ───────────────────────────────
async function provisionGpuInstance(
  orderId: string,
  orderNumber: string,
  gpuModel: string,
  location: string,
  quantity: number
) {
  console.log(`[Webhook] Provisioning ${quantity}x ${gpuModel} instance(s) for order ${orderNumber}`)

  const region = resolveRegion(location)
  const instanceType = resolveInstanceType(gpuModel)
  const reqs = REGION_REQUIREMENTS[region]

  // Fallback if user hasn't configured SG/vSwitch yet
  if (reqs.securityGroupId.includes('xxx')) {
    console.warn(`[Webhook] AliCloud SG/vSwitch not configured for region ${region}. Skipping auto-provision.`)
    return
  }

  const aliyunConfig = {
    accessKeyId:     process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    region,
  }

  const supabase = await createAdminClient()
  const createdInstances: Array<{ instanceId: string; publicIp: string; privateIp: string }> = []

  for (let i = 0; i < quantity; i++) {
    const instanceName = `yangtze-${orderNumber}-${i + 1}`
    try {
      const result = await createInstance(aliyunConfig, {
        region,
        instanceType,
        securityGroupId: reqs.securityGroupId,
        vswitchId:       reqs.vswitchId,
        instanceName,
        hostName:        instanceName,
        sshKeyPair:      process.env.ALIYUN_SSH_KEY_PAIR,
        tags: {
          orderId,
          orderNumber,
          managedBy: 'yangtzecompute',
        },
      })
      createdInstances.push(result)
      console.log(`[Webhook] Instance ${instanceName} created: ${result.instanceId} (${result.publicIp})`)
    } catch (err) {
      console.error(`[Webhook] Failed to create instance ${instanceName}:`, err)
    }
  }

  // Store credentials for each created instance
  if (createdInstances.length > 0) {
    for (const inst of createdInstances) {
      const conn = await getInstanceConnectionInfo(aliyunConfig, inst.instanceId)
      await supabase.from('order_credentials').insert({
        order_id:         orderId,
        credential_type:  'ssh',
        host:             conn.ip,
        port:             conn.port,
        username:         conn.username,
        api_key:          process.env.ALIYUN_SSH_KEY_PAIR ?? null,
        extra_info:       { instanceId: inst.instanceId, privateIp: inst.privateIp },
      })
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', orderId)

    console.log(`[Webhook] ✅ ${createdInstances.length} instance(s) provisioned for order ${orderNumber}`)
  }
}

// ─── Main Webhook Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const m = session.metadata!
    const supabase = await createAdminClient()

    // ── 1. Create order record ─────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: m.order_number,
        customer_id:             m.customer_id,
        product_id:             m.product_id,
        supplier_id:            m.supplier_id,
        reseller_id:            m.reseller_id || null,
        quantity:               parseInt(m.quantity),
        billing_type:           m.billing_type,
        duration_value:         parseInt(m.duration_value),
        unit_price:            parseFloat(m.unit_price),
        subtotal:              parseFloat(m.subtotal),
        platform_commission_rate: parseFloat(m.platform_commission_rate),
        platform_commission:    parseFloat(m.platform_commission),
        reseller_commission_rate: parseFloat(m.reseller_commission_rate),
        reseller_commission:    parseFloat(m.reseller_commission),
        supplier_payout:        parseFloat(m.supplier_payout),
        status:                'paid',
        stripe_session_id:      session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at:               new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error('[Webhook] Failed to create order:', orderErr)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    // ── 2. Record customer payment transaction ───────────────────────────────
    await supabase.from('transactions').insert({
      profile_id: m.customer_id,
      type:       'payment',
      amount:     parseFloat(m.subtotal),
      currency:   'USD',
      status:     'completed',
      stripe_id:  session.payment_intent as string,
      description: `Order ${m.order_number}`,
    })

    // ── 3. Update customer stats ────────────────────────────────────────────
    await supabase.rpc('increment_customer_stats', {
      p_customer_id: m.customer_id,
      p_amount:      parseFloat(m.subtotal),
    })

    // ── 4. Update supplier stats ────────────────────────────────────────────
    await supabase.rpc('increment_supplier_stats', {
      p_supplier_id: m.supplier_id,
      p_payout:      parseFloat(m.supplier_payout),
    })

    // ── 5. Update reseller stats ────────────────────────────────────────────
    if (m.reseller_id) {
      await supabase.rpc('increment_reseller_stats', {
        p_reseller_id: m.reseller_id,
        p_commission:  parseFloat(m.reseller_commission),
      })
    }

    // ── 6. Decrement product availability ────────────────────────────────────
    await supabase.rpc('decrement_product_units', {
      p_product_id: m.product_id,
      p_quantity:   parseInt(m.quantity),
    })

    // ── 7. Fetch product for provisioning ────────────────────────────────────
    const { data: product } = await supabase
      .from('products')
      .select('id, gpu_model, location')
      .eq('id', m.product_id)
      .single()

    // ── 8. Trigger AliCloud instance provisioning (non-blocking) ──────────────
    if (product && process.env.ALIYUN_ACCESS_KEY_ID) {
      provisionGpuInstance(
        order.id,
        m.order_number,
        product.gpu_model,
        product.location,
        parseInt(m.quantity)
      ).catch(err => console.error('[Webhook] Provisioning error:', err))
    } else {
      console.warn('[Webhook] Skipping provisioning: ALIYUN_ACCESS_KEY_ID not set or product not found')
    }
  }

  return NextResponse.json({ received: true })
}
