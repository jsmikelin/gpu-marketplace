import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()
  const body = await req.json()
  const { status, notes, kyc_status } = body

  if (status !== undefined) {
    await supabase.from('profiles').update({ status }).eq('id', id)
  }

  const custUpdates: Record<string, unknown> = {}
  if (notes !== undefined) custUpdates.notes = notes
  if (kyc_status !== undefined) custUpdates.kyc_status = kyc_status

  if (Object.keys(custUpdates).length > 0) {
    const { error } = await supabase.from('customers').update(custUpdates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
