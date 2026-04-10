'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

type Ticket = {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  created_at: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('support_tickets').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })
    setTickets((data as Ticket[]) ?? [])
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('support_tickets').insert({
      customer_id: user.id,
      ...form,
    })
    setSubmitting(false)
    setSuccess(true)
    setForm({ subject: '', message: '', priority: 'normal' })
    load()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a ticket and we will respond within 24 hours</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Submit a Ticket</h2>
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              ✓ Ticket submitted. We will respond via email shortly.
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Subject</label>
              <input
                required className="input"
                placeholder="Describe your issue briefly"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                required rows={5} className="input resize-none"
                placeholder="Describe your issue in detail..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold">My Tickets</h2>
          </div>
          {tickets.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No tickets yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <div key={t.id} className="px-5 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{t.subject}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(t.created_at)}</div>
                    </div>
                    <Badge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
