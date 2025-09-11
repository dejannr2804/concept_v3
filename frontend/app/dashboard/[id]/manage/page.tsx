"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useResourceItem, useResourceUpdater } from '@/hooks/resource'

type Shop = { id: number; name: string; slug: string; description?: string; profile_image_url?: string }

export default function ShopSettingsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const updater = useResourceUpdater(`shops/${id}`, { load: true })

  const data = updater.data || shop.data || {}
  const [imgUrl, setImgUrl] = useState<string | undefined>(data?.profile_image_url || shop.data?.profile_image_url)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <main className="container">
      <div className="card">
        <div className="row row-between">
          <div className="row gap-05">
            <Link href={`/dashboard/${id}`} className="btn btn-secondary">Back</Link>
            <h1 className="m-0">Shop Settings</h1>
          </div>
          {shop.data && (
            <Link href={`/shops/${shop.data.slug}`} className="btn btn-secondary">View Shop</Link>
          )}
        </div>

        <div className="spacer" />

        {shop.loading ? (
          <div>Loading…</div>
        ) : shop.error ? (
          <div className="error">{shop.error}</div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="col gap-075">
            <div className="row gap-1" style={{ alignItems: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#eee', border: '1px solid #e5e7eb' }}>
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt="Shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', fontSize: 12, color: '#777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No image</div>
                )}
              </div>
              <div className="col gap-05">
                <button type="button" className="btn btn-white" onClick={() => fileInputRef.current?.click()}>
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
            <label className="col">
              <span className="text-secondary text-sm">Name</span>
              <input value={data?.name || ''} onChange={(e) => updater.setField('name', e.target.value)} />
            </label>
            <label className="col">
              <span className="text-secondary text-sm">Slug</span>
              <input value={data?.slug || ''} onChange={(e) => updater.setField('slug', e.target.value)} />
            </label>
            <label className="col">
              <span className="text-secondary text-sm">Description</span>
              <textarea rows={5} value={data?.description || ''} onChange={(e) => updater.setField('description', e.target.value)} />
            </label>

            <div className="row gap-05">
              <button className="btn btn-white" onClick={() => updater.save(['name', 'slug', 'description'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn btn-danger" onClick={async () => {
                const res = await updater.deleteResource()
                if (res.ok) { router.push('/dashboard'); router.refresh() }
              }} disabled={updater.deleting}>
                {updater.deleting ? 'Deleting…' : 'Delete Shop'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
