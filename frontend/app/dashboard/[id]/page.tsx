"use client"
import Link from 'next/link'
// Shop dashboard shows read-only info and links to manage pages
import { useResourceItem, useResourceList } from '@/hooks/resource'

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
  const products = useResourceList<Product>(`shops/${id}/products`)

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
          <></>
        ) : (
          <div>Shop not found.</div>
        )}
        <div className="spacer" />
        {shop.data && (
          <div className="col gap-075">
            <div className="row row-between">
              <h2>Products</h2>
              <Link href={`/dashboard/${shop.data.id}/products/new`}>Create Product</Link>
            </div>
            {products.loading || !products.data ? (
              <div>Loading products...</div>
            ) : products.data.length === 0 ? (
              <div>No products yet.</div>
            ) : (
              <ul className="list">
            {products.data.map((p) => (
              <li key={p.id} className="list-item row row-between gap-1">
                <div>
                  <div className="fw-600">{p.name}</div>
                  <div className="text-xs text-muted mt-2">
                    SKU: {p.sku}
                    {p.category ? (<><span className="ml-6">Category: {p.category}</span></>) : null}
                    <span className="ml-12">Status: {p.status}</span>
                  </div>
                  {(p.short_description || p.description) && (
                    <div className="o-85 mt-4">{p.short_description || p.description}</div>
                  )}
                  <div className="mt-4 text-sm">
                    <span>
                      Price: {p.discounted_price != null && p.discounted_price !== undefined ? (
                        <>
                          <strong>{p.currency || 'USD'} {Number(p.discounted_price).toFixed(2)}</strong>
                          <span className="text-muted ml-6 line-through">{p.currency || 'USD'} {Number(p.base_price || 0).toFixed(2)}</span>
                        </>
                      ) : (
                        <strong>{p.currency || 'USD'} {Number(p.base_price || 0).toFixed(2)}</strong>
                      )}
                    </span>
                    <span className="ml-12">
                      Stock: {p.stock_quantity ?? 0} ({p.stock_status === 'out_of_stock' ? 'Out of stock' : 'In stock'})
                    </span>
                  </div>
                </div>
                <div className="row gap-05">
                  <Link href={`/shops/${shop.data.slug}/products/${p.slug}`} className="btn btn-secondary">View</Link>
                  <Link href={`/dashboard/${shop.data.id}/products/${p.id}`} className="btn btn-secondary">Manage</Link>
                </div>
              </li>
            ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
