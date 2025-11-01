"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import LoaderStatus from '@/components/LoaderStatus'
import type { Product as ShopProduct, ProductImage, ProductVariantType } from '@/lib/shops/types'
import { useShop } from '@/hooks/useShop'
import { DEFAULT_CURRENCY } from '@/lib/currencies'
import { useCart } from '@/components/cart/CartProvider'

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
  const { shop } = useShop(shopSlug)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const { addItem, submitting } = useCart()

  const variantTypes = useMemo<ProductVariantType[]>(() => {
    if (!product?.variant_types || product.variant_types.length === 0) return []
    return product.variant_types
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((variant) => ({
        ...variant,
        options: (variant.options ?? []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      }))
  }, [product])

  const isLimited = product?.stock_status === 'limited'
  const inventoryItems = useMemo(() => {
    if (!isLimited) return []
    return product?.inventory_items ?? []
  }, [product, isLimited])

  const selection = useMemo(() => {
    if (variantTypes.length === 0) return []
    const entries: { typeId: number; optionId: number }[] = []
    variantTypes.forEach((variant, idx) => {
      const options = variant.options ?? []
      if (!options.length) return
      const key = `${variant.id ?? idx}`
      const selectedIndex = selectedVariants[key] ?? 0
      const option = options[selectedIndex]
      if (option?.id) entries.push({ typeId: variant.id, optionId: option.id })
    })
    return entries
  }, [variantTypes, selectedVariants])

  const selectedInventory = useMemo(() => {
    if (!inventoryItems.length) return null
    if (!selection.length) {
      const preferred = inventoryItems.find((item) => item.is_default)
      return preferred || inventoryItems[0]
    }
    return (
      inventoryItems.find((item) =>
        selection.every((sel) =>
          (item.options || []).some(
            (opt) => opt.variant_type_id === sel.typeId && opt.variant_option_id === sel.optionId,
          ),
        ),
      ) || null
    )
  }, [inventoryItems, selection])

  useEffect(() => {
    setSelectedVariants((prev) => {
      const next: Record<string, number> = {}
      let changed = false
      variantTypes.forEach((variant, idx) => {
        const options = variant.options ?? []
        if (!options.length) return
        const key = `${variant.id ?? idx}`
        const prevIndex = prev[key]
        const nextIndex = typeof prevIndex === 'number' && prevIndex < options.length ? prevIndex : 0
        next[key] = nextIndex
        if (nextIndex !== prevIndex) changed = true
      })
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true
      return changed ? next : prev
    })
  }, [variantTypes])

  function selectVariant(key: string, optionIndex: number) {
    setSelectedVariants((prev) => ({ ...prev, [key]: optionIndex }))
  }

  const availableQuantity = isLimited
    ? (selectedInventory ? selectedInventory.stock_quantity ?? 0 : product?.stock_quantity ?? 0)
    : Number.MAX_SAFE_INTEGER
  const variantAvailable = isLimited
    ? selectedInventory?.is_available ?? (selectedInventory ? (selectedInventory.stock_quantity ?? 0) > 0 : undefined)
    : true
  const isAvailable = product ? (product.stock_status !== 'out_of_stock' && (!isLimited || availableQuantity > 0)) : false
  const maxQuantity = isLimited ? (availableQuantity > 0 ? availableQuantity : 1) : 99
  const requiresSelection = isLimited && inventoryItems.length > 0 && variantTypes.length > 0
  const selectionMissing = requiresSelection && !selectedInventory
  const disableAdd = selectionMissing || !isAvailable || submitting

  useEffect(() => {
    if (!isLimited) {
      if (quantity <= 0) setQuantity(1)
      return
    }
    if (availableQuantity > 0 && quantity > availableQuantity) {
      setQuantity(availableQuantity)
    }
    if (availableQuantity <= 0) {
      setQuantity(1)
    }
  }, [availableQuantity, quantity, isLimited])

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

  const incrementQuantity = useCallback(() => {
    setQuantity((prev) => Math.min(prev + 1, maxQuantity))
  }, [maxQuantity])

  const decrementQuantity = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }, [])

  const handleAddToCart = useCallback(async () => {
    if (!product) return
    if (requiresSelection && !selectedInventory) return
    try {
      await addItem({
        product_id: product.id,
        quantity: Math.max(1, Math.min(quantity, maxQuantity)),
        inventory_item_id: selectedInventory?.id ?? null,
        options: selection.map((entry) => ({
          variant_type_id: entry.typeId,
          variant_option_id: entry.optionId,
        })),
      })
      setQuantity(1)
    } catch {
      // errors handled by cart notifications
    }
  }, [product, requiresSelection, selectedInventory, addItem, quantity, maxQuantity, selection])

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
  const inventoryPrice = selectedInventory?.price ? parseAmount(Number(selectedInventory.price)) : null
  const primary = inventoryPrice ?? (discount ?? base)
  const hasDiscount = inventoryPrice === null && discount !== null && base !== null && discount < base
  const currency = shop?.currency || product.currency || DEFAULT_CURRENCY
  const priceText = formatMoney(primary, currency)
  const originalText = hasDiscount && base !== null ? formatMoney(base, currency) : ''

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
        <div
          className="pp-main"
          ref={containerRef}
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={(e) => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
            setZoomPos({ x, y })
          }}
        >
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={mainImage.url}
              alt={mainImage.alt_text || product.name}
              onLoad={(e) => {
                const i = e.currentTarget
                setImgSize({ w: i.naturalWidth, h: i.naturalHeight })
              }}
            />
          ) : (
            <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>Image coming soon</div>
          )}
          {isZooming && mainImage ? (
            <>
              <div
                className="pp-lens"
                style={{ left: zoomPos.x, top: zoomPos.y }}
              />
              <ZoomPopup imageUrl={mainImage.url} container={containerRef.current} pos={zoomPos} imgSize={imgSize} />
            </>
          ) : null}
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
        <div className="pp-starsRow" aria-hidden>
          <img src="/img/star-01.svg" alt="" />
          <img src="/img/star-01.svg" alt="" />
          <img src="/img/star-01.svg" alt="" />
          <img src="/img/star-01.svg" alt="" />
          <img src="/img/star-01.svg" alt="" />
          <span className="pp-ratingScore">4.8</span>
          <span className="pp-ratingCount">(42)</span>
        </div>

        <div className="pp-price">
          {priceText}
          {originalText ? <span className="muted">{originalText}</span> : null}
        </div>
        <div className={`pp-stockIndicator ${isAvailable ? 'is-available' : 'is-out'}`}>
          {isLimited ? (
            isAvailable ? `${availableQuantity} in stock` : 'Out of stock'
          ) : (
            product.stock_status === 'out_of_stock' ? 'Out of stock' : 'In stock'
          )}
        </div>

        {product.description ? (
          <p className="pre-wrap pp-description" style={{ marginTop: 12 }}>{product.description}</p>
        ) : null}

        {variantTypes.length > 0 ? (
          <div className="pp-variants">
            {variantTypes.map((variant, idx) => {
              const options = variant.options ?? []
              if (!options.length) return null
              const key = `${variant.id ?? idx}`
              const selectedIndex = selectedVariants[key] ?? 0
              return (
                <div className="pp-variant" key={key}>
                  <span className="pp-variantLabel">{variant.name}</span>
                  <div className="pp-variantOptions">
                    {options.map((option, optionIdx) => {
                      const optionLabel = option.name || option.value || `Option ${optionIdx + 1}`
                      const isSelected = selectedIndex === optionIdx
                      return (
                        <button
                          type="button"
                          key={option.id ?? `option-${optionIdx}`}
                          className={`pp-optionBtn${isSelected ? ' is-active' : ''}`}
                          onClick={() => selectVariant(key, optionIdx)}
                          aria-pressed={isSelected}
                        >
                          {optionLabel}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        <div className="pp-actions">
          <div className="pp-qtyControl" aria-label="Quantity">
            <button type="button" onClick={decrementQuantity} disabled={quantity <= 1 || submitting || !isAvailable}>−</button>
            <span>{quantity}</span>
            <button
              type="button"
              onClick={incrementQuantity}
              disabled={submitting || !isAvailable || quantity >= maxQuantity}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="pp-addToCart"
            onClick={handleAddToCart}
            disabled={disableAdd}
          >
            {selectionMissing ? 'Select options' : isAvailable ? (submitting ? 'Adding…' : 'Add to cart') : 'Out of stock'}
          </button>
        </div>
        {selectionMissing ? <p className="pp-selectionHint">Select all options to add this product to your cart.</p> : null}

        {/* Removed delivery/extra meta per request */}

        {/* description moved under price */}
      </section>
    </main>
  )
}

function ZoomPopup({ imageUrl, container, pos, imgSize }: { imageUrl: string; container: HTMLElement | null; pos: { x: number; y: number }; imgSize: { w: number; h: number } | null }) {
  if (!container) return null as any
  const box = { w: 260, h: 260 }
  const rect = container.getBoundingClientRect()
  const zoom = 2.5
  let bgW: number
  let bgH: number
  let px: number
  let py: number

  if (imgSize) {
    const s = rect.width // square container
    const r = imgSize.w / imgSize.h
    let coverW: number
    let coverH: number
    let offsetX = 0
    let offsetY = 0
    if (r >= 1) {
      // Landscape: height fits, width overflows
      coverH = s
      coverW = s * r
      offsetX = (coverW - s) / 2
    } else {
      // Portrait: width fits, height overflows
      coverW = s
      coverH = s / r
      offsetY = (coverH - s) / 2
    }
    bgW = coverW * zoom
    bgH = coverH * zoom
    const imgX = pos.x + offsetX
    const imgY = pos.y + offsetY
    px = imgX * zoom - box.w / 2
    py = imgY * zoom - box.h / 2
  } else {
    // Fallback to container-based zoom
    bgW = rect.width * zoom
    bgH = rect.height * zoom
    px = (pos.x / rect.width) * (bgW - box.w)
    py = (pos.y / rect.height) * (bgH - box.h)
  }

  // Clamp background position so we don't show empty space
  px = Math.max(0, Math.min(px, bgW - box.w))
  py = Math.max(0, Math.min(py, bgH - box.h))

  const style: React.CSSProperties = {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `-${px}px -${py}px`,
    // Smoothly snap between corners using transform
    transform: `translate(${pos.x < rect.width / 2 ? rect.width - 260 - 24 : 0}px, ${pos.y < rect.height / 2 ? rect.height - 260 - 24 : 0}px)`,
  }

  return <div className="pp-zoomPopup" style={style} />
}
