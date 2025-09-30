"use client"
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useResourceItem, useResourceUpdater } from '@/hooks/resource'
import Modal from '@/components/Modal'
import { api } from '@/lib/api'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'

type Shop = {
  id: number
  name: string
  slug: string
  description?: string
  heading?: string
  profile_image_url?: string
  cover_image_url?: string
  featured_category_1?: number | null
  featured_category_2?: number | null
  featured_category_3?: number | null
}

type Category = { id: number; name: string; slug: string }

export default function ShopSettingsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const updater = useResourceUpdater(`shops/${id}`, { load: true })

  const data = updater.data || shop.data || {}
  const [imgUrl, setImgUrl] = useState<string | undefined>(data?.profile_image_url || shop.data?.profile_image_url)
  const [coverUrl, setCoverUrl] = useState<string | undefined>(data?.cover_image_url || shop.data?.cover_image_url)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [catsLoading, setCatsLoading] = useState<boolean>(true)
  const [cat1Open, setCat1Open] = useState(false)
  const [cat2Open, setCat2Open] = useState(false)
  const [cat3Open, setCat3Open] = useState(false)
  const cat1MenuRef = useRef<HTMLDivElement | null>(null)
  const cat2MenuRef = useRef<HTMLDivElement | null>(null)
  const cat3MenuRef = useRef<HTMLDivElement | null>(null)
  const cat1BtnRef = useRef<HTMLButtonElement | null>(null)
  const cat2BtnRef = useRef<HTMLButtonElement | null>(null)
  const cat3BtnRef = useRef<HTMLButtonElement | null>(null)

  // Keep local image URL in sync when shop data loads or changes
  useEffect(() => {
    const next = (updater?.data as any)?.profile_image_url || (shop.data as any)?.profile_image_url
    if (next && next !== imgUrl) setImgUrl(next)
    const nextCover = (updater?.data as any)?.cover_image_url || (shop.data as any)?.cover_image_url
    if (nextCover && nextCover !== coverUrl) setCoverUrl(nextCover)
  }, [updater?.data, shop.data])

  useEffect(() => {
    const name = shop.data?.name
    document.title = name ? `Shop Settings – ${name}` : 'Shop Settings'
  }, [shop.data?.name])

  // Load categories for this shop (for featured picks)
  useEffect(() => {
    let cancelled = false
    async function loadCats() {
      setCatsLoading(true)
      try {
        const items = await api.get<Category[]>(`shops/${id}/categories`)
        if (!cancelled) setCategories(items || [])
      } catch (_) {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setCatsLoading(false)
      }
    }
    loadCats()
    return () => { cancelled = true }
  }, [id])

  // Close menus on outside click / Esc
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (cat1Open && cat1MenuRef.current && !cat1MenuRef.current.contains(t) && cat1BtnRef.current && !cat1BtnRef.current.contains(t)) setCat1Open(false)
      if (cat2Open && cat2MenuRef.current && !cat2MenuRef.current.contains(t) && cat2BtnRef.current && !cat2BtnRef.current.contains(t)) setCat2Open(false)
      if (cat3Open && cat3MenuRef.current && !cat3MenuRef.current.contains(t) && cat3BtnRef.current && !cat3BtnRef.current.contains(t)) setCat3Open(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setCat1Open(false); setCat2Open(false); setCat3Open(false) }
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [cat1Open, cat2Open, cat3Open])

  function categoryNameById(id?: number | null): string {
    if (!id) return 'No category'
    const found = categories.find(c => c.id === id)
    return found ? found.name : 'No category'
  }

  // Delete confirmation UI
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
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

  if (shop.loading) {
    return <DashboardLoadingPlaceholder />
  }

  return (
    <main className="shop-settings-root dlp-fadeIn">
      <div className="shop-settings-header">
        <div className="shop-settings-top">
          <h1 className="shop-settings-title">Shop Settings</h1>
        </div>
      </div>

      {shop.error ? (
        <div className="ss-error">{shop.error}</div>
      ) : (
        <section className="shop-settings-panel">
          <form className="ss-form" onSubmit={(e) => e.preventDefault()}>
            {/* Cover image */}
            <div className="ss-row" style={{ marginBottom: 16 }}>
              <div style={{ width: 280, height: 120, borderRadius: 12, background: '#f6f7f9', overflow: 'hidden' }}>
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>No cover</div>
                )}
              </div>
              <div>
                <button type="button" className="ss-button" onClick={() => coverInputRef.current?.click()}>
                  {coverUrl ? 'Change cover' : 'Upload cover'}
                </button>
                <input
                  ref={coverInputRef}
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
                        `shops/${id}/cover-image`,
                        fd,
                        { extract: (raw) => (raw && (raw as any).shop) || raw }
                      )
                      setCoverUrl((updated as any)?.cover_image_url)
                    } catch (e) {
                    } finally {
                      if (inputEl) inputEl.value = ''
                    }
                  }}
                />
              </div>
            </div>
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
              <span className="ss-label">Heading</span>
              <input className="ss-input" value={data?.heading || ''} onChange={(e) => updater.setField('heading', e.target.value)} />
            </label>
            <label className="ss-field">
              <span className="ss-label">Description</span>
              <textarea className="ss-textarea" rows={5} value={data?.description || ''} onChange={(e) => updater.setField('description', e.target.value)} />
            </label>

            <div className="ss-fieldRow3">
              <div className="ss-field" style={{ position: 'relative' }}>
                <span className="ss-label">Featured category 1</span>
                <div className="pe-selectMenu" ref={cat1MenuRef}>
                  <button
                    ref={cat1BtnRef}
                    type="button"
                    className="pe-selectControl"
                    onClick={() => setCat1Open((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={cat1Open}
                  >
                    <span>{catsLoading ? 'Loading…' : categoryNameById(data?.featured_category_1)}</span>
                    <img src="/img/chevron-down.svg" alt="" className="pe-icon" />
                  </button>
                  {cat1Open && (
                    <ul className="pe-selectList" role="listbox">
                      <li
                        role="option"
                        aria-selected={!data?.featured_category_1}
                        className={`pe-option ${!data?.featured_category_1 ? 'is-selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          updater.setField('featured_category_1', null)
                          setCat1Open(false)
                          requestAnimationFrame(() => cat1BtnRef.current?.blur())
                        }}
                      >
                        No category
                      </li>
                      {categories.map((c) => (
                        <li
                          key={c.id}
                          role="option"
                          aria-selected={data?.featured_category_1 === c.id}
                          className={`pe-option ${data?.featured_category_1 === c.id ? 'is-selected' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            updater.setField('featured_category_1', c.id)
                            setCat1Open(false)
                            requestAnimationFrame(() => cat1BtnRef.current?.blur())
                          }}
                        >
                          {c.name}
                        </li>
                      ))}
                      {(!categories || categories.length === 0) && (
                        <li className="pe-option is-empty">No categories yet</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className="ss-field" style={{ position: 'relative' }}>
                <span className="ss-label">Featured category 2</span>
                <div className="pe-selectMenu" ref={cat2MenuRef}>
                  <button
                    ref={cat2BtnRef}
                    type="button"
                    className="pe-selectControl"
                    onClick={() => setCat2Open((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={cat2Open}
                  >
                    <span>{catsLoading ? 'Loading…' : categoryNameById(data?.featured_category_2)}</span>
                    <img src="/img/chevron-down.svg" alt="" className="pe-icon" />
                  </button>
                  {cat2Open && (
                    <ul className="pe-selectList" role="listbox">
                      <li
                        role="option"
                        aria-selected={!data?.featured_category_2}
                        className={`pe-option ${!data?.featured_category_2 ? 'is-selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          updater.setField('featured_category_2', null)
                          setCat2Open(false)
                          requestAnimationFrame(() => cat2BtnRef.current?.blur())
                        }}
                      >
                        No category
                      </li>
                      {categories.map((c) => (
                        <li
                          key={c.id}
                          role="option"
                          aria-selected={data?.featured_category_2 === c.id}
                          className={`pe-option ${data?.featured_category_2 === c.id ? 'is-selected' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            updater.setField('featured_category_2', c.id)
                            setCat2Open(false)
                            requestAnimationFrame(() => cat2BtnRef.current?.blur())
                          }}
                        >
                          {c.name}
                        </li>
                      ))}
                      {(!categories || categories.length === 0) && (
                        <li className="pe-option is-empty">No categories yet</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className="ss-field" style={{ position: 'relative' }}>
                <span className="ss-label">Featured category 3</span>
                <div className="pe-selectMenu" ref={cat3MenuRef}>
                  <button
                    ref={cat3BtnRef}
                    type="button"
                    className="pe-selectControl"
                    onClick={() => setCat3Open((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={cat3Open}
                  >
                    <span>{catsLoading ? 'Loading…' : categoryNameById(data?.featured_category_3)}</span>
                    <img src="/img/chevron-down.svg" alt="" className="pe-icon" />
                  </button>
                  {cat3Open && (
                    <ul className="pe-selectList" role="listbox">
                      <li
                        role="option"
                        aria-selected={!data?.featured_category_3}
                        className={`pe-option ${!data?.featured_category_3 ? 'is-selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          updater.setField('featured_category_3', null)
                          setCat3Open(false)
                          requestAnimationFrame(() => cat3BtnRef.current?.blur())
                        }}
                      >
                        No category
                      </li>
                      {categories.map((c) => (
                        <li
                          key={c.id}
                          role="option"
                          aria-selected={data?.featured_category_3 === c.id}
                          className={`pe-option ${data?.featured_category_3 === c.id ? 'is-selected' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            updater.setField('featured_category_3', c.id)
                            setCat3Open(false)
                            requestAnimationFrame(() => cat3BtnRef.current?.blur())
                          }}
                        >
                          {c.name}
                        </li>
                      ))}
                      {(!categories || categories.length === 0) && (
                        <li className="pe-option is-empty">No categories yet</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="ss-actions">
              <button type="button" className="ss-button" onClick={() => updater.save(['name', 'slug', 'heading', 'description', 'featured_category_1', 'featured_category_2', 'featured_category_3'])} disabled={updater.saving}>
                {updater.saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="ss-button ss-button--danger"
                onClick={() => { setConfirmText(''); setDeleteOpen(true) }}
              >
                Delete Shop
              </button>
            </div>
          </form>
        </section>
      )}

      <Modal open={deleteOpen} onClose={() => { if (!deleting) { setDeleteOpen(false); setConfirmText('') } }}>
        <div className="ss-modal">
          <div className="ss-modalTitle">
            <img src="/img/trash-01-r.svg" alt="" className="ss-modalIcon" />
            <span>Delete shop?</span>
          </div>
          <p className="ss-modalText">This action cannot be undone.</p>
            <div className="ss-modalField">
              <div className="ss-label">Type the shop slug to confirm</div>
              <input
                className="ss-input"
              placeholder="Type slug here"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
              <div className="ss-modalHelp">Slug: <span className="ss-code">{shop.data?.slug || ''}</span></div>
            </div>
          <div className="ss-modalActions">
            <button type="button" className="ss-button" onClick={() => { setDeleteOpen(false); setConfirmText('') }} disabled={deleting}>Cancel</button>
            <button
              type="button"
              className="ss-button ss-button--danger"
              onClick={onConfirmDelete}
              disabled={deleting || confirmText.trim() !== (shop.data?.slug || '')}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
