"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Product = { id: number; name: string; slug: string; description?: string }
type Shop = { id: number; name: string; slug: string; description?: string; profile_image_url?: string; products: Product[] }

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

  if (loading) return <div className="p-4">Loading…</div>
  if (error) return <div className="error p-4">{error}</div>
  if (!shop) return <div className="p-4">Shop not found.</div>

  return (
    <main className="container">
      <div className="col gap-075">
        <div className="row gap-05" style={{ alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#eee', border: '1px solid #e5e7eb' }}>
            {shop.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <h1 className="m-0">{shop.name}</h1>
        </div>
        {shop.description ? (
          <p className="pre-wrap m-0">{shop.description}</p>
        ) : (
          <p className="text-muted m-0">No description provided.</p>
        )}
        <div className="divider" />
        <h2 className="m-0">Products</h2>
        {shop.products && shop.products.length > 0 ? (
          <ul className="list">
            {shop.products.map((p) => (
              <li key={p.id} className="list-item">
                <div className="fw-600">
                  <a href={`/shops/${shop.slug}/products/${p.slug}`}>{p.name}</a>
                </div>
                {p.description && <div className="mt-4 text-secondary">{p.description}</div>}
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
