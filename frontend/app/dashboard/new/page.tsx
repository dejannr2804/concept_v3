"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useResourceCreator } from '@/hooks/resource'

export default function NewShopPage() {
  const router = useRouter()
  const creator = useResourceCreator('shops')
  const [slugTouched, setSlugTouched] = useState(false)

  function toSlug(v: string) {
    return v
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = String(creator.data?.name || '').trim()
    if (!name) return alert('Please enter a shop name')
    // Ensure slug exists; if user didn't touch slug, derive from name
    const currentSlug = String(creator.data?.slug || '').trim()
    if (!currentSlug) creator.setField('slug', toSlug(name))
    const res = await creator.create(['name', 'slug'])
    if (res.ok) router.push('/dashboard')
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Create Shop</h1>
        <form onSubmit={onSubmit} className="column" style={{ gap: '0.75rem' }}>
          <label>
            <div>Shop Name</div>
            <input
              value={creator.data?.name || ''}
              onChange={(e) => {
                const name = e.target.value
                creator.setField('name', name)
                if (!slugTouched) {
                  creator.setField('slug', toSlug(name))
                }
              }}
              placeholder="My Shop"
            />
          </label>
          <label>
            <div>Slug</div>
            <input
              value={creator.data?.slug || ''}
              onChange={(e) => { setSlugTouched(true); creator.setField('slug', toSlug(e.target.value)) }}
              placeholder="my-shop"
            />
            <small>Appears in your shop URL. Must be unique.</small>
          </label>
          <button type="submit" disabled={creator.saving}>
            {creator.saving ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </main>
  )
}
