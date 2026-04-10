import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()
  const body = await req.json()
  const { status, rejection_reason, commission_rate, notes } = body

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    await supabase.from('profiles').update({ status }).eq('id', id)
    if (status === 'active') updates.approved_at = new Date().toISOString()
    if (status === 'rejected') updates.rejection_reason = rejection_reason ?? null
  }
  if (commission_rate !== undefined) updates.commission_rate = commission_rate
  if (notes !== undefined) updates.notes = notes

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('suppliers').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
