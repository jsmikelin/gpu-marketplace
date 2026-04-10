'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatMoney } from '@/lib/utils'

type Product = {
  id: string
  name: string
  gpu_model: string
  gpu_count: number
  vram_gb: number | null
  vcpus: number | null
  ram_gb: number | null
  storage_tb: number | null
  location: string
  price_hourly: number
  price_monthly: number | null
  available_units: number
  status: string
  description: string | null
}

const EMPTY: Omit<Product, 'id'> = {
  name: '', gpu_model: '', gpu_count: 1, vram_gb: null, vcpus: null,
  ram_gb: null, storage_tb: null, location: '', price_hourly: 0,
  price_monthly: null, available_units: 0, status: 'active', description: null,
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false })
    setProducts((data as Product[]) ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ ...p })
    setModal(true)
  }

  function update(k: string, v: unknown) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const data = { ...form, supplier_id: userId }
    if (editing) {
      await supabase.from('products').update(data).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(data)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function toggle(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('products').update({ status: status === 'active' ? 'inactive' : 'active' }).eq('id', id)
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your GPU resources</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Product</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th">GPU</th>
              <th className="table-th">Location</th>
              <th className="table-th">Price/hr</th>
              <th className="table-th">Price/mo</th>
              <th className="table-th">Units</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No products yet. <button onClick={openNew} className="text-green-600 hover:underline">Add your first GPU resource →</button>
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{p.name}</td>
                <td className="table-td text-xs">{p.gpu_count}x {p.gpu_model}</td>
                <td className="table-td text-xs text-gray-500">{p.location}</td>
                <td className="table-td">{formatMoney(p.price_hourly)}</td>
                <td className="table-td">{p.price_monthly ? formatMoney(p.price_monthly) : '—'}</td>
                <td className="table-td">
                  <span className={p.available_units > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {p.available_units}
                  </span>
                </td>
                <td className="table-td"><Badge status={p.status} /></td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs btn-secondary py-1 px-2">Edit</button>
                    <button
                      onClick={() => toggle(p.id, p.status)}
                      className={`text-xs py-1 px-2 rounded-lg border transition-colors ${
                        p.status === 'active'
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      {p.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
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
        title={editing ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Product Name</label>
            <input className="input" placeholder="e.g. A100 80GB x8 Node" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">GPU Model</label>
              <input className="input" placeholder="NVIDIA A100 80GB" value={form.gpu_model} onChange={(e) => update('gpu_model', e.target.value)} />
            </div>
            <div>
              <label className="label">GPU Count</label>
              <input type="number" min="1" className="input" value={form.gpu_count} onChange={(e) => update('gpu_count', parseInt(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">VRAM (GB)</label>
              <input type="number" className="input" value={form.vram_gb ?? ''} onChange={(e) => update('vram_gb', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
            <div>
              <label className="label">vCPUs</label>
              <input type="number" className="input" value={form.vcpus ?? ''} onChange={(e) => update('vcpus', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">RAM (GB)</label>
              <input type="number" className="input" value={form.ram_gb ?? ''} onChange={(e) => update('ram_gb', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
            <div>
              <label className="label">Storage (TB)</label>
              <input type="number" step="0.1" className="input" value={form.storage_tb ?? ''} onChange={(e) => update('storage_tb', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="e.g. Tokyo, JP" value={form.location} onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price per Hour (USD)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.price_hourly} onChange={(e) => update('price_hourly', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="label">Price per Month (USD)</label>
              <input type="number" step="1" min="0" className="input" placeholder="Optional" value={form.price_monthly ?? ''} onChange={(e) => update('price_monthly', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <label className="label">Available Units</label>
            <input type="number" min="0" className="input" value={form.available_units} onChange={(e) => update('available_units', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea rows={2} className="input resize-none" placeholder="Additional details..." value={form.description ?? ''} onChange={(e) => update('description', e.target.value || null)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
