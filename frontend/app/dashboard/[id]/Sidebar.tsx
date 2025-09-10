"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useResourceItem } from '@/hooks/resource'

export default function Sidebar({ shopId }: { shopId: string }) {
  const pathname = usePathname()
  const shop = useResourceItem<{ id: number; name: string }>(`shops/${shopId}`)

  const dashboardHref = `/dashboard/${shopId}`
  const productsHref = `/dashboard/${shopId}/products`
  const isDashboard = pathname === dashboardHref
  const isProducts = pathname.startsWith(`/dashboard/${shopId}/products`)

  return (
    <aside className="pe-sidebar">
      <div className="pe-sidebar-header">
        <div className="pe-sidebar-title">{shop.data?.name || 'Shop'}</div>
      </div>

      <nav className="pe-sidebar-nav">
        <Link href={dashboardHref} className={`pe-sidebar-link ${isDashboard ? 'is-active' : ''}`}>
          Dashboard
        </Link>
        <Link href={productsHref} className={`pe-sidebar-link ${isProducts ? 'is-active' : ''}`}>
          Products
        </Link>
      </nav>
    </aside>
  )
}
