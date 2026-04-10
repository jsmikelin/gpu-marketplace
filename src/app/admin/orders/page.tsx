'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDateTime, formatMoney } from '@/lib/utils'

type OrderRow = {
  id: string
  order_number: string
  status: string
  subtotal: number
  commission_amount: number
  billing_type: string
  created_at: string
  customer_name: string | null
  supplier_name: string | null
  reseller_name: string | null
  product_name: string | null
  admin_notes: string | null
}

const ORDER_STATUSES = ['all', 'pending_payment', 'paid', 'processing', 'active', 'completed', 'cancelled', 'disputed']

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OrderRow | null>(null)
  const [modal, setModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from('orders')
      .select(`
        id, order_number, status, subtotal, platform_commission, billing_type, created_at, admin_notes,
        profiles!customer_id(full_name, company),
        products(name),
        supplier:profiles!supplier_id(full_name, company),
        reseller:profiles!reseller_id(full_name, company)
      `)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q.order('created_at', { ascending: false }).limit(100)
    const mapped = (data ?? []).map((r: Record<string, unknown>) => {
      const cust = r.profiles as Record<string, string> | null
      const supp = r.supplier as Record<string, string> | null
      const res = r.reseller as Record<string, string> | null
      const prod = r.products as Record<string, string> | null
      return {
        id: r.id as string,
        order_number: r.order_number as string,
        status: r.status as string,
        subtotal: r.subtotal as number,
        commission_amount: r.platform_commission as number,
        billing_type: r.billing_type as string,
        created_at: r.created_at as string,
        customer_name: cust?.company ?? cust?.full_name ?? null,
        supplier_name: supp?.company ?? supp?.full_name ?? null,
        reseller_name: res?.company ?? res?.full_name ?? null,
        product_name: prod?.name ?? null,
        admin_notes: r.admin_notes as string | null,
      }
    })
    setRows(mapped)
  }, [filter])

  useEffect(() => { load() }, [load])

  function openDetail(row: OrderRow) {
    setSelected(row)
    setNotes(row.admin_notes ?? '')
    setNewStatus(row.status)
    setModal(true)
    setMsg('')
  }

  async function saveChanges() {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/orders/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes, status: newStatus }),
    })
    setSaving(false)
    setMsg('Saved.')
    load()
  }

  const displayed = rows.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (r.order_number ?? '').toLowerCase().includes(s) ||
           (r.customer_name ?? '').toLowerCase().includes(s) ||
           (r.supplier_name ?? '').toLowerCase().includes(s)
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">All platform orders</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search order #, customer, supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Order #</th>
              <th className="table-th">Product</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Supplier</th>
              <th className="table-th">Reseller</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Commission</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No orders found</td></tr>
            )}
            {displayed.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="table-td font-mono text-xs">{row.order_number}</td>
                <td className="table-td text-xs">{row.product_name ?? '—'}</td>
                <td className="table-td text-xs">{row.customer_name ?? '—'}</td>
                <td className="table-td text-xs">{row.supplier_name ?? '—'}</td>
                <td className="table-td text-xs text-blue-600">{row.reseller_name ?? <span className="text-gray-300">Direct</span>}</td>
                <td className="table-td font-medium">{formatMoney(row.subtotal)}</td>
                <td className="table-td text-green-600">{formatMoney(row.commission_amount)}</td>
                <td className="table-td"><Badge status={row.status} /></td>
                <td className="table-td text-gray-400 text-xs">{formatDateTime(row.created_at)}</td>
                <td className="table-td">
                  <button onClick={() => openDetail(row)} className="text-xs btn-secondary py-1 px-2">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Order: ${selected?.order_number}`}
        footer={
          <>
            {msg && <span className="text-sm text-green-600 mr-auto">{msg}</span>}
            <button onClick={() => setModal(false)} className="btn-secondary">Close</button>
            <button onClick={saveChanges} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Customer:</span> {selected.customer_name}</div>
              <div><span className="text-gray-500">Supplier:</span> {selected.supplier_name}</div>
              <div><span className="text-gray-500">Reseller:</span> {selected.reseller_name ?? 'Direct'}</div>
              <div><span className="text-gray-500">Amount:</span> {formatMoney(selected.subtotal)}</div>
            </div>

            <div>
              <label className="label">Order Status</label>
              <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {ORDER_STATUSES.filter((s) => s !== 'all').map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Admin Notes</label>
              <textarea
                rows={4} className="input resize-none"
                placeholder="Internal notes about this order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
