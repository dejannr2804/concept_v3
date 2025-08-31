"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
// Shop dashboard shows read-only info and links to manage pages

type Shop = { id: number; name: string }
type Product = { id: number; name: string; description?: string }

export default function ShopDashboardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Load shop details
    fetch(`/api/shops/${id}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to load shop')
        return r.json()
      })
      .then((data: Shop) => {
        if (!cancelled) {
          setShop(data)
          setError(null)
        }
      })
      .catch((e) => !cancelled && setError(e.message || 'Failed to load shop'))
      .finally(() => !cancelled && setLoading(false))

    // Load products for this shop
    fetch(`/api/shops/${id}/products`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to load products')
        return r.json()
      })
      .then((data: Product[]) => {
        if (!cancelled) setProducts(data)
      })
      .catch(() => !cancelled && setProducts([]))
    return () => {
      cancelled = true
    }
  }, [id])

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
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : shop ? (
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Name</div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{shop.name}</div>
            </div>
            <Link href={`/dashboard/${shop.id}/manage`} style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage Shop</Link>
          </div>
        ) : (
          <div>Shop not found.</div>
        )}
        <div className="spacer" />
        {shop && (
          <div className="col" style={{ gap: '0.75rem' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Products</h2>
              <Link href={`/dashboard/${shop.id}/products/new`}>Create Product</Link>
            </div>
            {products === null ? (
              <div>Loading products...</div>
            ) : products.length === 0 ? (
              <div>No products yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {products.map((p) => (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ opacity: 0.8, marginTop: 4 }}>{p.description}</div>}
                    </div>
                    <Link href={`/dashboard/${shop.id}/products/${p.id}`} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage</Link>
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
