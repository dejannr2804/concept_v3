import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, getTokenFromCookies } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const token = getTokenFromCookies()
  const displayName = (user.first_name && user.first_name.trim()) || user.username || user.email

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
    <div className="dashboard-container">
      <h2 className="name">Hello, {displayName}</h2>
      <p className="subname">Here is the portfolio of your shops.</p>
      {error ? (
        <p>{error}</p>
      ) : !shops ? (
        <p>Loading shops...</p>
      ) : shops.length === 0 ? (
        <p>You have no shops yet.</p>
      ) : (
        <div className="shops">
          {shops.map((s) => (
            <div className="shop">
              {s.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.profile_image_url} alt="" />
              ) : null}
              <span>{s.name}</span> — <Link href={`/shops/${s.slug}`}>View</Link> |{' '}
              <Link href={`/dashboard/${s.id}`}>Dashboard</Link>
            </div>
          ))}
        </div>
      )}
      <p>
        <Link href="/dashboard/new" className="create-new-shop">Create a new shop</Link>
      </p>
    </div>
  )
}
