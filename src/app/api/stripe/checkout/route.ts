import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { product_id, quantity = 1, billing_type, duration_value } = body

  // Fetch product
  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('*, suppliers(commission_rate), profiles!supplier_id(id)')
    .eq('id', product_id)
    .single()

  if (pErr || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Calculate pricing
  const unitPrice = billing_type === 'monthly' ? product.price_monthly : product.price_hourly
  const subtotal = Number(unitPrice) * quantity * duration_value
  const platformRate = (product.suppliers as Record<string, number>)?.commission_rate ?? 20
  const platformCommission = subtotal * (platformRate / 100)

  // Fetch reseller commission if customer has a reseller
  const { data: custData } = await supabase
    .from('customers')
    .select('reseller_id, resellers!reseller_id(commission_rate)')
    .eq('id', user.id)
    .single()

  const resellerRate = custData?.resellers
    ? ((custData.resellers as unknown) as Record<string, number>).commission_rate ?? 0
    : 0
  const resellerCommission = subtotal * (resellerRate / 100)
  const supplierPayout = subtotal - platformCommission

  // Generate order number
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  const orderNum = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.name} (${quantity}x, ${duration_value} ${billing_type === 'monthly' ? 'month(s)' : 'hour(s)'})`,
            description: `${product.gpu_model} • ${product.location}`,
          },
          unit_amount: Math.round(subtotal * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/orders?success=1&order=${orderNum}`,
    cancel_url: `${appUrl}/dashboard?cancelled=1`,
    metadata: {
      order_number: orderNum,
      customer_id: user.id,
      product_id,
      supplier_id: (product.profiles as Record<string, string>)?.id ?? '',
      reseller_id: custData?.reseller_id ?? '',
      quantity: String(quantity),
      billing_type,
      duration_value: String(duration_value),
      unit_price: String(unitPrice),
      subtotal: String(subtotal),
      platform_commission_rate: String(platformRate),
      platform_commission: String(platformCommission),
      reseller_commission_rate: String(resellerRate),
      reseller_commission: String(resellerCommission),
      supplier_payout: String(supplierPayout),
    },
  })

  return NextResponse.json({ url: session.url })
}
