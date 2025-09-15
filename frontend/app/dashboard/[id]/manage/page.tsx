"use client"
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useResourceItem, useResourceUpdater } from '@/hooks/resource'
import Modal from '@/components/Modal'
import { api } from '@/lib/api'

type Shop = { id: number; name: string; slug: string; description?: string; profile_image_url?: string }

export default function ShopSettingsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const updater = useResourceUpdater(`shops/${id}`, { load: true })

  const data = updater.data || shop.data || {}
  const [imgUrl, setImgUrl] = useState<string | undefined>(data?.profile_image_url || shop.data?.profile_image_url)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Delete confirmation UI
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  async function onConfirmDelete() {
    setDeleting(true)
    try {
      await api.delete(`shops/${id}`)
      setDeleteOpen(false)
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      // notifications handled globally
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="shop-settings-root">
      <div className="shop-settings-header">
        <div className="shop-settings-top">
          <h1 className="shop-settings-title">Shop Settings</h1>
        </div>
      </div>

      {shop.loading ? (
        <div>Loading…</div>
      ) : shop.error ? (
        <div className="ss-error">{shop.error}</div>
      ) : (
        <section className="shop-settings-panel">
          <form className="ss-form" onSubmit={(e) => e.preventDefault()}>
            <div className="ss-row">
              <div className="ss-avatar">
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt="Shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div>No image</div>
                )}
              </div>
              <div>
                <button type="button" className="ss-button" onClick={() => fileInputRef.current?.click()}>
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
                      const updated = await (await import('@/lib/api')).api.upload<{ shop: Shop }>(
                        `shops/${id}/profile-image`,
                        fd,
                        { extract: (raw) => (raw && (raw as any).shop) || raw }
                      )
                      setImgUrl((updated as any)?.profile_image_url)
                    } catch (e) {
                      // toast handled globally by api util
                    } finally {
                      if (inputEl) inputEl.value = ''
                    }
                  }}
                />
              </div>
            </div>

            <div className="ss-fieldRow">
              <label className="ss-field">
                <span className="ss-label">Name</span>
                <input className="ss-input" value={data?.name || ''} onChange={(e) => updater.setField('name', e.target.value)} />
              </label>
              <label className="ss-field">
                <span className="ss-label">Slug</span>
                <input className="ss-input" value={data?.slug || ''} onChange={(e) => updater.setField('slug', e.target.value)} />
              </label>
            </div>
            <label className="ss-field">
              <span className="ss-label">Description</span>
              <textarea className="ss-textarea" rows={5} value={data?.description || ''} onChange={(e) => updater.setField('description', e.target.value)} />
            </label>

            <div className="ss-actions">
              <button type="button" className="ss-button" onClick={() => updater.save(['name', 'slug', 'description'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" className="ss-button ss-button--danger" onClick={() => setDeleteOpen(true)}>
                Delete Shop
              </button>
            </div>
          </form>
        </section>
      )}

      <Modal open={deleteOpen} onClose={() => (!deleting && setDeleteOpen(false))}>
        <div style={{ background: '#fff', color: '#111', padding: 20, minWidth: 320 }}>
          <h3 style={{ margin: '4px 0 12px 0' }}>Delete shop?</h3>
          <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>This action cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="ss-button" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
            <button type="button" className="ss-button ss-button--danger" onClick={onConfirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
