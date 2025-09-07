"use client"
import ProductEditor from '../ProductEditor'

export default function NewProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  return <ProductEditor shopId={id} mode="create" />
}
