"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'
import { useResourceList } from '@/hooks/resource'
import type { Product, ProductInventoryItem, ProductVariantSelection } from '@/lib/shops/types'
import { api } from '@/lib/api'

function rowKey(productId: number, item: ProductInventoryItem | null, optionKey?: string) {
  if (item?.id) return `${productId}:${item.id}`
  if (optionKey) return `${productId}:${optionKey}`
  return `${productId}:base`
}

type InventoryProduct = Product & {
  inventory_items?: ProductInventoryItem[]
  stock_quantity?: number | null
  stock_status?: 'in_stock' | 'limited' | 'out_of_stock'
  status: 'active' | 'inactive'
  variant_types?: NonNullable<Product['variant_types']>
}

type VariantCombo = {
  optionKey: string
  options: ProductVariantSelection[]
  item: ProductInventoryItem | null
  label: string
  sku: string
}

type InventoryPayloadRow = {
  id?: number
  sku: string
  stock_quantity: number
  price_override: string | null
  is_active: boolean
  is_default: boolean
  options: { variant_type_id: number; variant_option_id: number }[]
}

function buildOptionKey(options: ProductVariantSelection[]) {
  return options
    .slice()
    .sort((a, b) => a.variant_type_id - b.variant_type_id)
    .map((opt) => `${opt.variant_type_id}:${opt.variant_option_id}`)
    .join('|')
}

function optionsMatch(a: ProductVariantSelection[] | undefined, b: ProductVariantSelection[]) {
  if (!a || a.length !== b.length) return false
  const sortedA = a.slice().sort((x, y) => x.variant_type_id - y.variant_type_id)
  const sortedB = b.slice().sort((x, y) => x.variant_type_id - y.variant_type_id)
  return sortedA.every((opt, idx) =>
    opt.variant_type_id === sortedB[idx].variant_type_id &&
    opt.variant_option_id === sortedB[idx].variant_option_id
  )
}

function computeVariantCombos(product: InventoryProduct): VariantCombo[] {
  const variantTypes = (product.variant_types || []).filter((vt) => (vt.options || []).length > 0)
  if (variantTypes.length === 0) return []

  const combos: VariantCombo[] = []
  const acc: ProductVariantSelection[] = []

  const walk = (index: number) => {
    if (index === variantTypes.length) {
      const options = acc.map((opt) => ({ ...opt }))
      const optionKey = buildOptionKey(options)
      const existing = (product.inventory_items || []).find((item) => optionsMatch(item.options, options)) || null
      const label = existing?.option_label || options.map((opt) => `${opt.variant_type_name}: ${opt.variant_option_name}`).join(' / ')
      const sku = existing?.sku || product.sku || ''
      combos.push({ optionKey, options, item: existing, label, sku })
      return
    }
    const variant = variantTypes[index]
    const variantOptions = variant.options || []
    variantOptions.forEach((option) => {
      acc.push({
        variant_type_id: variant.id,
        variant_type_name: variant.name,
        variant_option_id: option.id,
        variant_option_name: option.name,
      })
      walk(index + 1)
      acc.pop()
    })
  }

  walk(0)
  return combos
}

export default function InventoryPageClient({ params }: { params: { id: string } }) {
  const { id: shopId } = params
  const products = useResourceList<InventoryProduct>(`shops/${shopId}/products`)
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    const next: Record<string, number> = {}
    products.data?.forEach((product) => {
      const combos = computeVariantCombos(product)
      if (combos.length > 0) {
        combos.forEach((combo) => {
          const key = rowKey(product.id, combo.item, combo.optionKey)
          next[key] = combo.item?.stock_quantity ?? 0
        })
      } else {
        next[rowKey(product.id, null)] = product.stock_quantity ?? 0
      }
    })
    setDraftQuantities(next)
  }, [products.data])

  if (products.loading) {
    return <DashboardLoadingPlaceholder />
  }

  const list = (products.data || []).filter((product) => product.stock_status === 'limited')

  const handleQuantityChange = (key: string, value: number) => {
    const sanitized = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
    setDraftQuantities((prev) => ({ ...prev, [key]: sanitized }))
  }

  const applyBaseQuantity = async (product: InventoryProduct, key: string, rawValue?: number) => {
    const target = rawValue !== undefined ? rawValue : draftQuantities[key]
    const current = product.stock_quantity ?? 0
    const quantity = Math.max(0, Math.floor(target))
    if (quantity === current) return
    setPageError(null)
    setPending((prev) => ({ ...prev, [key]: true }))
    try {
      await api.patch(`shops/${shopId}/products/${product.id}`, {
        stock_quantity: quantity,
        stock_status: quantity > 0 ? 'limited' : 'out_of_stock',
      })
      products.notify.success('Inventory updated')
      products.refresh()
    } catch (err: any) {
      const message = err?.message || 'Unable to update inventory'
      setPageError(message)
      products.notify.error(message)
    } finally {
      setPending((prev) => ({ ...prev, [key]: false }))
    }
  }

  const applyVariantQuantity = async (product: InventoryProduct, combo: VariantCombo, key: string, rawValue?: number) => {
    const target = rawValue !== undefined ? rawValue : draftQuantities[key]
    const current = combo.item?.stock_quantity ?? 0
    const quantity = Math.max(0, Math.floor(target))
    if (quantity === current) return
    setPageError(null)
    setPending((prev) => ({ ...prev, [key]: true }))
    try {
      const combos = computeVariantCombos(product)
      const payload = combos.reduce<InventoryPayloadRow[]>((acc, entry, index) => {
        const isTarget = entry.optionKey === combo.optionKey
        const existing = entry.item
        if (!existing && !isTarget) return acc
        acc.push({
          id: existing?.id,
          sku: existing?.sku || product.sku || '',
          stock_quantity: isTarget ? quantity : existing?.stock_quantity ?? 0,
          price_override: existing?.price_override ?? null,
          is_active: existing?.is_active ?? true,
          is_default: existing?.is_default ?? false,
          options: entry.options.map((opt) => ({
            variant_type_id: opt.variant_type_id,
            variant_option_id: opt.variant_option_id,
          })),
        })
        return acc
      }, [] as Array<{ id: number | undefined; sku: string; stock_quantity: number; price_override: any; is_active: boolean; is_default: boolean; options: { variant_type_id: number; variant_option_id: number }[] }>)
      if (payload.length && !payload.some((entry) => entry.is_default)) {
        payload[0].is_default = true
      }
      const targetIndex = payload.findIndex((entry) => entry.options.every((opt, idx) => opt.variant_type_id === combo.options[idx].variant_type_id && opt.variant_option_id === combo.options[idx].variant_option_id))
      if (targetIndex >= 0 && combo.item && typeof combo.item.is_active === 'boolean') {
        payload[targetIndex].is_active = combo.item.is_active
      }
      await api.patch(`shops/${shopId}/products/${product.id}`, { inventory_items: payload })
      products.notify.success('Inventory updated')
      products.refresh()
    } catch (err: any) {
      const message = err?.message || 'Unable to update inventory'
      setPageError(message)
      products.notify.error(message)
    } finally {
      setPending((prev) => ({ ...prev, [key]: false }))
    }
  }

  const toggleVariantActive = async (product: InventoryProduct, combo: VariantCombo, key: string) => {
    setPageError(null)
    setPending((prev) => ({ ...prev, [key]: true }))
    const draftValue = draftQuantities[key] ?? combo.item?.stock_quantity ?? 0
    try {
      const combos = computeVariantCombos(product)
      const payload = combos.reduce<InventoryPayloadRow[]>((acc, entry, index) => {
        const existing = entry.item
        if (!existing && entry.optionKey !== combo.optionKey) return acc
        const isTarget = entry.optionKey === combo.optionKey
        const currentActive = existing?.is_active ?? true
        acc.push({
          id: existing?.id,
          sku: existing?.sku || product.sku || '',
          stock_quantity: isTarget ? draftValue : existing?.stock_quantity ?? 0,
          price_override: existing?.price_override ?? null,
          is_active: isTarget ? !currentActive : currentActive,
          is_default: existing?.is_default ?? false,
          options: entry.options.map((opt) => ({
            variant_type_id: opt.variant_type_id,
            variant_option_id: opt.variant_option_id,
          })),
        })
        return acc
      }, [] as Array<{ id: number | undefined; sku: string; stock_quantity: number; price_override: any; is_active: boolean; is_default: boolean; options: { variant_type_id: number; variant_option_id: number }[] }>)
      if (payload.length && !payload.some((entry) => entry.is_default)) {
        payload[0].is_default = true
      }
      await api.patch(`shops/${shopId}/products/${product.id}`, { inventory_items: payload })
      products.notify.success('Inventory updated')
      products.refresh()
    } catch (err: any) {
      const message = err?.message || 'Unable to update inventory'
      setPageError(message)
      products.notify.error(message)
    } finally {
      setPending((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="inventory-page dlp-fadeIn">
      <header className="inventory-header">
        <div>
          <h1>Inventory</h1>
          <p>Adjust stock levels for each product and variation.</p>
        </div>
      </header>

      {pageError ? <div className="inventory-error">{pageError}</div> : null}

      {list.length === 0 ? (
        <div className="inventory-empty">
          <p>No limited-stock products yet.</p>
          <Link href={`/dashboard/${shopId}/products/new`} className="cart-btn-primary cart-btn-inline">
            Create product
          </Link>
        </div>
      ) : (
        <div className="inventory-grid">
          {list.map((product) => {
            const combos = computeVariantCombos(product)
            const hasVariantRows = combos.length > 0
            return (
              <section key={product.id} className="inventory-card">
              <header className="inventory-card-header">
                <div>
                  <div className="inventory-card-titleRow">
                    <h2>{product.name}</h2>
                    <span className={`inventory-status inventory-status--${product.status}`}>{product.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </div>
                  <span className="inventory-product-sku">SKU: {product.sku}</span>
                </div>
                <Link href={`/dashboard/${shopId}/products/${product.id}`} className="inventory-manage-link">
                  <img src="/img/settings-01-l.svg" alt="" className="nav-icon" />
                  <span>Edit</span>
                </Link>
              </header>

              {(() => {
                if (hasVariantRows) {
                  return (
                    <div className="inventory-rows">
                      {combos.map((combo) => {
                        const key = rowKey(product.id, combo.item, combo.optionKey)
                        const current = combo.item?.stock_quantity ?? 0
                        const draft = draftQuantities[key] ?? current
                        const isPending = pending[key]
                        const isActive = combo.item?.is_active ?? true
                        return (
                          <article key={combo.optionKey} className="inventory-row">
                            <div className="inventory-row-info">
                              <div className="inventory-row-title">
                                <strong>{combo.label}</strong>
                                <button
                                  type="button"
                                  className={`inventory-active-toggle ${isActive ? 'is-active' : 'is-inactive'}`}
                                  onClick={() => toggleVariantActive(product, combo, key)}
                                  disabled={isPending}
                                >
                                  {isActive ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                            </div>
                            <div className="inventory-row-controls">
                              <div className="inventory-qty-input">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = Math.max(0, draft - 1)
                                    handleQuantityChange(key, next)
                                    applyVariantQuantity(product, combo, key, next)
                                  }}
                                  aria-label="Decrease quantity"
                                  disabled={isPending || draft <= 0}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={draft}
                                  onChange={(e) => handleQuantityChange(key, Number(e.target.value))}
                                  onBlur={(e) => applyVariantQuantity(product, combo, key, Number(e.currentTarget.value))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur()
                                    }
                                  }}
                                  disabled={isPending}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = draft + 1
                                    handleQuantityChange(key, next)
                                    applyVariantQuantity(product, combo, key, next)
                                  }}
                                  aria-label="Increase quantity"
                                  disabled={isPending}
                                >
                                  +
                                </button>
                              </div>
                              <span className="inventory-qty-label">{draft} in stock</span>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )
                }
                const key = rowKey(product.id, null)
                const current = product.stock_quantity ?? 0
                const draft = draftQuantities[key] ?? current
                const isPending = pending[key]
                const simpleStatus = product.stock_status === 'limited'
                  ? (draft > 0 ? 'Limited stock' : 'Out of stock')
                  : (product.stock_status === 'in_stock' ? 'In stock' : 'Out of stock')
                return (
                  <div className="inventory-rows">
                    <article className="inventory-row">
                      <div className="inventory-row-info">
                        <div className="inventory-row-title">
                          <strong>Default stock</strong>
                          <span className="inventory-simple-status">{simpleStatus}</span>
                        </div>
                      </div>
                      <div className="inventory-row-controls">
                        <div className="inventory-qty-input">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(0, draft - 1)
                              handleQuantityChange(key, next)
                              applyBaseQuantity(product, key, next)
                            }}
                            aria-label="Decrease quantity"
                            disabled={isPending || draft <= 0}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={draft}
                            onChange={(e) => handleQuantityChange(key, Number(e.target.value))}
                            onBlur={(e) => applyBaseQuantity(product, key, Number(e.currentTarget.value))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            disabled={isPending}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = draft + 1
                              handleQuantityChange(key, next)
                              applyBaseQuantity(product, key, next)
                            }}
                            aria-label="Increase quantity"
                            disabled={isPending}
                          >
                            +
                          </button>
                        </div>
                        <span className="inventory-qty-label">{draft} in stock</span>
                      </div>
                    </article>
                  </div>
                )
              })()}
            </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
