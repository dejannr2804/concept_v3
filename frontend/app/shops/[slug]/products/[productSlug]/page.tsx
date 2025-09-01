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

  if (loading) return <div style={{ padding: '1rem' }}>Loading…</div>
  if (error) return <div className="error" style={{ padding: '1rem' }}>{error}</div>
  if (!product) return <div style={{ padding: '1rem' }}>Product not found.</div>

  return (
    <main style={{ maxWidth: 800, margin: '1rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>{product.name}</h1>
          <Link href={`/shops/${shopSlug}`} style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: 6, background: '#ffffff' }}>
            Back to Shop
          </Link>
        </div>
        <div style={{ height: 1, background: '#e5e7eb', margin: '0.5rem 0 1rem' }} />
        {product.description ? (
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{product.description}</p>
        ) : (
          <p style={{ color: '#6b7280', marginTop: 0 }}>No description provided.</p>
        )}
      </div>
    </main>
  )
}

