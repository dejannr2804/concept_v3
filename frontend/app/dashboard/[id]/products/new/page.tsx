"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

export default function NewProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const notify = useNotifications()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return notify.error('Product name is required')
    setLoading(true)
    try {
      const res = await fetch(`/api/shops/${id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, description }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to create product')
      }
      notify.success('Product created')
      router.push(`/dashboard/${id}`)
      router.refresh()
    } catch (e: any) {
      notify.error(e?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Create Product</h1>
        <form onSubmit={onSubmit} className="col" style={{ gap: '0.75rem' }}>
          <label>
            <div>Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
          </label>
          <label>
            <div>Description</div>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <div className="row" style={{ gap: '0.5rem' }}>
            <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}

