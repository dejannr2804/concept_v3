"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'
import { useResourceItem } from '@/hooks/resource'
import type { Order, Shop } from '@/lib/shops/types'
import { DEFAULT_CURRENCY } from '@/lib/currencies'
import { api } from '@/lib/api'
import { useNotifications } from '@/components/Notifications'

const STATUS_OPTIONS: { value: Order['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

function formatMoney(value: string | number | null | undefined, currency: string) {
  if (value === null || value === undefined) return `${currency} 0.00`
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return `${currency} ${value}`
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(numeric)
  } catch {
    return `${currency} ${numeric.toFixed(2)}`
  }
}

function formatDate(value: string | undefined) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function renderAddress(address: Record<string, any> | undefined | null) {
  if (!address || Object.keys(address).length === 0) {
    return <span>—</span>
  }
  return (
    <div className="order-address">
      {Object.entries(address).map(([key, value]) => (
        <div key={key}>
          <span className="label">{key.replace(/_/g, ' ')}</span>
          <span>{String(value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function OrderDetailPageClient({ params }: { params: { id: string; orderId: string } }) {
  const { id: shopId, orderId } = params
  const notify = useNotifications()
  const shop = useResourceItem<Shop>(`shops/${shopId}`)
  const order = useResourceItem<Order>(`shops/${shopId}/orders/${orderId}`)
  const [status, setStatus] = useState<Order['status']>('pending')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (order.data?.status) setStatus(order.data.status)
  }, [order.data?.status])

  useEffect(() => {
    if (order.data?.order_number && shop.data?.name) {
      document.title = `${order.data.order_number} – ${shop.data.name}`
    } else {
      document.title = 'Order'
    }
  }, [order.data?.order_number, shop.data?.name])

  const currency = order.data?.currency || shop.data?.currency || DEFAULT_CURRENCY
  const items = useMemo(() => order.data?.items || [], [order.data?.items])

  async function updateStatus(next: Order['status']) {
    setSaving(true)
    try {
      await api.patch(`shops/${shopId}/orders/${orderId}`, { status: next })
      setStatus(next)
      notify.success('Status updated')
      order.refresh()
    } catch (err: any) {
      notify.error(err?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  if (shop.loading || order.loading || !order.data) {
    return <DashboardLoadingPlaceholder />
  }

  const detail = order.data

  return (
    <div className="order-detail-container dlp-fadeIn">
      <div className="top-line">
        <div>
          <p className="detail-subheading">
            <Link href={`/dashboard/${shopId}/orders`} className="back-link">
              ← Orders
            </Link>
          </p>
          <h1 className="heading">Order #{detail.order_number}</h1>
        </div>
        <div className="status-control">
          <label htmlFor="order-status">Status</label>
          <select
            id="order-status"
            value={status}
            onChange={(e) => updateStatus(e.target.value as Order['status'])}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="order-section">
        <h2>Summary</h2>
        <div className="order-summary-grid">
          <div>
            <span className="label">Placed</span>
            <span>{formatDate(detail.placed_at)}</span>
          </div>
          <div>
            <span className="label">Total</span>
            <strong>{formatMoney(detail.total_amount, currency)}</strong>
          </div>
          <div>
            <span className="label">Subtotal</span>
            <span>{formatMoney(detail.subtotal_amount, currency)}</span>
          </div>
          <div>
            <span className="label">Discounts</span>
            <span>{formatMoney(detail.discount_amount, currency)}</span>
          </div>
        </div>
      </section>

      <section className="order-section">
        <h2>Customer</h2>
        <div className="order-info-box">
          <div>
            <span className="label">Name</span>
            <span>{detail.customer_name || 'Customer'}</span>
          </div>
          <div>
            <span className="label">Email</span>
            <span>{detail.customer_email || '—'}</span>
          </div>
          <div>
            <span className="label">Phone</span>
            <span>{detail.customer_phone || '—'}</span>
          </div>
          {detail.notes ? (
            <div className="order-notes">
              <span className="label">Notes</span>
              <p>{detail.notes}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="order-section">
        <h2>Shipping address</h2>
        <div className="order-info-box">{renderAddress(detail.shipping_address)}</div>
      </section>

      <section className="order-section">
        <h2>Items</h2>
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="order-item-name">{item.product_name}</div>
                  </td>
                  <td>{item.option_label || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.subtotal_amount, item.currency || currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
