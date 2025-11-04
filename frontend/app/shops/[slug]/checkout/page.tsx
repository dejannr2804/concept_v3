"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import LoaderStatus from '@/components/LoaderStatus'
import { useCart } from '@/components/cart/CartProvider'
import { DEFAULT_CURRENCY } from '@/lib/currencies'
import { useShop } from '@/hooks/useShop'

type CheckoutForm = {
  customer_name: string
  customer_email: string
  customer_phone: string
  notes: string
  address_line1: string
  address_city: string
  address_postal_code: string
}

const EMPTY_FORM: CheckoutForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  notes: '',
  address_line1: '',
  address_city: '',
  address_postal_code: '',
}

export default function ShopCheckoutPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { cart, loading, submitting, checkout } = useCart()
  const { shop: shopInfo } = useShop(slug)
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = useState<{ order_number: string } | null>(null)

  const items = cart?.items || []
  const shopCurrency = shopInfo?.currency || DEFAULT_CURRENCY
  const currency = shopCurrency
  const subtotal = Number(cart?.subtotal_amount || 0)

  const breakdown = useMemo(() => ({
    subtotal,
    tax: 0,
    shipping: 0,
    total: subtotal,
  }), [subtotal])

  if (loading && !cart) {
    return <LoaderStatus label="Loading checkout" delay={600} />
  }

  if (completedOrder) {
    return (
      <main className="checkout-page">
        <section className="checkout-confirmation">
          <h1>Thank you!</h1>
          <p>Order <strong>#{completedOrder.order_number}</strong> is confirmed. A receipt will be sent to your email.</p>
          <Link href={`/shops/${slug}/products`} className="cart-btn-primary cart-btn-inline">
            Continue shopping
          </Link>
        </section>
      </main>
    )
  }

  if (!items.length) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add products to your cart before checking out.</p>
          <Link href={`/shops/${slug}/products`} className="cart-btn-primary cart-btn-inline">
            Browse products
          </Link>
        </section>
      </main>
    )
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!form.customer_name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.customer_email.trim()) {
      setError('Email is required')
      return
    }
    try {
      const order = await checkout({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        shipping_address: buildAddress(form),
      })
      setCompletedOrder({ order_number: order.order_number })
      setForm(EMPTY_FORM)
    } catch (err: any) {
      setError(err?.message || 'Checkout failed')
    }
  }

  return (
    <main className="checkout-page">
      <div className="checkout-grid">
        <section className="checkout-form">
          <h1>Checkout</h1>
          <p>Provide your details to complete this order.</p>
          {error ? <div className="checkout-error">{error}</div> : null}
          <form onSubmit={submitOrder}>
            <label>
              <span>Name</span>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
              />
            </label>
            <label>
              <span>Address</span>
              <input
                type="text"
                placeholder="Street address"
                value={form.address_line1}
                onChange={(e) => setForm((prev) => ({ ...prev, address_line1: e.target.value }))}
              />
            </label>
            <div className="checkout-grid-sm">
              <label>
                <span>City</span>
                <input
                  type="text"
                  value={form.address_city}
                  onChange={(e) => setForm((prev) => ({ ...prev, address_city: e.target.value }))}
                />
              </label>
              <label>
                <span>Postal code</span>
                <input
                  type="text"
                  value={form.address_postal_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, address_postal_code: e.target.value }))}
                />
              </label>
            </div>
            <label>
              <span>Notes</span>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </label>
            <button type="submit" className="cart-btn-primary" disabled={submitting}>
              {submitting ? 'Placing order…' : 'Confirm order'}
            </button>
          </form>
        </section>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="checkout-summary-item">
                <div>
                  <span className="checkout-item-name">{item.product_name}</span>
                  {item.option_label ? <span className="checkout-item-variant">{item.option_label}</span> : null}
                  <span className="checkout-item-qty">Qty {item.quantity}</span>
                </div>
                <strong>{formatMoney(item.subtotal_amount, shopCurrency)}</strong>
              </li>
            ))}
          </ul>
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
            <div className="checkout-summary-total">
              <dt>Total</dt>
              <dd>{formatMoney(breakdown.total, currency)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}

function buildAddress(form: CheckoutForm) {
  const address: Record<string, string> = {}
  if (form.address_line1.trim()) address.line1 = form.address_line1.trim()
  if (form.address_city.trim()) address.city = form.address_city.trim()
  if (form.address_postal_code.trim()) address.postal_code = form.address_postal_code.trim()
  return Object.keys(address).length ? address : undefined
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
