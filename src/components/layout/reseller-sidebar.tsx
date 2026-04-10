'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/reseller', label: 'Dashboard', icon: '📊' },
  { href: '/reseller/customers', label: 'My Customers', icon: '👥' },
  { href: '/reseller/orders', label: 'Orders', icon: '📦' },
  { href: '/reseller/commissions', label: 'Commissions', icon: '💰' },
  { href: '/reseller/invite', label: 'Invite Customers', icon: '📨' },
  { href: '/reseller/profile', label: 'Profile', icon: '👤' },
]

export function ResellerSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-lg">⚡ YangtzeCompute</div>
        <div className="text-xs text-gray-500 mt-0.5">Reseller Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/reseller' ? pathname === '/reseller' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t">
        <form action="/api/auth/signout" method="post">
          <button className="sidebar-link sidebar-link-inactive w-full text-left text-red-500 hover:bg-red-50">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
