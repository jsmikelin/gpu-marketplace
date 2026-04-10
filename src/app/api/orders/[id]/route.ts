import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()
  const body = await req.json()
  const { status, admin_notes } = body

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (admin_notes !== undefined) updates.admin_notes = admin_notes
  if (status === 'active') updates.started_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()

  const { error } = await supabase.from('orders').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_credentials(*), products(*), profiles!customer_id(*)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
