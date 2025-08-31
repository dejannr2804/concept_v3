"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useResourceUpdater } from '@/hooks/resource'

export default function ManageShopPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const updater = useResourceUpdater(`shops/${id}`)

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Manage Shop</h1>
          <Link href={`/dashboard/${id}`}>Back to Shop</Link>
        </div>
        <div className="spacer" />
        {updater.loading ? (
          <div>Loading…</div>
        ) : updater.error ? (
          <div className="error">{updater.error}</div>
        ) : (
          <div className="col" style={{ gap: '0.75rem' }}>
            <label>
              <div>Shop Name</div>
              <input
                value={updater.data?.name || ''}
                onChange={(e) => updater.setField('name', e.target.value)}
              />
            </label>
            <label>
              <div>Slug</div>
              <input
                value={updater.data?.slug || ''}
                onChange={(e) => updater.setField('slug', e.target.value)}
              />
              <small>Must be unique. Changing it updates your shop URL.</small>
            </label>
            <div className="row" style={{ gap: '0.5rem' }}>
              <button onClick={() => updater.save(['name', 'slug'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={async () => {
                  const res = await updater.deleteResource()
                  if (res.ok) { router.push('/dashboard'); router.refresh() }
                }}
                disabled={updater.deleting}
                style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' }}
              >
                {updater.deleting ? 'Deleting…' : 'Delete Shop'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
