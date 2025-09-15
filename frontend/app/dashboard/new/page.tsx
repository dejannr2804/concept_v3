"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useResourceCreator } from '@/hooks/resource'
import { useNotifications } from '@/components/Notifications'

export default function NewShopPage() {
  const router = useRouter()
  const creator = useResourceCreator('shops')
  const [slugTouched, setSlugTouched] = useState(false)
  const notify = useNotifications()

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
    if (!name) { notify.error('Please enter a shop name'); return }
    // Ensure slug exists; if user didn't touch slug, derive from name
    const currentSlug = String(creator.data?.slug || '').trim()
    if (!currentSlug) creator.setField('slug', toSlug(name))
    const res = await creator.create(['name', 'slug'])
    if (res.ok) {
      notify.success('Shop created')
      router.replace('/dashboard?created=1')
      setTimeout(() => router.refresh(), 0)
    }
  }

  return (
    <main className="new-shop-container">
      <div className="top-line">
        <div className="ns-titleGroup">
          <Link href="/dashboard" className="pe-back">
            <img src="/img/arrow-narrow-left.svg" alt="" />
            <span>Go back</span>
          </Link>
          <h1 className="heading">Create Shop</h1>
        </div>
      </div>

      <section className="new-shop-panel">
        <form onSubmit={onSubmit} className="ns-form">
          <div className="ns-fieldRow">
            <label className="ns-field">
              <span className="ns-label">Shop Name</span>
              <input
                className="ns-input"
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
            <label className="ns-field">
              <span className="ns-label">Slug</span>
              <input
                className="ns-input"
                value={creator.data?.slug || ''}
                onChange={(e) => { setSlugTouched(true); creator.setField('slug', toSlug(e.target.value)) }}
                placeholder="my-shop"
              />
              <div className="ns-helper">Appears in your shop URL. Must be unique.</div>
            </label>
          </div>
          <div className="ns-actions">
            <button type="submit" className="ns-button" disabled={creator.saving}>
              {creator.saving ? 'Creating…' : 'Create shop'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
