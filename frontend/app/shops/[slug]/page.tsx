"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Product = { id: number; name: string; slug: string; description?: string }
type Shop = { id: number; name: string; slug: string; description?: string; products: Product[] }

export default function PublicShopPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<Shop>(`shops/slug/${slug}`)
        if (!cancelled) setShop(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load shop')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <div style={{ padding: '1rem' }}>Loading…</div>
  if (error) return <div className="error" style={{ padding: '1rem' }}>{error}</div>
  if (!shop) return <div style={{ padding: '1rem' }}>Shop not found.</div>

  return (
    <main style={{ maxWidth: 800, margin: '1rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>{shop.name}</h1>
        {shop.description ? (
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{shop.description}</p>
        ) : (
          <p style={{ color: '#6b7280', marginTop: 0 }}>No description provided.</p>
        )}
        <div style={{ height: 1, background: '#e5e7eb', margin: '0.5rem 0 1rem' }} />
        <h2 style={{ margin: 0 }}>Products</h2>
        {shop.products && shop.products.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {shop.products.map((p) => (
              <li key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                <div style={{ fontWeight: 600 }}>
                  <a href={`/shops/${shop.slug}/products/${p.slug}`} style={{ color: '#111827', textDecoration: 'none' }}>{p.name}</a>
                </div>
                {p.description && <div style={{ color: '#374151', marginTop: 4 }}>{p.description}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <div>No products yet.</div>
        )}
      </div>
    </main>
  )
}
