"use client"
import Link from 'next/link'
import { useResourceList } from '@/hooks/resource'

type Shop = { id: number; name: string; slug: string }

export default function ShopsClient() {
  const { data, loading, error } = useResourceList<Shop>('shops')

  if (error) return <div className="error">{error}</div>
  if (loading || !data) return <div>Loading shops...</div>

  if (data.length === 0) return <div>You have no shops yet.</div>

  return (
    <ul className="list">
      {data.map((s) => (
        <li key={s.id} className="list-item row row-between gap-1">
          <div>{s.name}</div>
          <div className="row gap-05">
            <Link href={`/shops/${s.slug}`} className="btn btn-white">View</Link>
            <Link href={`/dashboard/${s.id}`} className="btn btn-secondary">Dashboard</Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
