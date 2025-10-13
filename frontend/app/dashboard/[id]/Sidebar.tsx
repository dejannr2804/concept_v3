"use client"
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { useResourceItem, useResourceList } from '@/hooks/resource'
import { useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getPlanFeatures } from '@/lib/plans'
import UsageMeter from '@/components/UsageMeter'

export default function Sidebar({ shopId }: { shopId: string }) {
  const pathname = usePathname()
  const shop = useResourceItem<{ id: number; name: string; slug?: string }>(`shops/${shopId}`)
  const products = useResourceList<{ id: number }>(`shops/${shopId}/products`)
  const { user } = useAuth()

  // Show "Soon" badges on click for 5 seconds
  const [showSoonAnalytics, setShowSoonAnalytics] = useState(false)
  const [showSoonInventory, setShowSoonInventory] = useState(false)
  const [analyticsKey, setAnalyticsKey] = useState(0)
  const [inventoryKey, setInventoryKey] = useState(0)
  const [helpKey, setHelpKey] = useState(0)
  const analyticsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inventoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const helpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dashboardHref = `/dashboard/${shopId}` as Route
  const ordersHref = `/dashboard/${shopId}/orders` as Route
  const analyticsHref = `/dashboard/${shopId}/analytics` as Route
  const productsHref = `/dashboard/${shopId}/products` as Route
  const categoriesHref = `/dashboard/${shopId}/categories` as Route
  const inventoryHref = `/dashboard/${shopId}/inventory` as Route
  const settingsHref = `/dashboard/${shopId}/manage` as Route
  const helpHref = `/dashboard/${shopId}/help` as Route

  const isDashboard = pathname === dashboardHref
  const isOrders = pathname.startsWith(ordersHref)
  const isAnalytics = pathname.startsWith(analyticsHref)
  const isProducts = pathname.startsWith(productsHref)
  const isCategories = pathname.startsWith(categoriesHref)
  const isInventory = pathname.startsWith(inventoryHref)
  const isSettings = pathname.startsWith(settingsHref)
  const isHelp = pathname.startsWith(helpHref)
  const [showSoonHelp, setShowSoonHelp] = useState(false)

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

  const handleHelpClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setShowSoonHelp(true)
    setHelpKey((k) => k + 1)
    if (helpTimerRef.current) clearTimeout(helpTimerRef.current)
    helpTimerRef.current = setTimeout(() => setShowSoonHelp(false), 5000)
  }

  return (
    <aside className="pe-sidebar">
      <Link href={`/dashboard`} className="pe-sidebar-link pe-sidebar-link--back">
        <div className="text">
          <img src="/img/arrow-narrow-left.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>All shops</span>
        </div>
      </Link>

      {shop.data?.slug ? (
        <h2 className="pe-sidebar-title">
          <Link href={`/shops/${shop.data.slug}`} target="_blank" rel="noreferrer">
            {shop.data?.name || 'Shop'}
            <img src="/img/arrow-narrow-up-right-d.svg" alt="" className="pe-icon pe-icon--inline" />
          </Link>
        </h2>
      ) : (
        <h2 className="pe-sidebar-title">{shop.data?.name || 'Shop'}</h2>
      )}
      <h3 className="pe-sidebar-subtitle">Menu</h3>

      <Link href={dashboardHref} className={`pe-sidebar-link ${isDashboard ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/home-03.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Overview</span>
        </div>
      </Link>

      <Link href={ordersHref} className={`pe-sidebar-link ${isOrders ? 'is-active' : ''}`}>
        <div className="text">
          <img src="/img/shopping-cart-01.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Orders</span>
        </div>
      </Link>

      <Link
        href={analyticsHref}
        onClick={handleAnalyticsClick}
        className={`pe-sidebar-link ${isAnalytics ? 'is-active' : ''}`}
      >
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
      <Link
        href={inventoryHref}
        onClick={handleInventoryClick}
        className={`pe-sidebar-link ${isInventory ? 'is-active' : ''}`}
      >
        <div className="text">
          <img src="/img/box.svg" alt="" className="pe-icon pe-icon--inline" />
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

      <Link
        href={helpHref}
        onClick={handleHelpClick}
        className={`pe-sidebar-link ${isHelp ? 'is-active' : ''}`}
      >
        <div className="text">
          <img src="/img/help-circle.svg" alt="" className="pe-icon pe-icon--inline" />
          <span>Get help</span>
        </div>
        {showSoonHelp && <div key={helpKey} className="soon soon--fade">Soon</div>}
      </Link>

        <div className="dashed-line"></div>

      {/* Usage summary */}
      <div className="pe-sidebar-subtitle">Usage</div>
      {(() => {
        const features = getPlanFeatures(user?.account_type)
        const used = products.data?.length ?? 0
        const max = features.maxProductsPerShop
        if (products.loading) {
          return <div className="pe-sidebar-muted">Products: loading…</div>
        }
        if (max === null) {
          return <div className="pe-sidebar-muted">Products: {used} used (unlimited)</div>
        }
        return (
          <UsageMeter label="Products" used={used} max={max} />
        )
      })()}
    </aside>
  )
}
