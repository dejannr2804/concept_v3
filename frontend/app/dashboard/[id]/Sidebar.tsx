"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useResourceItem } from '@/hooks/resource'

export default function Sidebar({ shopId }: { shopId: string }) {
  const pathname = usePathname()
  const shop = useResourceItem<{ id: number; name: string }>(`shops/${shopId}`)

  const dashboardHref = `/dashboard/${shopId}`
  const ordersHref = `/dashboard/${shopId}/orders`
  const analyticsHref = `/dashboard/${shopId}/analytics`
  const productsHref = `/dashboard/${shopId}/products`
  const categoriesHref = `/dashboard/${shopId}/categories`
  const inventoryHref = `/dashboard/${shopId}/inventory`
  const settingsHref = `/dashboard/${shopId}/manage`
  const isDashboard = pathname === dashboardHref
  const isOrders = pathname.startsWith(`/dashboard/${shopId}/orders`)
  const isAnalytics = pathname.startsWith(`/dashboard/${shopId}/analytics`)
  const isProducts = pathname.startsWith(`/dashboard/${shopId}/products`)
  const isCategories = pathname.startsWith(`/dashboard/${shopId}/categories`)
  const isInventory = pathname.startsWith(`/dashboard/${shopId}/inventory`)
  const isSettings = pathname.startsWith(`/dashboard/${shopId}/manage`)

  return (
      <aside className="pe-sidebar">
            <Link href={`/dashboard`} className={`pe-sidebar-link pe-sidebar-link--back`}>
              <img src="/img/arrow-narrow-left.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>All shops</span>
          </Link>
          <h2 className="pe-sidebar-title">{shop.data?.name || 'Shop'}</h2>
          <h3 className="pe-sidebar-subtitle">Menu</h3>
          <Link href={dashboardHref} className={`pe-sidebar-link pe-sidebar-link--back ${isDashboard ? 'is-active' : ''}`}>
              <img src="/img/home-03.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Overview</span>
          </Link>
          <Link href={ordersHref} className={`pe-sidebar-link pe-sidebar-link--back ${isOrders ? 'is-active' : ''}`}>
              <img src="/img/shopping-cart-01.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Orders</span>
          </Link>
          <Link href={analyticsHref} className={`pe-sidebar-link pe-sidebar-link--back ${isAnalytics ? 'is-active' : ''}`}>
              <img src="/img/bar-chart-square-01.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Analytics</span>
          </Link>

          <h3 className="pe-sidebar-subtitle">Tools</h3>
          <Link href={productsHref} className={`pe-sidebar-link pe-sidebar-link--back ${isProducts ? 'is-active' : ''}`}>
              <img src="/img/shopping-bag-02.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Products</span>
          </Link>
          <Link href={categoriesHref} className={`pe-sidebar-link pe-sidebar-link--back ${isCategories ? 'is-active' : ''}`}>
              <img src="/img/tag-01.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Categories</span>
          </Link>
          <Link href={inventoryHref} className={`pe-sidebar-link pe-sidebar-link--back ${isInventory ? 'is-active' : ''}`}>
              <img src="/img/box.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Inventory</span>
          </Link>

          <h3 className="pe-sidebar-subtitle">Advanced</h3>
          <Link href={settingsHref} className={`pe-sidebar-link pe-sidebar-link--back ${isSettings ? 'is-active' : ''}`}>
              <img src="/img/settings-01.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Settings</span>
          </Link>
          <Link href={`/dashboard/${shopId}/help`} className={`pe-sidebar-link pe-sidebar-link--back ${pathname.startsWith(`/dashboard/${shopId}/help`) ? 'is-active' : ''}`}>
              <img src="/img/help-circle.svg" alt="" className="pe-icon pe-icon--inline" />
              <span>Get help</span>
          </Link>
      </aside>
  )
}
