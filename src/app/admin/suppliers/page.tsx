'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatMoney } from '@/lib/utils'

type SupplierRow = {
  id: string
  status: string
  full_name: string | null
  company: string | null
  country: string | null
  created_at: string
  commission_rate: number
  total_orders: number
  total_revenue: number
  notes: string | null
  email?: string
}

const FILTERS = ['all', 'pending', 'active', 'suspended']

export default function AdminSuppliersPage() {
  const [rows, setRows] = useState<SupplierRow[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SupplierRow | null>(null)
  const [modal, setModal] = useState<'detail' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [newCommission, setNewCommission] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from('profiles')
      .select('id, status, full_name, company, country, created_at, suppliers(commission_rate, total_orders, total_revenue, notes)')
      .eq('role', 'supplier')
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q.order('created_at', { ascending: false })
    const mapped = (data ?? []).map((r: Record<string, unknown>) => {
      const s = r.suppliers as Record<string, unknown> | null
      return {
        id: r.id as string,
        status: r.status as string,
        full_name: r.full_name as string | null,
        company: r.company as string | null,
        country: r.country as string | null,
        created_at: r.created_at as string,
        commission_rate: (s?.commission_rate as number) ?? 20,
        total_orders: (s?.total_orders as number) ?? 0,
        total_revenue: (s?.total_revenue as number) ?? 0,
        notes: (s?.notes as string | null) ?? null,
      }
    })
    setRows(mapped)
  }, [filter])

  useEffect(() => { load() }, [load])

  function openDetail(row: SupplierRow) {
    setSelected(row)
    setNewCommission(String(row.commission_rate))
    setNotes(row.notes ?? '')
    setModal('detail')
    setMsg('')
  }

  async function updateStatus(id: string, status: string, reason?: string) {
    setSaving(true)
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejection_reason: reason }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg(status === 'active' ? 'Approved!' : status === 'suspended' ? 'Suspended.' : 'Rejected.')
      load()
      if (modal === 'reject') setModal('detail')
    }
  }

  async function saveChanges() {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/admin/suppliers/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_rate: parseFloat(newCommission), notes }),
    })
    setSaving(false)
    if (res.ok) { setMsg('Saved.'); load() }
  }

  const displayed = rows.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (r.full_name ?? '').toLowerCase().includes(s) ||
           (r.company ?? '').toLowerCase().includes(s) ||
           (r.country ?? '').toLowerCase().includes(s)
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage GPU resource providers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search name, company, country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Supplier</th>
              <th className="table-th">Country</th>
              <th className="table-th">Status</th>
              <th className="table-th">Commission</th>
              <th className="table-th">Orders</th>
              <th className="table-th">Revenue</th>
              <th className="table-th">Joined</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No suppliers found</td></tr>
            )}
            {displayed.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <div className="font-medium">{row.company ?? row.full_name ?? '—'}</div>
                  <div className="text-xs text-gray-400">{row.full_name}</div>
                </td>
                <td className="table-td text-gray-500">{row.country ?? '—'}</td>
                <td className="table-td"><Badge status={row.status} /></td>
                <td className="table-td">{row.commission_rate}%</td>
                <td className="table-td">{row.total_orders}</td>
                <td className="table-td">{formatMoney(row.total_revenue)}</td>
                <td className="table-td text-gray-400 text-xs">{formatDate(row.created_at)}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(row)} className="text-xs btn-secondary py-1 px-2">
                      Manage
                    </button>
                    {row.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(row.id, 'active')}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-1 px-2 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {row.status === 'active' && (
                      <button
                        onClick={() => updateStatus(row.id, 'suspended')}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-1 px-2 rounded-lg transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                    {row.status === 'suspended' && (
                      <button
                        onClick={() => updateStatus(row.id, 'active')}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-1 px-2 rounded-lg transition-colors"
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        open={modal === 'detail'}
        onClose={() => setModal(null)}
        title={`Supplier: ${selected?.company ?? selected?.full_name}`}
        footer={
          <>
            {msg && <span className="text-sm text-green-600 mr-auto">{msg}</span>}
            <button onClick={() => setModal(null)} className="btn-secondary">Close</button>
            <button onClick={saveChanges} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Status:</span> <Badge status={selected.status} /></div>
              <div><span className="text-gray-500">Country:</span> {selected.country ?? '—'}</div>
              <div><span className="text-gray-500">Orders:</span> {selected.total_orders}</div>
              <div><span className="text-gray-500">Revenue:</span> {formatMoney(selected.total_revenue)}</div>
            </div>

            <div>
              <label className="label">Commission Rate (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                className="input"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Platform&apos;s cut from each order placed with this supplier</p>
            </div>

            <div>
              <label className="label">Internal Notes</label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Notes visible only to admins..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {selected.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => updateStatus(selected.id, 'active')}
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setModal('reject')}
                  className="btn-danger flex-1"
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={modal === 'reject'}
        onClose={() => setModal('detail')}
        title="Reject Supplier"
        footer={
          <>
            <button onClick={() => setModal('detail')} className="btn-secondary">Cancel</button>
            <button
              onClick={() => selected && updateStatus(selected.id, 'rejected', rejectReason)}
              disabled={saving || !rejectReason}
              className="btn-danger"
            >
              {saving ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </>
        }
      >
        <div>
          <label className="label">Reason for Rejection</label>
          <textarea
            rows={4}
            className="input resize-none"
            placeholder="Explain why this application is rejected..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
