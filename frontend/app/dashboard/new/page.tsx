"use client"
import { useRouter } from 'next/navigation'
import { useResourceCreator } from '@/hooks/resource'

export default function NewShopPage() {
  const router = useRouter()
  const creator = useResourceCreator('shops')
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = String(creator.data?.name || '').trim()
    if (!name) return alert('Please enter a shop name')
    const res = await creator.create(['name'])
    if (res.ok) router.push('/dashboard')
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Create Shop</h1>
        <form onSubmit={onSubmit} className="column" style={{ gap: '0.75rem' }}>
          <label>
            <div>Shop Name</div>
            <input value={creator.data?.name || ''} onChange={(e) => creator.setField('name', e.target.value)} placeholder="My Shop" />
          </label>
          <button type="submit" disabled={creator.saving}>
            {creator.saving ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </main>
  )
}
