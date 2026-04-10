import { SupplierSidebar } from '@/components/layout/supplier-sidebar'

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SupplierSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
