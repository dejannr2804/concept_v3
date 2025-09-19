"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoaderStatus from '@/components/LoaderStatus'
import { api } from '@/lib/api'
// Uses global styles from app/styles/shops.css

type ProductImage = { id: number; url: string; alt_text?: string | null; sort_order: number }
type Product = {
  id: number
  name: string
  slug: string
  short_description?: string | null
  description?: string | null
  base_price?: number | null
  discounted_price?: number | null
  currency?: string | null
  category?: string | null
  stock_status?: 'in_stock' | 'out_of_stock'
  stock_quantity?: number | null
  images?: ProductImage[]
}
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

  const getPrimaryImage = (product: Product) => {
    if (!product.images || product.images.length === 0) return null
    const bySort = product.images.find((i) => i.sort_order === 1)
    return bySort || product.images[0]
  }

  const formatCurrency = (value: number | null | undefined, currency?: string | null) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return null
    const code = currency || 'USD'
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol'
      }).format(value)
    } catch (e) {
      return `${code} ${value.toFixed(2)}`
    }
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
        <div className="public-shop-contentHeader">
          <h2>Products</h2>
          <p>Explore our curated selection. Each item is crafted to match the quality our customers expect.</p>
        </div>
        {shop.products && shop.products.length > 0 ? (
          <ul className="public-shop-list">
            {shop.products.map((p) => {
              const primaryImage = getPrimaryImage(p)
              const discountedValue = p.discounted_price !== null && p.discounted_price !== undefined
                ? Number((p.discounted_price as unknown) as any)
                : null
              const baseValue = p.base_price !== null && p.base_price !== undefined
                ? Number((p.base_price as unknown) as any)
                : null
              const hasDiscount = discountedValue !== null && baseValue !== null && discountedValue < baseValue
              const primaryPriceValue = discountedValue ?? baseValue
              const formattedPrimaryPrice = formatCurrency(primaryPriceValue, p.currency)
              const formattedOriginalPrice = hasDiscount ? formatCurrency(baseValue, p.currency) : null
              const description = (p.short_description || p.description || '').trim()
              const isInStock = p.stock_status === 'in_stock'
              const stockLabel = isInStock ? 'In stock' : 'Out of stock'

              return (
                <li key={p.id} className="public-shop-card">
                  <Link href={`/shops/${shop.slug}/products/${p.slug}`} className="public-shop-cardLink">
                    <div className="public-shop-cardImageWrapper">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryImage.url}
                          alt={primaryImage.alt_text || p.name}
                          className="public-shop-cardImage"
                        />
                      ) : (
                        <div className="public-shop-cardImagePlaceholder">
                          <span>No image</span>
                        </div>
                      )}
                    </div>
                    <div className="public-shop-cardBody">
                      <div className="public-shop-cardTop">
                        <h3 className="public-shop-cardTitle">{p.name}</h3>
                      </div>
                      {formattedPrimaryPrice ? (
                        <div className="public-shop-cardPricing">
                          <span className={`public-shop-cardPrice${hasDiscount ? ' is-discounted' : ''}`}>
                            {formattedPrimaryPrice}
                          </span>
                          {formattedOriginalPrice ? (
                            <span className="public-shop-cardPriceOriginal">{formattedOriginalPrice}</span>
                          ) : null}
                        </div>
                      ) : null}
                      {description ? (
                        <p className="public-shop-cardDescription">{description}</p>
                      ) : null}
                      <div className="public-shop-cardMeta">
                        {p.stock_status ? (
                          <span className={`public-shop-stock ${isInStock ? 'is-available' : 'is-out'}`}>
                            {stockLabel}
                            {isInStock && typeof p.stock_quantity === 'number' && p.stock_quantity > 0
                              ? ` - ${p.stock_quantity} available`
                              : ''}
                          </span>
                        ) : null}
                        {p.category ? (
                          <span className="public-shop-badge">{p.category}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="public-shop-empty">No products yet.</p>
        )}
      </section>
    </main>
  )
}
