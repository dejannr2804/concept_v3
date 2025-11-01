import type { Metadata } from 'next'
import OrdersPageClient from './OrdersPageClient'

export const metadata: Metadata = {
  title: 'Orders – Dashboard',
}

export default function OrdersPage({ params }: { params: { id: string } }) {
  return <OrdersPageClient params={params} />
}
