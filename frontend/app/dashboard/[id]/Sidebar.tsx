"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useResourceItem } from '@/hooks/resource'
import { useRef, useState } from 'react'

export default function Sidebar({ shopId }: { shopId: string }) {
  const pathname = usePathname()
  const shop = useResourceItem<{ id: number; name: string }>(`shops/${shopId}`)

  // Show "Soon" badges on click for 5 seconds
  const [showSoonAnalytics, setShowSoonAnalytics] = useState(false)
  const [showSoonInventory, setShowSoonInventory] = useState(false)
  const [analyticsKey, setAnalyticsKey] = useState(0)
  const [inventoryKey, setInventoryKey] = useState(0)
  const analyticsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inventoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const isHelp = pathname.startsWith(`/dashboard/${shopId}/help`)

  const handleAnalyticsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setShowSoonAnalytics(true)
    setAnalyticsKey((k) => k + 1)
    if (analyticsTimerRef.current) clearTimeout(analyticsTimerRef.current)
    analyticsTimerRef.current = setTimeout(() => setShowSoonAnalytics(false), 5000)
  }

  const handleInventoryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setShowSoonInventory(true)
    setInventoryKey((k) => k + 1)
    if (inventoryTimerRef.current) clearTimeout(inventoryTimerRef.current)
    inventoryTimerRef.current = setTimeout(() => setShowSoonInventory(false), 5000)
  }

  return (
    <aside className="pe-sidebar">
      <Link href={`/dashboard`} className="pe-sidebar-link pe-sidebar-link--back">
        <div className="text">
          <img src="/img/arrow-narrow-left.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>All shops</span>
        </div>
      </Link>

      <h2 className="pe-sidebar-title">{shop.data?.name || 'Shop'}</h2>
      <h3 className="pe-sidebar-subtitle">Menu</h3>

      <Link href={dashboardHref} className={`pe-sidebar-link ${isDashboard ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/home-03.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Overview</span>
        </div>
      </Link>

        <Link href={ordersHref} className={`pe-sidebar-link ${isOrders ? 'is-active' : ''}`}>
            <div className="text">
                <img src="/img/shopping-cart-01.svg" alt="" className="pe-icon pe-icon--inline"/>
                <span>Orders</span>
            </div>
        </Link>

        <Link href={analyticsHref} onClick={handleAnalyticsClick} className={`pe-sidebar-link ${isAnalytics ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/bar-chart-square-01.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Analytics</span>
        </div>
        {showSoonAnalytics && <div key={analyticsKey} className="soon soon--fade">Soon</div>}
      </Link>

      <h3 className="pe-sidebar-subtitle">Tools</h3>

      <Link href={productsHref} className={`pe-sidebar-link ${isProducts ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/shopping-bag-02.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Products</span>
        </div>
      </Link>

      <Link href={categoriesHref} className={`pe-sidebar-link ${isCategories ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/tag-01.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Categories</span>
        </div>
      </Link>

        <Link href={inventoryHref} onClick={handleInventoryClick} className={`pe-sidebar-link ${isInventory ? 'is-active' : ''}`}>
            <div className="text">
                <img src="/img/box.svg" alt="" className="pe-icon pe-icon--inline"/>
                <span>Inventory</span>
            </div>
            {showSoonInventory && <div key={inventoryKey} className="soon soon--fade">Soon</div>}
        </Link>

        <h3 className="pe-sidebar-subtitle">Advanced</h3>

      <Link href={settingsHref} className={`pe-sidebar-link ${isSettings ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/settings-01.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Settings</span>
        </div>
      </Link>

      <Link href={`/dashboard/${shopId}/help`} className={`pe-sidebar-link ${isHelp ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/help-circle.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Get help</span>
        </div>
      </Link>
    </aside>
  )
}
