"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

type Product = { id: number; name: string; description?: string }

export default function ProductDashboard({ params }: { params: { id: string; productId: string } }) {
  const { id: shopId, productId } = params
  const [product, setProduct] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notify = useNotifications()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/shops/${shopId}/products/${productId}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to load product')
        return r.json()
      })
      .then((data: Product) => {
        if (!cancelled) {
          setProduct(data)
          setName(data.name)
          setDescription(data.description || '')
          setError(null)
        }
      })
      .catch((e) => !cancelled && setError(e.message || 'Failed to load product'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [shopId, productId])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    const n = name.trim()
    if (!n) return notify.error('Name cannot be empty')
    setSaving(true)
    try {
      const res = await fetch(`/api/shops/${shopId}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, description }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to save changes')
      }
      const data = (await res.json()) as Product
      setProduct(data)
      setName(data.name)
      setDescription(data.description || '')
      notify.success('Changes saved')
      router.refresh()
    } catch (e: any) {
      notify.error(e?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>Product</h1>
          <Link href={`/dashboard/${shopId}`}>Back to Shop</Link>
        </div>
        <div className="spacer" />
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : product ? (
          <form onSubmit={onSave} className="col" style={{ gap: '0.75rem' }}>
            <label>
              <div>Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              <div>Description</div>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #d1d5db' }} />
            </label>
            <div className="row" style={{ gap: '0.5rem' }}>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div>Product not found.</div>
        )}
      </div>
    </main>
  )
}

