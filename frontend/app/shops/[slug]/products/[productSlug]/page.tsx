"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

type Product = { id: number; name: string; slug: string; description?: string }

export default function PublicProductPage({ params }: { params: { slug: string; productSlug: string } }) {
  const { slug: shopSlug, productSlug } = params
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<Product>(`shops/slug/${shopSlug}/products/${productSlug}`)
        if (!cancelled) setProduct(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load product')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shopSlug, productSlug])

  if (loading) return <div className="p-4">Loading…</div>
  if (error) return <div className="error p-4">{error}</div>
  if (!product) return <div className="p-4">Product not found.</div>

  return (
    <main className="container">
      <div className="col gap-075">
        <div className="row row-between">
          <h1 className="m-0">{product.name}</h1>
          <Link href={`/shops/${shopSlug}`} className="btn btn-white">Back to Shop</Link>
        </div>
        <div className="divider" />
        {product.description ? (
          <p className="pre-wrap m-0">{product.description}</p>
        ) : (
          <p className="text-muted m-0">No description provided.</p>
        )}
      </div>
    </main>
  )
}
