"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import LoaderStatus from '@/components/LoaderStatus'
import { useCart } from '@/components/cart/CartProvider'

export default function ShopCartPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { cart, loading, submitting, updateQuantity, removeItem, refresh } = useCart()

  if (loading && !cart) {
    return <LoaderStatus label="Loading cart" delay={600} />
  }

  const items = cart?.items || []
  const currency = cart?.currency || 'USD'
  const subtotal = Number(cart?.subtotal_amount || 0)

  const breakdown = useMemo(() => ({
    subtotal,
    tax: 0,
    shipping: 0,
    total: subtotal,
  }), [subtotal])

  return (
    <main className="cart-page">
      <header className="cart-page-header">
        <div>
          <h1>Your cart</h1>
          <p>{items.length} item{items.length === 1 ? '' : 's'} in your bag.</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void refresh()} disabled={loading}>
          <img src="/img/refresh-cw.svg" alt="" className="nav-icon" />
          <span>Refresh</span>
        </button>
      </header>

      {items.length === 0 ? (
        <section className="cart-empty-state">
          <p>Your cart is empty.</p>
          <Link href={`/shops/${slug}/products`} className="cart-btn-primary cart-btn-inline">
            Continue shopping
          </Link>
        </section>
      ) : (
        <div className="cart-page-grid">
          <section className="cart-items">
            {items.map((item) => (
              <article key={item.id} className="cart-item-card">
                <div className="cart-item-media">
                  {item.product_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product_image.url} alt={item.product_image.alt_text || item.product_name} />
                  ) : (
                    <div className="cart-item-placeholder" aria-hidden />
                  )}
                </div>
                <div className="cart-item-content">
                  <div className="cart-item-top">
                    <div>
                      <h2>{item.product_name}</h2>
                      {item.option_label ? <p className="cart-item-variant">{item.option_label}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="cart-remove-link"
                      onClick={() => void removeItem(item.id).catch(() => undefined)}
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-qty-control">
                      <button
                        type="button"
                        onClick={() => void updateQuantity(item.id, Math.max(1, item.quantity - 1)).catch(() => undefined)}
                        disabled={item.quantity <= 1 || submitting}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => void updateQuantity(item.id, item.quantity + 1).catch(() => undefined)}
                        disabled={submitting}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <strong className="cart-item-price">
                      {formatMoney(item.subtotal_amount, item.currency || currency)}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary">
            <h2>Summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(breakdown.subtotal, currency)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{formatMoney(breakdown.tax, currency)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{breakdown.shipping === 0 ? 'Free' : formatMoney(breakdown.shipping, currency)}</dd>
              </div>
              <div className="cart-summary-total">
                <dt>Total</dt>
                <dd>{formatMoney(breakdown.total, currency)}</dd>
              </div>
            </dl>
            <Link href={`/shops/${slug}/checkout`} className="cart-btn-primary cart-summary-checkout">
              Proceed to checkout
            </Link>
            <Link href={`/shops/${slug}/products`} className="cart-btn-secondary cart-summary-continue">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  )
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value || 0)
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}
