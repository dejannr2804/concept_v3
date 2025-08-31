"use client"
import { useRouter } from 'next/navigation'
import { useResourceCreator } from '@/hooks/resource'

export default function NewProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const creator = useResourceCreator(`shops/${id}/products`)
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = String(creator.data?.name || '').trim()
    if (!n) return alert('Product name is required')
    const res = await creator.create(['name', 'description'])
    if (res.ok) { router.push(`/dashboard/${id}`); router.refresh() }
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Create Product</h1>
        <form onSubmit={onSubmit} className="col" style={{ gap: '0.75rem' }}>
          <label>
            <div>Name</div>
            <input value={creator.data?.name || ''} onChange={(e) => creator.setField('name', e.target.value)} placeholder="Product name" />
          </label>
          <label>
            <div>Description</div>
            <textarea rows={4} value={creator.data?.description || ''} onChange={(e) => creator.setField('description', e.target.value)} style={{ padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <div className="row" style={{ gap: '0.5rem' }}>
            <button type="submit" disabled={creator.saving}>{creator.saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}
