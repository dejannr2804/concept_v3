"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Shop = { id: number; name: string }

export default function ShopsClient() {
  const [shops, setShops] = useState<Shop[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/shops', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.detail || 'Failed to load shops')
        return r.json()
      })
      .then((data: Shop[]) => {
        if (!cancelled) setShops(data)
      })
      .catch((e) => !cancelled && setError(e.message || 'Failed to load shops'))
    return () => { cancelled = true }
  }, [])

  if (error) return <div className="error">{error}</div>
  if (!shops) return <div>Loading shops...</div>

  if (shops.length === 0) return <div>You have no shops yet.</div>

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {shops.map((s) => (
        <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
          <div>{s.name}</div>
          <Link href={`/dashboard/${s.id}`} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage</Link>
        </li>
      ))}
    </ul>
  )
}
