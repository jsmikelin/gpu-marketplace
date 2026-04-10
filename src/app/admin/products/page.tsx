'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/utils'

type ProductRow = {
  id: string
  name: string
  gpu_model: string
  gpu_count: number
  location: string
  price_hourly: number
  price_monthly: number | null
  available_units: number
  status: string
  supplier_name: string | null
}

export default function AdminProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [search, setSearch] = useState('')

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, gpu_model, gpu_count, location, price_hourly, price_monthly, available_units, status, profiles!supplier_id(full_name, company)')
      .order('created_at', { ascending: false })
    const mapped = (data ?? []).map((r: Record<string, unknown>) => {
      const sup = r.profiles as Record<string, string> | null
      return {
        id: r.id as string,
        name: r.name as string,
        gpu_model: r.gpu_model as string,
        gpu_count: r.gpu_count as number,
        location: r.location as string,
        price_hourly: r.price_hourly as number,
        price_monthly: r.price_monthly as number | null,
        available_units: r.available_units as number,
        status: r.status as string,
        supplier_name: sup?.company ?? sup?.full_name ?? null,
      }
    })
    setRows(mapped)
  }

  useEffect(() => { load() }, [])

  async function toggleStatus(id: string, current: string) {
    const supabase = createClient()
    await supabase.from('products').update({ status: current === 'active' ? 'inactive' : 'active' }).eq('id', id)
    load()
  }

  const displayed = search
    ? rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.gpu_model.toLowerCase().includes(search.toLowerCase()) || (r.supplier_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : rows

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-sm text-gray-500 mt-1">All GPU resources listed by suppliers</p>
      </div>

      <div className="mb-4">
        <input className="input max-w-xs" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th">GPU</th>
              <th className="table-th">Location</th>
              <th className="table-th">Supplier</th>
              <th className="table-th">Price/hr</th>
              <th className="table-th">Price/mo</th>
              <th className="table-th">Available</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No products found</td></tr>
            )}
            {displayed.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{row.name}</td>
                <td className="table-td text-xs">{row.gpu_count}x {row.gpu_model}</td>
                <td className="table-td text-xs text-gray-500">{row.location}</td>
                <td className="table-td text-xs text-blue-600">{row.supplier_name ?? '—'}</td>
                <td className="table-td">{formatMoney(row.price_hourly)}</td>
                <td className="table-td">{row.price_monthly ? formatMoney(row.price_monthly) : '—'}</td>
                <td className="table-td">
                  <span className={row.available_units > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {row.available_units}
                  </span>
                </td>
                <td className="table-td"><Badge status={row.status} /></td>
                <td className="table-td">
                  <button
                    onClick={() => toggleStatus(row.id, row.status)}
                    className={`text-xs py-1 px-2 rounded-lg border transition-colors ${
                      row.status === 'active'
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                    }`}
                  >
                    {row.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
