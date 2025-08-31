"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

type Shop = { id: number; name: string }

export default function ManageShopPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [shop, setShop] = useState<Shop | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notify = useNotifications()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/shops/${id}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to load shop')
        return r.json()
      })
      .then((data: Shop) => {
        if (!cancelled) {
          setShop(data)
          setName(data.name)
          setError(null)
        }
      })
      .catch((e) => !cancelled && setError(e.message || 'Failed to load shop'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!shop) return
    const newName = name.trim()
    if (!newName) return notify.error('Name cannot be empty')
    setSaving(true)
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to save changes')
      }
      const data = (await res.json()) as Shop
      setShop(data)
      setName(data.name)
      notify.success('Changes saved')
      router.refresh()
    } catch (e: any) {
      notify.error(e?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteShop() {
    if (!shop) return
    if (!confirm('Delete this shop and all its products? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/shops/${shop.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to delete shop')
      }
      notify.success('Shop deleted')
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      notify.error(e?.message || 'Failed to delete shop')
    }
  }

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>Manage Shop</h1>
          <Link href={`/dashboard/${id}`}>Back to Shop</Link>
        </div>
        <div className="spacer" />
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : shop ? (
          <form onSubmit={onSave} className="col" style={{ gap: '0.75rem' }}>
            <label>
              <div>Shop Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="row" style={{ gap: '0.5rem' }}>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={onDeleteShop} style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' }}>Delete Shop</button>
            </div>
          </form>
        ) : (
          <div>Shop not found.</div>
        )}
      </div>
    </main>
  )
}

