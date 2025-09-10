"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useResourceItem, useResourceUpdater } from '@/hooks/resource'

type Shop = { id: number; name: string; slug: string; description?: string }

export default function ShopSettingsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const updater = useResourceUpdater(`shops/${id}`, { load: true })

  const data = updater.data || shop.data || {}

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

