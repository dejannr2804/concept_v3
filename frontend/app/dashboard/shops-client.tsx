"use client"
import { useEffect, useState } from 'react'

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
    <ul>
      {shops.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  )
}

