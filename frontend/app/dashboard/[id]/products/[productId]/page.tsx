"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useResourceUpdater } from '@/hooks/resource'

export default function ProductDashboard({ params }: { params: { id: string; productId: string } }) {
  const { id: shopId, productId } = params
  const router = useRouter()
  const updater = useResourceUpdater(`/api/shops/${shopId}/products/${productId}`)

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>Product</h1>
          <Link href={`/dashboard/${shopId}`}>Back to Shop</Link>
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
              <input value={updater.data?.name || ''} onChange={(e) => updater.setField('name', e.target.value)} />
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
              <button onClick={() => updater.save(['name', 'description'])} disabled={updater.saving}>
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
