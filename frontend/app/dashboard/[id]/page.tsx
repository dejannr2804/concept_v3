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
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/dashboard"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}
            >
              Back
            </Link>
            <h1 style={{ margin: 0 }}>{shop.data ? shop.data.name : 'Shop'}</h1>
          </div>
          {shop.data && (
            <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <Link
                href={`/shops/${shop.data.slug}`}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}
              >
                View
              </Link>
              <Link
                href={`/dashboard/${shop.data.id}/manage`}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}
              >
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
          <div className="col" style={{ gap: '0.75rem' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Products</h2>
              <Link href={`/dashboard/${shop.data.id}/products/new`}>Create Product</Link>
            </div>
            {products.loading || !products.data ? (
              <div>Loading products...</div>
            ) : products.data.length === 0 ? (
              <div>No products yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {products.data.map((p) => (
              <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>SKU: {p.sku} • Status: {p.status}</div>
                  {(p.short_description || p.description) && (
                    <div style={{ opacity: 0.85, marginTop: 4 }}>{p.short_description || p.description}</div>
                  )}
                  <div style={{ marginTop: 4, fontSize: 13 }}>
                    <span>
                      Price: {p.discounted_price != null && p.discounted_price !== undefined ? (
                        <>
                          <strong>{p.currency || 'USD'} {Number(p.discounted_price).toFixed(2)}</strong>
                          <span style={{ color: '#6b7280', marginLeft: 6, textDecoration: 'line-through' }}>{p.currency || 'USD'} {Number(p.base_price || 0).toFixed(2)}</span>
                        </>
                      ) : (
                        <strong>{p.currency || 'USD'} {Number(p.base_price || 0).toFixed(2)}</strong>
                      )}
                    </span>
                    <span style={{ marginLeft: 12 }}>
                      Stock: {p.stock_quantity ?? 0} ({p.stock_status === 'out_of_stock' ? 'Out of stock' : 'In stock'})
                    </span>
                  </div>
                </div>
                <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/shops/${shop.data.slug}/products/${p.slug}`} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>View</Link>
                  <Link href={`/dashboard/${shop.data.id}/products/${p.id}`} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage</Link>
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
