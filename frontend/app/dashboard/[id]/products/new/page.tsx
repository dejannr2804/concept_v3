"use client"
import ProductEditor from '../ProductEditor'
import { useEffect } from 'react'

export default function NewProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  useEffect(() => {
    document.title = 'Create Product'
  }, [])
  return <ProductEditor shopId={id} mode="create" />
}
