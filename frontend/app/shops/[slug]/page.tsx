"use client"
import { useEffect, useState } from 'react'
import LoaderStatus from '@/components/LoaderStatus'
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

  if (loading) return <LoaderStatus label="Loading shop" />
  if (error) {
    return (
      <main>
        <p>{error}</p>
      </main>
    )
  }
  if (!shop) {
    return (
      <main>
        <p>Shop not found.</p>
      </main>
    )
  }

  return (
    <main>
      {shop.profile_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shop.profile_image_url} alt={`Profile image for ${shop.name}`} />
      ) : null}
      <h1>{shop.name}</h1>
      {shop.description ? <p>{shop.description}</p> : <p>No description provided.</p>}
      <h2>Products</h2>
      {shop.products && shop.products.length > 0 ? (
        <ul>
          {shop.products.map((p) => (
            <li key={p.id}>
              <a href={`/shops/${shop.slug}/products/${p.slug}`}>{p.name}</a>
              {p.description ? <p>{p.description}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No products yet.</p>
      )}
    </main>
  )
}
