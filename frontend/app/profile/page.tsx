"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useResourceUpdater } from '@/hooks/resource'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const updater = useResourceUpdater('auth/me', {
    load: false,
    initialData: { first_name: user?.first_name || '', last_name: user?.last_name || '' },
    extract: (raw) => (raw && (raw as any).user) || raw,
  })
  const [imgUrl, setImgUrl] = useState<string | undefined>(user?.profile_image_url)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  return (
    <main className="container">
      <div className="card">
        <h1 className="pe-title" style={{ marginBottom: 12 }}>Profile</h1>
        {!user ? null : (
          <div className="col gap-075 mt-8 pe-form">
            <div className="row gap-1 items-center" style={{ alignItems: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#eee', border: '1px solid #e5e7eb' }}>
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', fontSize: 12, color: '#777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No image</div>
                )}
              </div>
              <div className="col gap-05">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="pe-btnSecondary"
                >
                  {imgUrl ? 'Change image' : 'Upload image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const inputEl = e.currentTarget as HTMLInputElement
                    const f = inputEl.files?.[0]
                    if (!f) return
                    const fd = new FormData()
                    fd.append('file', f)
                    try {
                      const updated = await (await import('@/lib/api')).api.upload<{ id: number; username: string; profile_image_url?: string }>(
                        'auth/me/profile-image',
                        fd,
                        { extract: (raw) => (raw && (raw as any).user) || raw }
                      )
                      setImgUrl((updated as any)?.profile_image_url)
                    } catch (e) {
                      // best-effort, error notification handled by api util
                    } finally {
                      if (inputEl) inputEl.value = ''
                    }
                  }}
                />
              </div>
            </div>
            <label className="pe-formField">
              <span className="pe-label">Username</span>
              <input className="pe-input" value={user.username} readOnly disabled />
            </label>
            <label className="pe-formField">
              <span className="pe-label">Email</span>
              <input className="pe-input" type="email" value={user.email} readOnly disabled />
            </label>
            {updater.error && <div className="pe-error">{updater.error}</div>}
            <label className="pe-formField">
              <span className="pe-label">First name</span>
              <input
                className="pe-input"
                value={updater.data?.first_name || ''}
                onChange={(e) => updater.setField('first_name', e.target.value)}
              />
            </label>
            <label className="pe-formField">
              <span className="pe-label">Last name</span>
              <input
                className="pe-input"
                value={updater.data?.last_name || ''}
                onChange={(e) => updater.setField('last_name', e.target.value)}
              />
            </label>
            <div className="row gap-075">
              <button className="pe-btnPrimary" onClick={() => updater.save(['first_name', 'last_name'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
