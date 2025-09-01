"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useResourceItem, useResourceUpdater } from '@/hooks/resource'
import { useState } from 'react'

export default function ProductDashboard({ params }: { params: { id: string; productId: string } }) {
  const { id: shopId, productId } = params
  const router = useRouter()
  const updater = useResourceUpdater(`shops/${shopId}/products/${productId}`)
  const shop = useResourceItem<{ id: number; name: string; slug: string }>(`shops/${shopId}`)
  const [slugTouched, setSlugTouched] = useState(false)

  function toSlug(v: string) {
    return v
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ alignItems: 'center', gap: '0.75rem' }}>
            <Link href={`/dashboard/${shopId}`} style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}>
              Back
            </Link>
            <h1 style={{ margin: 0 }}>Product</h1>
          </div>
          <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
            {shop.data && updater.data?.slug && (
              <Link
                href={`/shops/${shop.data.slug}/products/${updater.data.slug}`}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#f3f4f6' }}
              >
                View
              </Link>
            )}
          </div>
        </div>
        <div className="spacer" />
        {updater.loading ? (
          <div>Loading…</div>
        ) : updater.error ? (
          <div className="error">{updater.error}</div>
        ) : (
          <div className="col" style={{ gap: '0.75rem' }}>
            <label>
              <div>Name</div>
              <input
                value={updater.data?.name || ''}
                onChange={(e) => {
                  const name = e.target.value
                  updater.setField('name', name)
                  if (!slugTouched) updater.setField('slug', toSlug(name))
                }}
              />
            </label>
            <label>
              <div>Slug</div>
              <input
                value={updater.data?.slug || ''}
                onChange={(e) => { setSlugTouched(true); updater.setField('slug', toSlug(e.target.value)) }}
              />
              <small>Unique within this shop. Leave empty to auto-generate from name.</small>
            </label>
            <label>
              <div>Description</div>
              <textarea
                rows={4}
                value={updater.data?.description || ''}
                onChange={(e) => updater.setField('description', e.target.value)}
                style={{ padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
            <div className="row" style={{ gap: '0.5rem' }}>
              <button onClick={() => updater.save(['name', 'slug', 'description'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={async () => {
                  const res = await updater.deleteResource()
                  if (res.ok) { router.push(`/dashboard/${shopId}`); router.refresh() }
                }}
                disabled={updater.deleting}
                style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' }}
              >
                {updater.deleting ? 'Deleting…' : 'Delete Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
