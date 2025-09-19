"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoaderStatus from '@/components/LoaderStatus'
import { api } from '@/lib/api'
// Uses global styles from app/styles/shops.css

type Product = { id: number; name: string; slug: string; description?: string }
type Shop = {
  id: number
  name: string
  slug: string
  heading?: string | null
  profile_image_url?: string | null
  cover_image_url?: string | null
  products: Product[]
}

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

  if (loading) return <LoaderStatus label="Loading shop" delay={1000} />
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
    <main className="public-shop-page">
      {shop.cover_image_url ? (
        <section
          className="public-shop-cover"
          style={{ backgroundImage: `url(${shop.cover_image_url})` }}
          aria-label="Cover"
        >
          <div className="public-shop-overlay" />
          <div className="public-shop-coverContent">
            <div className="public-shop-brandRow">
              {shop.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.profile_image_url} alt="Logo" className="public-shop-logo" />
              ) : null}
              <div className="public-shop-brandName">{shop.name}</div>
            </div>
            <h1 className="public-shop-heading">{(shop.heading || shop.name) || ''}</h1>
          </div>
        </section>
      ) : (
        <section className="public-shop-cover" aria-label="Cover">
          <div className="public-shop-overlay" />
          <div className="public-shop-coverContent">
            <div className="public-shop-brandRow">
              {shop.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.profile_image_url} alt="Logo" className="public-shop-logo" />
              ) : null}
              <div className="public-shop-brandName">{shop.name}</div>
            </div>
            <h1 className="public-shop-heading">{(shop.heading || shop.name) || ''}</h1>
          </div>
        </section>
      )}

      <section className="public-shop-content">
        <h2>Products</h2>
        {shop.products && shop.products.length > 0 ? (
          <ul className="public-shop-list">
            {shop.products.map((p) => (
              <li key={p.id} className="public-shop-card">
                <Link href={`/shops/${shop.slug}/products/${p.slug}`} className="public-shop-link">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="public-shop-empty">No products yet.</p>
        )}
      </section>
    </main>
  )
}
