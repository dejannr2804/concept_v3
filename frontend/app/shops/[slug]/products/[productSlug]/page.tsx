"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import LoaderStatus from '@/components/LoaderStatus'
import type { Product as ShopProduct, ProductImage } from '@/lib/shops/types'

type Product = ShopProduct

const parseAmount = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const formatMoney = (value: number | null, currency?: string | null): string => {
  if (value === null) return ''
  const code = currency || 'USD'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).format(value)
  } catch {
    return `${code} ${value.toFixed(2)}`
  }
}

export default function PublicProductPage({ params }: { params: { slug: string; productSlug: string } }) {
  const { slug: shopSlug, productSlug } = params
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<Product>(`shops/slug/${shopSlug}/products/${productSlug}`)
        if (!cancelled) setProduct(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load product')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shopSlug, productSlug])

  useEffect(() => {
    if (loading) {
      document.title = 'Loading product…'
      return
    }
    if (error) {
      document.title = 'Product – Error'
      return
    }
    if (product) {
      document.title = product.name || 'Product'
    } else {
      document.title = 'Product not found'
    }
  }, [loading, error, product])

  if (loading) return <LoaderStatus label="Loading product" delay={1000} />
  if (error) return <div className="error p-4">{error}</div>
  if (!product) return <div className="p-4">Product not found.</div>

  const images: ProductImage[] = (product.images || []).slice().sort((a, b) => a.sort_order - b.sort_order)
  const mainImage = images[activeIndex] || images[0]

  const base = parseAmount(product.base_price)
  const discount = parseAmount(product.discounted_price)
  const hasDiscount = discount !== null && base !== null && discount < base
  const primary = discount ?? base
  const currency = product.currency || 'USD'
  const priceText = formatMoney(primary, currency)
  const originalText = hasDiscount && base !== null ? formatMoney(base, currency) : ''

  const stockLabel = product.stock_status === 'in_stock' ? 'In stock' : 'Out of stock'

  return (
    <main className="public-product">
      <div className="pp-breadcrumbs">
        <Link href={`/shops/${shopSlug}`}>Home</Link>
        <span> / </span>
        <Link href={`/shops/${shopSlug}/products`}>Products</Link>
        <span> / </span>
        <span>{product.name}</span>
      </div>
      {/* Left: Gallery */}
      <section className="pp-gallery" aria-label="Product media">
        <div className="pp-main">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage.url} alt={mainImage.alt_text || product.name} />
          ) : (
            <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>Image coming soon</div>
          )}
        </div>
        <div className="pp-thumbs">
          {(images.length ? images : [null, null, null, null]).slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              type="button"
              className={`pp-thumb${idx === activeIndex ? ' is-active' : ''}`}
              onClick={() => img && setActiveIndex(idx)}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt={img.alt_text || product.name} />
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {/* Right: Info */}
      <section className="pp-info">
        <div className="pp-category">{product.category || 'Category'}</div>
        <h1 className="pp-title">{product.name}</h1>

        <div className="pp-price">
          {priceText}
          {originalText ? <span className="muted">{originalText}</span> : null}
        </div>

        {/* Removed color and size pickers per request */}

        <div className="pp-actions">
          <button type="button" className="pp-addToCart">Add to cart</button>
        </div>

        {/* Removed delivery/extra meta per request */}

        {product.description ? (
          <p className="pre-wrap" style={{marginTop: 12}}>{product.description}</p>
        ) : null}
      </section>
    </main>
  )
}
