"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useResourceUpdater } from '@/hooks/resource'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const updater = useResourceUpdater('/api/auth/me', {
    load: false,
    initialData: { first_name: user?.first_name || '', last_name: user?.last_name || '' },
    extract: (raw) => (raw && (raw as any).user) || raw,
  })

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  return (
    <main className="container">
      <div className="card">
        <h1>Profile</h1>
        {!user ? null : (
          <div className="col" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
            <label>
              <div>Username</div>
              <input value={user.username} readOnly disabled />
            </label>
            <label>
              <div>Email</div>
              <input type="email" value={user.email} readOnly disabled />
            </label>
            {updater.error && <div className="error">{updater.error}</div>}
            <label>
              <div>First name</div>
              <input
                value={updater.data?.first_name || ''}
                onChange={(e) => updater.setField('first_name', e.target.value)}
              />
            </label>
            <label>
              <div>Last name</div>
              <input
                value={updater.data?.last_name || ''}
                onChange={(e) => updater.setField('last_name', e.target.value)}
              />
            </label>
            <div className="row" style={{ gap: '0.75rem' }}>
              <button onClick={() => updater.save(['first_name', 'last_name'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
