import type { Metadata } from 'next'
import InventoryPageClient from './InventoryPageClient'

export const metadata: Metadata = {
  title: 'Inventory – Dashboard',
}

export default function InventoryPage({ params }: { params: { id: string } }) {
  return <InventoryPageClient params={params} />
}
