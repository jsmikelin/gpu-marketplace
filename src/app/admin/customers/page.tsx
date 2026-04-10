'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatMoney } from '@/lib/utils'

type CustomerRow = {
  id: string
  status: string
  full_name: string | null
  company: string | null
  country: string | null
  created_at: string
  total_spent: number
  total_orders: number
  kyc_status: string
  notes: string | null
  reseller_name: string | null
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [modal, setModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [kyc, setKyc] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from('profiles')
      .select(`
        id, status, full_name, company, country, created_at,
        customers(total_spent, total_orders, kyc_status, notes, reseller_id,
          profiles!reseller_id(full_name, company))
      `)
      .eq('role', 'customer')
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q.order('created_at', { ascending: false })
    const mapped = (data ?? []).map((r: Record<string, unknown>) => {
      const c = r.customers as Record<string, unknown> | null
      const resellerProfile = c?.profiles as Record<string, string> | null
      return {
        id: r.id as string,
        status: r.status as string,
        full_name: r.full_name as string | null,
        company: r.company as string | null,
        country: r.country as string | null,
        created_at: r.created_at as string,
        total_spent: (c?.total_spent as number) ?? 0,
        total_orders: (c?.total_orders as number) ?? 0,
        kyc_status: (c?.kyc_status as string) ?? 'none',
        notes: (c?.notes as string | null) ?? null,
        reseller_name: resellerProfile?.company ?? resellerProfile?.full_name ?? null,
      }
    })
    setRows(mapped)
  }, [filter])

  useEffect(() => { load() }, [load])

  function openDetail(row: CustomerRow) {
    setSelected(row)
    setNotes(row.notes ?? '')
    setKyc(row.kyc_status)
    setModal(true)
    setMsg('')
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  async function saveChanges() {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/admin/customers/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, kyc_status: kyc }),
    })
    setSaving(false)
    setMsg('Saved.')
    load()
  }

  const displayed = rows.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (r.full_name ?? '').toLowerCase().includes(s) ||
           (r.company ?? '').toLowerCase().includes(s) ||
           (r.country ?? '').toLowerCase().includes(s) ||
           (r.reseller_name ?? '').toLowerCase().includes(s)
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">All registered customers across all resellers</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search name, company, reseller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {['all', 'active', 'suspended', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
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
              <th className="table-th">Customer</th>
              <th className="table-th">Country</th>
              <th className="table-th">Reseller</th>
              <th className="table-th">Status</th>
              <th className="table-th">KYC</th>
              <th className="table-th">Orders</th>
              <th className="table-th">Spent</th>
              <th className="table-th">Joined</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No customers found</td></tr>
            )}
            {displayed.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <div className="font-medium">{row.company ?? row.full_name ?? '—'}</div>
                  <div className="text-xs text-gray-400">{row.full_name}</div>
                </td>
                <td className="table-td text-gray-500">{row.country ?? '—'}</td>
                <td className="table-td">
                  {row.reseller_name ? (
                    <span className="text-blue-600 text-xs">{row.reseller_name}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">Direct</span>
                  )}
                </td>
                <td className="table-td"><Badge status={row.status} /></td>
                <td className="table-td"><Badge status={row.kyc_status} /></td>
                <td className="table-td">{row.total_orders}</td>
                <td className="table-td">{formatMoney(row.total_spent)}</td>
                <td className="table-td text-gray-400 text-xs">{formatDate(row.created_at)}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(row)} className="text-xs btn-secondary py-1 px-2">Edit</button>
                    {row.status === 'active'
                      ? <button onClick={() => updateStatus(row.id, 'suspended')} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-1 px-2 rounded-lg">Suspend</button>
                      : <button onClick={() => updateStatus(row.id, 'active')} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-1 px-2 rounded-lg">Activate</button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Customer: ${selected?.company ?? selected?.full_name}`}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Status:</span> <Badge status={selected.status} /></div>
              <div><span className="text-gray-500">Country:</span> {selected.country ?? '—'}</div>
              <div><span className="text-gray-500">Orders:</span> {selected.total_orders}</div>
              <div><span className="text-gray-500">Total Spent:</span> {formatMoney(selected.total_spent)}</div>
              <div><span className="text-gray-500">Reseller:</span> {selected.reseller_name ?? 'Direct'}</div>
            </div>

            <div>
              <label className="label">KYC Status</label>
              <select className="input" value={kyc} onChange={(e) => setKyc(e.target.value)}>
                <option value="none">None</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="label">Internal Notes</label>
              <textarea
                rows={3} className="input resize-none"
                placeholder="Notes visible only to admins..."
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
