import Link from 'next/link'
import type { Product, ProductImage } from '@/lib/shops/types'
import { DEFAULT_CURRENCY } from '@/lib/currencies'

type ShopProductGridProps = {
  shopSlug: string
  products?: Product[] | null
  emptyMessage?: string
  // When set to 'compact', only show name and primary price
  infoMode?: 'full' | 'compact'
  // Optional currency code to format prices; falls back to product currency or default
  currency?: string | null
}

const FALLBACK_EMPTY_MESSAGE = 'No products yet.'

const getPrimaryImage = (product: Product): ProductImage | null => {
  if (!product.images || product.images.length === 0) return null
  const bySort = product.images.find((image) => image.sort_order === 1)
  return bySort || product.images[0]
}

const parseAmount = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatCurrency = (value: number | null | undefined, currency?: string | null): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  const code = currency || DEFAULT_CURRENCY
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).format(value)
  } catch (err) {
    return `${code} ${value.toFixed(2)}`
  }
}

export function ShopProductGrid({ shopSlug, products, emptyMessage = FALLBACK_EMPTY_MESSAGE, infoMode = 'full', currency }: ShopProductGridProps) {
  if (!products || products.length === 0) {
    return <p className="public-shop-empty">{emptyMessage}</p>
  }

  return (
    <ul className="public-shop-list">
      {products.map((product) => {
        const primaryImage = getPrimaryImage(product)
        const discountedValue = parseAmount(product.discounted_price)
        const baseValue = parseAmount(product.base_price)
        const hasDiscount = discountedValue !== null && baseValue !== null && discountedValue < baseValue
        const primaryPriceValue = discountedValue ?? baseValue
        const formattedPrimaryPrice = formatCurrency(primaryPriceValue, currency || product.currency)
        const formattedOriginalPrice = hasDiscount ? formatCurrency(baseValue, currency || product.currency) : null
        const description = infoMode === 'full' ? (product.short_description || product.description || '').trim() : ''
        const isInStock = product.stock_status === 'in_stock'
        const stockLabel = isInStock ? 'In stock' : 'Out of stock'

        return (
          <li key={product.id} className="public-shop-card">
            <Link href={`/shops/${shopSlug}/products/${product.slug}`} className="public-shop-cardLink">
              <div className="public-shop-cardImageWrapper">
                {primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.alt_text || product.name}
                    className="public-shop-cardImage"
                    loading="lazy"
                  />
                ) : (
                  <div className="public-shop-cardImagePlaceholder">Image coming soon</div>
                )}
                {/* Hover overlay with existing icon */}
                <div className="public-shop-cardOverlay" aria-hidden="true">
                  <img src="/img/arrow-narrow-up-right.svg" alt="" className="public-shop-cardOverlayIcon" />
                </div>
              </div>
              <div className="public-shop-cardBody">
                <div className="public-shop-cardTop">
                  <h3 className="public-shop-cardTitle">{product.name}</h3>
                  <div className="public-shop-cardPricing">
                    {formattedPrimaryPrice ? (
                      <span className={`public-shop-cardPrice${hasDiscount ? ' is-discounted' : ''}`}>
                        {formattedPrimaryPrice}
                      </span>
                    ) : null}
                    {formattedOriginalPrice ? (
                      <span className="public-shop-cardPriceOriginal">{formattedOriginalPrice}</span>
                    ) : null}
                  </div>
                </div>
                {description ? (
                  <p className="public-shop-cardDescription">{description}</p>
                ) : null}
                {infoMode === 'full' ? (
                  <div className="public-shop-cardMeta">
                    <span className={`public-shop-stock ${isInStock ? 'is-available' : 'is-out'}`}>
                      {stockLabel}
                    </span>
                    {product.category ? (
                      <span className="public-shop-badge">{product.category}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
