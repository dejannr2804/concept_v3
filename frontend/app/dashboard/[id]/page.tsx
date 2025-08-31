"use client"
import Link from 'next/link'
// Shop dashboard shows read-only info and links to manage pages
import { useResourceItem, useResourceList } from '@/hooks/resource'

type Shop = { id: number; name: string }
type Product = { id: number; name: string; description?: string }

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
          <h1>Shop</h1>
          <Link href="/dashboard">Back to Dashboard</Link>
        </div>
        <div className="spacer" />
        {shop.loading ? (
          <div>Loading...</div>
        ) : shop.error ? (
          <div className="error">{shop.error}</div>
        ) : shop.data ? (
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Name</div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{shop.data.name}</div>
            </div>
            <Link href={`/dashboard/${shop.data.id}/manage`} style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage Shop</Link>
          </div>
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
                      {p.description && <div style={{ opacity: 0.8, marginTop: 4 }}>{p.description}</div>}
                    </div>
                    <Link href={`/dashboard/${shop.data.id}/products/${p.id}`} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage</Link>
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
