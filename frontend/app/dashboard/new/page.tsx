"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

export default function NewShopPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const notify = useNotifications()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      notify.error('Please enter a shop name')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to create shop')
      }
      notify.success('Shop created')
      router.push('/dashboard')
    } catch (e: any) {
      notify.error(e?.message || 'Failed to create shop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Create Shop</h1>
        <form onSubmit={onSubmit} className="column" style={{ gap: '0.75rem' }}>
          <label>
            <div>Shop Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Shop" />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </main>
  )
}

