import { ResellerSidebar } from '@/components/layout/reseller-sidebar'

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ResellerSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
