import type { Metadata } from 'next'
import ProductEditor from '../ProductEditor'

export const metadata: Metadata = {
  title: 'Product – Dashboard',
}

export default function ProductDashboard({ params }: { params: { id: string; productId: string } }) {
  const { id: shopId, productId } = params
  return <ProductEditor shopId={shopId} productId={productId} mode="update" />
}
