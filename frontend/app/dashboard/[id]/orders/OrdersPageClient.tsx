"use client"

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'
import { useResourceItem, useResourceList } from '@/hooks/resource'
import type { Order, Shop } from '@/lib/shops/types'
import { DEFAULT_CURRENCY } from '@/lib/currencies'

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

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

export default function OrdersPageClient({ params }: { params: { id: string } }) {
  const { id } = params
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const orders = useResourceList<Order>(`shops/${id}/orders`)

  useEffect(() => {
    const name = shop.data?.name
    if (name) document.title = `Orders – ${name}`
    else document.title = 'Orders'
  }, [shop.data?.name])

  const currency = shop.data?.currency || DEFAULT_CURRENCY
  const rows = useMemo(() => orders.data || [], [orders.data])

  if (orders.loading || shop.loading) {
    return <DashboardLoadingPlaceholder />
  }

  return (
    <div className="products-page-container dlp-fadeIn">
      <div className="top-line">
        <h1 className="heading">Orders</h1>
      </div>

      {rows.length === 0 ? (
        <div className="no-products-message">No orders yet.</div>
      ) : (
        <div className="products-table-wrapper">
          <table className="products-table orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="order-number">#{order.order_number}</div>
                  </td>
                  <td>{formatDate(order.placed_at)}</td>
                  <td>{order.customer_name || order.customer_email || 'Guest'}</td>
                  <td>
                    <span className={`status-pill status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                  </td>
                  <td>{formatMoney(order.total_amount, order.currency || currency)}</td>
                  <td className="actions">
                    <Link href={`/dashboard/${id}/orders/${order.id}`}>
                      <img src="/img/arrow-narrow-right.svg" alt="" className="nav-icon" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
