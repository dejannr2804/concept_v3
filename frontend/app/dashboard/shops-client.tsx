"use client"
import Link from 'next/link'
import { useResourceList } from '@/hooks/resource'

type Shop = { id: number; name: string }

export default function ShopsClient() {
  const { data, loading, error } = useResourceList<Shop>('shops')

  if (error) return <div className="error">{error}</div>
  if (loading || !data) return <div>Loading shops...</div>

  if (data.length === 0) return <div>You have no shops yet.</div>

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map((s) => (
        <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
          <div>{s.name}</div>
          <Link href={`/dashboard/${s.id}`} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>Manage</Link>
        </li>
      ))}
    </ul>
  )
}
