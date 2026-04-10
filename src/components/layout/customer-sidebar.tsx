'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/orders', label: 'My Orders', icon: '📦' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/support', label: 'Support', icon: '🎫' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
]

export function CustomerSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-lg">⚡ YangtzeCompute</div>
        <div className="text-xs text-gray-500 mt-0.5">Customer Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t">
        <Link href="/" className="sidebar-link sidebar-link-inactive text-sm mb-1 block">
          <span>🌐</span><span>Back to Store</span>
        </Link>
        <form action="/api/auth/signout" method="post">
          <button className="sidebar-link sidebar-link-inactive w-full text-left text-red-500 hover:bg-red-50">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
