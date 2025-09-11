import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, getTokenFromCookies } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const token = getTokenFromCookies()

  type Shop = { id: number; name: string; slug: string; profile_image_url?: string }

  let shops: Shop[] | null = null
  let error: string | null = null
  try {
    if (token) {
      const res = await fetch(`${API_BASE_URL}/api/v1/shops/`, {
        headers: { Authorization: `Token ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      shops = await res.json()
    } else {
      shops = []
    }
  } catch (e: any) {
    error = e?.message || 'Failed to load'
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Your Shops</h1>
        <div className="spacer" />
        {error ? (
          <div className="error">{error}</div>
        ) : !shops ? (
          <div>Loading shops...</div>
        ) : shops.length === 0 ? (
          <div>You have no shops yet.</div>
        ) : (
          <ul className="list">
            {shops.map((s) => (
              <li key={s.id} className="list-item row row-between gap-1">
                <div className="row gap-05" style={{ alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#eee', border: '1px solid #e5e7eb' }}>
                    {s.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>
                  <div>{s.name}</div>
                </div>
                <div className="row gap-05">
                  <Link href={`/shops/${s.slug}`} className="btn btn-white">View</Link>
                  <Link href={`/dashboard/${s.id}`} className="btn btn-secondary">Dashboard</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="spacer" />
        <Link href="/dashboard/new">Create a new shop</Link>
      </div>
    </main>
  )
}
