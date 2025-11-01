import type { Metadata } from 'next'
import OrderDetailPageClient from './OrderDetailPageClient'

export const metadata: Metadata = {
  title: 'Order – Dashboard',
}

export default function OrderDetailPage({ params }: { params: { id: string; orderId: string } }) {
  return <OrderDetailPageClient params={params} />
}
