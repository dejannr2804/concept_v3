"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'
import { useResourceItem, useResourceList } from '@/hooks/resource'
import type { Product, ProductInventoryItem, Shop } from '@/lib/shops/types'
import { api } from '@/lib/api'

function rowKey(productId: number, item: ProductInventoryItem | null) {
  return item?.id ? `${productId}:${item.id}` : `${productId}:base`
}

type InventoryProduct = Product & {
  inventory_items?: ProductInventoryItem[]
  stock_quantity?: number | null
  stock_status?: 'in_stock' | 'out_of_stock'
  status: 'active' | 'inactive'
}

export default function InventoryPageClient({ params }: { params: { id: string } }) {
  const { id: shopId } = params
  const shop = useResourceItem<Shop>(`shops/${shopId}`)
  const products = useResourceList<InventoryProduct>(`shops/${shopId}/products`)
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    const next: Record<string, number> = {}
    products.data?.forEach((product) => {
      if (product.inventory_items && product.inventory_items.length > 0) {
        product.inventory_items.forEach((item) => {
          next[rowKey(product.id, item)] = item.stock_quantity ?? 0
        })
      } else {
        next[rowKey(product.id, null)] = product.stock_quantity ?? 0
      }
    })
    setDraftQuantities(next)
  }, [products.data])

  if (products.loading || shop.loading) {
    return <DashboardLoadingPlaceholder />
  }

  const list = products.data || []

  const handleQuantityChange = (product: InventoryProduct, item: ProductInventoryItem | null, value: number) => {
    const key = rowKey(product.id, item)
    const sanitized = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
    setDraftQuantities((prev) => ({ ...prev, [key]: sanitized }))
  }

  const applyQuantity = async (product: InventoryProduct, item: ProductInventoryItem | null, rawValue?: number) => {
    const key = rowKey(product.id, item)
    const target = rawValue !== undefined ? rawValue : draftQuantities[key]
    const current = item ? item.stock_quantity ?? 0 : product.stock_quantity ?? 0
    const quantity = Math.max(0, Math.floor(target))
    if (quantity === current) return
    setPageError(null)
    setPending((prev) => ({ ...prev, [key]: true }))
    try {
      if (product.inventory_items && product.inventory_items.length > 0 && item) {
        const payload = (product.inventory_items || []).map((it) => ({
          id: it.id,
          sku: it.sku || product.sku,
          stock_quantity: it.id === item.id ? quantity : it.stock_quantity ?? 0,
          price_override: it.price_override ?? null,
          is_active: it.id === item.id ? (it.is_active ?? true) : it.is_active ?? true,
          is_default: it.is_default ?? false,
          options: (it.options || []).map((opt) => ({
            variant_type_id: opt.variant_type_id,
            variant_option_id: opt.variant_option_id,
          })),
        }))
        await api.patch(`shops/${shopId}/products/${product.id}`, { inventory_items: payload })
      } else {
        await api.patch(`shops/${shopId}/products/${product.id}`, {
          stock_quantity: quantity,
          stock_status: quantity > 0 ? 'in_stock' : 'out_of_stock',
        })
      }
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

  const toggleActive = async (product: InventoryProduct, item: ProductInventoryItem) => {
    const key = rowKey(product.id, item)
    setPageError(null)
    setPending((prev) => ({ ...prev, [key]: true }))
    try {
      const payload = (product.inventory_items || []).map((it) => ({
        id: it.id,
        sku: it.sku || product.sku,
        stock_quantity: it.stock_quantity ?? 0,
        price_override: it.price_override ?? null,
        is_active: it.id === item.id ? !(item.is_active ?? true) : it.is_active ?? true,
        is_default: it.is_default ?? false,
        options: (it.options || []).map((opt) => ({
          variant_type_id: opt.variant_type_id,
          variant_option_id: opt.variant_option_id,
        })),
      }))
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
        <Link href={`/dashboard/${shopId}/products`} className="ghost-btn">
          <img src="/img/shopping-bag-02.svg" alt="" className="nav-icon" />
          <span>Manage products</span>
        </Link>
      </header>

      {pageError ? <div className="inventory-error">{pageError}</div> : null}

      {list.length === 0 ? (
        <div className="inventory-empty">
          <p>No products yet. Add a product to configure inventory.</p>
          <Link href={`/dashboard/${shopId}/products/new`} className="cart-btn-primary cart-btn-inline">
            Create product
          </Link>
        </div>
      ) : (
        <div className="inventory-grid">
          {list.map((product) => (
            <section key={product.id} className="inventory-card">
              <header className="inventory-card-header">
                <div>
                  <h2>{product.name}</h2>
                  <span className={`inventory-status inventory-status--${product.status}`}>{product.status === 'active' ? 'Active' : 'Inactive'}</span>
                </div>
                <Link href={`/dashboard/${shopId}/products/${product.id}`} className="inventory-manage-link">
                  <img src="/img/settings-01-l.svg" alt="" className="nav-icon" />
                  <span>Edit</span>
                </Link>
              </header>

              {product.inventory_items && product.inventory_items.length > 0 ? (
                <div className="inventory-rows">
                  {product.inventory_items.map((item) => {
                    const key = rowKey(product.id, item)
                    const current = item.stock_quantity ?? 0
                    const draft = draftQuantities[key] ?? current
                    const isPending = pending[key]
                    const isActive = item.is_active ?? true
                    return (
                      <article key={item.id} className="inventory-row">
                        <div className="inventory-row-info">
                          <div>
                            <strong>{item.option_label || 'Variant'}</strong>
                            <span className="inventory-row-sku">SKU: {item.sku || product.sku}</span>
                          </div>
                          <button
                            type="button"
                            className={`inventory-active-toggle ${isActive ? 'is-active' : 'is-inactive'}`}
                            onClick={() => toggleActive(product, item)}
                            disabled={isPending}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        <div className="inventory-row-controls">
                          <div className="inventory-qty-input">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.max(0, draft - 1)
                                handleQuantityChange(product, item, next)
                                applyQuantity(product, item, next)
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
                              onChange={(e) => handleQuantityChange(product, item, Number(e.target.value))}
                              onBlur={(e) => applyQuantity(product, item, Number(e.currentTarget.value))}
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
                                handleQuantityChange(product, item, next)
                                applyQuantity(product, item, next)
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
              ) : (
                <div className="inventory-rows">
                  {(() => {
                    const key = rowKey(product.id, null)
                    const current = product.stock_quantity ?? 0
                    const draft = draftQuantities[key] ?? current
                    const isPending = pending[key]
                    return (
                      <article className="inventory-row">
                        <div className="inventory-row-info">
                          <div>
                            <strong>Default stock</strong>
                            <span className="inventory-row-sku">SKU: {product.sku}</span>
                          </div>
                          <span className="inventory-simple-status">{product.stock_status === 'in_stock' ? 'In stock' : 'Out of stock'}</span>
                        </div>
                        <div className="inventory-row-controls">
                          <div className="inventory-qty-input">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.max(0, draft - 1)
                                handleQuantityChange(product, null, next)
                                applyQuantity(product, null, next)
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
                              onChange={(e) => handleQuantityChange(product, null, Number(e.target.value))}
                              onBlur={(e) => applyQuantity(product, null, Number(e.currentTarget.value))}
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
                                handleQuantityChange(product, null, next)
                                applyQuantity(product, null, next)
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
                  })()}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
