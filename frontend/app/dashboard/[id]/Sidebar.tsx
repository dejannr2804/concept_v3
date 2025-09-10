"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useResourceItem } from '@/hooks/resource'

export default function Sidebar({ shopId }: { shopId: string }) {
  const pathname = usePathname()
  const shop = useResourceItem<{ id: number; name: string }>(`shops/${shopId}`)

  const dashboardHref = `/dashboard/${shopId}`
  const productsHref = `/dashboard/${shopId}/products`
  const settingsHref = `/dashboard/${shopId}/manage`
  const isDashboard = pathname === dashboardHref
  const isProducts = pathname.startsWith(`/dashboard/${shopId}/products`)
  const isSettings = pathname.startsWith(`/dashboard/${shopId}/manage`)

  return (
    <aside className="pe-sidebar">
      <nav className="pe-sidebar-nav" style={{ marginBottom: 8 }}>
        <Link href={`/dashboard`} className={`pe-sidebar-link`}>
          All Shops
        </Link>
      </nav>
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
        <Link href={settingsHref} className={`pe-sidebar-link ${isSettings ? 'is-active' : ''}`}>
          Settings
        </Link>
      </nav>
    </aside>
  )
}
