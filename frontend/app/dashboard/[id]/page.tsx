"use client"
import Link from 'next/link'
// Shop dashboard shows read-only info and links to manage pages
import { useResourceItem } from '@/hooks/resource'

type Shop = { id: number; name: string; slug: string }
  type Product = {
    id: number
    name: string
    slug: string
    sku: string
    category?: string | null
    status: 'active' | 'inactive'
    short_description?: string
    description?: string
    base_price?: number
    discounted_price?: number | null
  currency?: string
  stock_quantity?: number
  stock_status?: 'in_stock' | 'out_of_stock'
}

export default function ShopDashboardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const shop = useResourceItem<Shop>(`shops/${id}`)
  

  // Product management is available in per-product pages

  // Product creation moved to a dedicated page

  return (
    <main className="container">
      <div className="card">
        <div className="row row-between">
          <div className="row">
            <Link href="/dashboard" className="btn btn-secondary">
              Back
            </Link>
            <h1 className="m-0">{shop.data ? shop.data.name : 'Shop'}</h1>
          </div>
          {shop.data && (
            <div className="row gap-05">
              <Link href={`/shops/${shop.data.slug}`} className="btn btn-secondary">
                View
              </Link>
              <Link href={`/dashboard/${shop.data.id}/manage`} className="btn btn-secondary">
                Manage
              </Link>
            </div>
          )}
        </div>
        <div className="spacer" />
        {shop.loading ? (
          <div>Loading...</div>
        ) : shop.error ? (
          <div className="error">{shop.error}</div>
        ) : shop.data ? (
          <>
            <div className="col gap-1">
              <div className="card">
                <h2 className="m-0">Overview</h2>
                <div className="spacer" />
                <div className="text-muted">Shop info, KPIs, and quick stats will appear here.</div>
              </div>
              <div className="card">
                <h2 className="m-0">Graphs</h2>
                <div className="spacer" />
                <div className="text-muted">Sales, traffic, and performance graphs will be shown here.</div>
              </div>
            </div>
          </>
        ) : (
          <div>Shop not found.</div>
        )}
        
      </div>
    </main>
  )
}
