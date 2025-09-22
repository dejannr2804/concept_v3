"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useResourceCreator, useResourceItem, useResourceUpdater, useResourceList } from '@/hooks/resource'
import { api } from '@/lib/api'
import { useNotifications } from '@/components/Notifications'
import Modal from '@/components/Modal'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'

type Mode = 'create' | 'update'

type ImageItem = {
  id: string
  file: File
  previewUrl: string
  progress: number
  uploading: boolean
  error?: string | null
}

const PRODUCT_FIELD_KEYS = [
  'name', 'slug', 'sku', 'category',
  'short_description', 'long_description',
  'status',
  'base_price', 'discounted_price', 'currency',
  'stock_quantity', 'stock_status',
  'available_from', 'available_to',
]

export default function ProductEditor({
  shopId,
  mode,
  productId,
}: {
  shopId: string
  mode: Mode
  productId?: string
}) {
  const router = useRouter()
  const [slugTouched, setSlugTouched] = useState(() => mode === 'update')
  const [images, setImages] = useState<ImageItem[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const notify = useNotifications()

  // Local mirror of server images so we can append after upload
  const [serverImages, setServerImages] = useState<{ id: number; url: string; alt_text?: string; sort_order?: number }[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [dragIndexPending, setDragIndexPending] = useState<number | null>(null)
  const [overIndexPending, setOverIndexPending] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const originalDataRef = useRef<Record<string, any> | null>(null)
  const [baselineReady, setBaselineReady] = useState(mode === 'create')
  const [imageSaving, setImageSaving] = useState(false)

  function reorder<T>(arr: T[], from: number, to: number): T[] {
    const next = arr.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  }

  const shop = useResourceItem<{ id: number; name: string; slug: string }>(`shops/${shopId}`)
  const categoryList = useResourceList<{ id: number; name: string }>(`shops/${shopId}/categories`)
  const [catOpen, setCatOpen] = useState(false)
  const catMenuRef = useRef<HTMLDivElement | null>(null)
  const catBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!catOpen) return
    function onDown(e: MouseEvent) {
      const el = catMenuRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setCatOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCatOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [catOpen])

  // Always call hooks in the same order to satisfy React Rules of Hooks
  const updater = useResourceUpdater(
    `shops/${shopId}/products/${productId ?? 'new'}`,
    { load: mode === 'update' && Boolean(productId) }
  )

  const creator = useResourceCreator(`shops/${shopId}/products`)

  const data = (mode === 'create' ? creator.data : updater.data) || {}
  const setField = (name: string, value: any) => {
    if (mode === 'create') creator.setField(name, value)
    else updater.setField(name, value)
  }

  function toSlug(v: string) {
    return (v || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function isMeaningfulValue(value: any) {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (typeof value === 'number') return Number.isFinite(value) && value !== 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return Boolean(value)
  }

  function valuesEqual(a: any, b: any) {
    if (a === b) return true
    if (a === null || a === undefined || b === null || b === undefined) {
      return a == null && b == null
    }
    const typeA = typeof a
    const typeB = typeof b
    if ((typeA === 'number' || typeA === 'string') && (typeB === 'number' || typeB === 'string')) {
      return String(a) === String(b)
    }
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }

  // Drop handlers
  const onFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    const items: ImageItem[] = arr.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      progress: 0,
      uploading: false,
      error: null,
    }))
    setImages((prev) => [...prev, ...items])

  }, [shopId, productId])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files)
  }, [onFiles])
  const onBrowse = useCallback(() => inputRef.current?.click(), [])

  useEffect(() => {
    if (mode !== 'update') return
    const list = (updater.data?.images || []) as { id: number; url: string; alt_text?: string; sort_order?: number }[]
    setServerImages(list)
  }, [mode, updater.data?.images])


  const loading = updater.loading
  const error = updater.error

  // Custom delete confirmation UI (declare hooks before any early returns)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (mode === 'update' && !baselineReady && !loading && updater.data) {
      originalDataRef.current = JSON.parse(JSON.stringify(updater.data || {}))
      setBaselineReady(true)
    }
  }, [mode, baselineReady, loading, updater.data])

  let coverImage: string | null = null
  let coverAlt = 'No cover image yet'
  if (serverImages.length > 0) {
    coverImage = serverImages[0]?.url ?? null
    coverAlt = serverImages[0]?.alt_text || 'Cover image'
  } else if (images.length > 0) {
    coverImage = images[0]?.previewUrl ?? null
    coverAlt = images[0]?.file?.name || 'Cover image'
  }

  const currencyCode = typeof data?.currency === 'string' && data.currency.trim() ? data.currency.trim().toUpperCase() : 'USD'
  function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(value)
    } catch (err) {
      return `$${Number(value).toFixed(2)}`
    }
  }

  const statusText = data?.status === 'inactive' ? 'Inactive' : 'Active'
  const statusHint = statusText === 'Active'
    ? 'Customers can see and purchase this product.'
    : 'Hidden from the storefront until you set it to active.'
  const basePriceValue = typeof data?.base_price === 'number' ? data.base_price : Number(data?.base_price ?? NaN)
  const basePriceDisplay = formatCurrency(basePriceValue)
  const hasDiscount = typeof data?.discounted_price === 'number' && Number.isFinite(data.discounted_price)
  const discountedPriceDisplay = hasDiscount ? formatCurrency(data?.discounted_price as number) : null

  const imageChangesPending = useMemo(() => {
    if (mode === 'create') {
      return images.length > 0
    }
    if (!baselineReady) {
      return images.length > 0
    }
    const baseline = originalDataRef.current || {}
    const baselineImages = (baseline?.images || []) as { id: number }[]
    const baselineIds = baselineImages.map((img) => img.id)
    const currentIds = serverImages.map((img) => img.id)
    const orderChanged = baselineIds.length !== currentIds.length || baselineIds.some((id, idx) => id !== currentIds[idx])
    return orderChanged || images.length > 0
  }, [mode, baselineReady, serverImages, images])

  const fieldChangeCount = useMemo(() => {
    if (mode === 'create') {
      const src = creator?.data || {}
      let count = 0
      for (const key of PRODUCT_FIELD_KEYS) {
        const value = src[key]
        if (isMeaningfulValue(value)) count += 1
      }
      return count
    }
    if (!baselineReady) return 0
    const baseline = originalDataRef.current || {}
    const src = updater?.data || {}
    let count = 0
    for (const key of PRODUCT_FIELD_KEYS) {
      if (!valuesEqual(src[key], baseline[key])) count += 1
    }
    return count
  }, [mode, creator?.data, updater?.data, baselineReady])

  const fieldChangesPending = fieldChangeCount > 0

  const unsavedCount = useMemo(() => {
    let total = fieldChangeCount
    if (imageChangesPending) total += 1
    return total
  }, [fieldChangeCount, imageChangesPending])

  const hasUnsaved = unsavedCount > 0

  if (shop.loading || loading || categoryList.loading) {
    return <DashboardLoadingPlaceholder />
  }

  const isSaving = mode === 'create'
    ? Boolean(creator?.saving || imageSaving)
    : Boolean(updater?.saving || imageSaving)
  const primaryLabel = mode === 'create'
    ? (isSaving ? 'Creating…' : 'Create')
    : (isSaving ? 'Saving…' : 'Update')
  const primaryDisabled = isSaving

  async function applyImageChanges(): Promise<{ id: number; url: string; alt_text?: string; sort_order?: number }[]> {
    if (!(mode === 'update' && productId)) return serverImages

    const baselineImages = (originalDataRef.current?.images || []) as { id: number; url: string; alt_text?: string; sort_order?: number }[]
    const currentImages = serverImages
    const currentIds = currentImages.map((img) => img.id)
    const toDelete = baselineImages.filter((img) => !currentIds.includes(img.id))

    for (const img of toDelete) {
      try {
        await api.delete(`shops/${shopId}/products/${productId}/images/${img.id}`)
      } catch (e: any) {
        notify.error(e?.message || 'Failed to remove image')
        throw e
      }
    }

    const uploadedImages: { id: number; url: string; alt_text?: string; sort_order?: number }[] = []
    for (const item of images) {
      setImages((prev) => prev.map((x) => x.id === item.id ? { ...x, uploading: true, error: null } : x))
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('alt_text', item.file.name)
        const created = await api.upload<{ id: number; url: string; alt_text?: string; sort_order?: number }>(
          `shops/${shopId}/products/${productId}/images/upload`,
          fd
        )
        uploadedImages.push(created)
        setImages((prev) => prev.filter((x) => x.id !== item.id))
      } catch (e: any) {
        const msg = e?.message || 'Upload failed'
        setImages((prev) => prev.map((x) => x.id === item.id ? { ...x, uploading: false, error: msg } : x))
        notify.error(msg)
        throw e
      }
    }

    const finalImages = [...currentImages, ...uploadedImages]
    const baselineIds = baselineImages.map((img) => img.id)
    const finalIds = finalImages.map((img) => img.id)
    const orderChanged = baselineIds.length !== finalIds.length || baselineIds.some((id, idx) => id !== finalIds[idx])
    const didChange = toDelete.length > 0 || uploadedImages.length > 0 || orderChanged

    if (orderChanged && finalIds.length > 0) {
      try {
        await api.post(`shops/${shopId}/products/${productId}/images/reorder`, { order: finalIds })
      } catch (e: any) {
        notify.error(e?.message || 'Failed to update image order')
        throw e
      }
    }

    setServerImages(finalImages)
    setImages([])
    setField('images', finalImages)
    return finalImages
  }

  async function onPrimary() {
    if (mode === 'create' && creator) {
      const n = String(creator.data?.name || '').trim()
      if (!n) return alert('Product name is required')
      const currentSlug = String(creator.data?.slug || '').trim()
      if (!currentSlug) creator.setField('slug', toSlug(n))
      const sku = String(creator.data?.sku || '').trim()
      if (!sku) return alert('SKU is required')
      const res = await creator.create(PRODUCT_FIELD_KEYS)
      if (res.ok) {
        const createdId = (res.data as any)?.id
        if (createdId && images.length > 0) {
          // Upload queued images to the newly created product
          const createdImgs: { id: number }[] = []
          for (const item of images) {
            try {
              setImages((prev) => prev.map((x) => x.id === item.id ? { ...x, uploading: true } : x))
              const fd = new FormData()
              fd.append('file', item.file)
              fd.append('alt_text', item.file.name)
              const created = await api.upload<{ id: number }>(`shops/${shopId}/products/${createdId}/images/upload`, fd)
              if (created && (created as any).id) createdImgs.push({ id: (created as any).id })
              setImages((prev) => prev.filter((x) => x.id !== item.id))
            } catch (e: any) {
              const msg = e?.message || 'Upload failed'
              setImages((prev) => prev.map((x) => x.id === item.id ? { ...x, uploading: false, error: msg } : x))
              notify.error(msg)
            }
          }
          if (createdImgs.length > 0) {
            try { await api.post(`shops/${shopId}/products/${createdId}/images/reorder`, { order: createdImgs.map((x) => x.id) }) } catch {}
          }
          // After creating and uploading images, go to the products page
          router.push(`/dashboard/${shopId}/products`)
          router.refresh()
        } else {
          router.push(`/dashboard/${shopId}/products`)
          router.refresh()
        }
      }
    } else if (mode === 'update' && updater) {
      setImageSaving(true)
      try {
        const hadFieldChanges = fieldChangesPending
        let savedAny = false

        if (hadFieldChanges) {
          const res = await updater.save(PRODUCT_FIELD_KEYS)
          if (!res?.ok) return
          savedAny = true
        }

        if (imageChangesPending) {
          const latestImages = await applyImageChanges()
          originalDataRef.current = JSON.parse(JSON.stringify({ ...(updater.data || {}), images: latestImages }))
          savedAny = true
        } else if (savedAny) {
          originalDataRef.current = JSON.parse(JSON.stringify(updater.data || {}))
        }

        if (!savedAny) {
          notify.info('No changes to save')
        } else if (!hadFieldChanges) {
          notify.success('Changes saved')
        }
      } finally {
        setImageSaving(false)
      }
    }
  }

  async function onConfirmDelete() {
    if (!(mode === 'update' && updater && productId)) return
    setDeleting(true)
    try {
      await api.delete(`shops/${shopId}/products/${productId}`)
      notify.success('Product deleted')
      setDeleteOpen(false)
      router.push(`/dashboard/${shopId}/products`)
      router.refresh()
    } catch (e: any) {
      notify.error(e?.message || 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <main className="pe-page dlp-fadeIn">
      <div className="pe-header">
        <div className="pe-titleGroup">
          <Link href={`/dashboard/${shopId}/products`} className="pe-back">
            <img src="/img/arrow-narrow-left.svg" alt=""/>
            <span>Go back</span>
          </Link>
          <h1 className="pe-title">{mode === 'create' ? 'Create New Product' : 'Product Dashboard'}</h1>
        </div>
        <div className="pe-actions">
          {mode === 'update' && shop.data && updater?.data?.slug && (
              <Link href={`/shops/${shop.data.slug}/products/${updater.data.slug}`} className="pe-preview" target="_blank" rel="noopener noreferrer">
                <img src="/img/arrow-narrow-up-right.svg" alt=""/>
                <span>Preview</span>
              </Link>
          )}
        </div>
      </div>

      {loading ? (
          <DashboardLoadingPlaceholder />
      ) : error ? (
        <div className="pe-error">{error}</div>
      ) : (
        <div className="pe-grid">
          {/* Left: Images */}
          <section className="pe-panel">
            <h2 className="pe-sectionTitle">Add Images</h2>
            <div
              className="pe-dropZone"
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
              onClick={onBrowse}
              role="button"
              aria-label="Drop files or click to browse"
            >
              <div>Drop your files here, or <span className="pe-link">Browse</span></div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="pe-hiddenFile"
                onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.currentTarget.value = '' }}
              />
            </div>

            {serverImages?.length > 0 && (
              <div className="pe-imageGrid">
                {serverImages.map((im, i) => (
                  <div
                    key={`srv-${im.id ?? i}`}
                    className={`pe-imageCard ${overIndex === i ? 'pe-dragOver' : ''}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setOverIndex(i) }}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === i) { setDragIndex(null); setOverIndex(null); return }
                      const next = reorder(serverImages, dragIndex, i)
                      setServerImages(next)
                      if (mode === 'update') setField('images', next)
                      setDragIndex(null); setOverIndex(null)
                    }}
                    title="Drag to reorder"
                  >
                    <img src={im.url} alt="" className="pe-image" onClick={(e) => { e.stopPropagation(); setPreviewUrl(im.url) }} />
                    <button
                      className="pe-removeBtn"
                      onClick={(e) => {
                        e.stopPropagation()
                        const next = serverImages.filter((x) => x.id !== im.id)
                        setServerImages(next)
                        if (mode === 'update') setField('images', next)
                      }}
                      aria-label="Remove image"
                    >
                      <img src="/img/trash-01-r.svg" alt=""/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <div className="pe-imageGrid">
                {images.map((it, i) => (
                  <div
                    key={it.id}
                    className={`pe-imageCard ${overIndexPending === i ? 'pe-dragOver' : ''}`}
                    draggable
                    onDragStart={() => setDragIndexPending(i)}
                    onDragOver={(e) => { e.preventDefault(); setOverIndexPending(i) }}
                    onDragEnd={() => { setDragIndexPending(null); setOverIndexPending(null) }}
                    onDrop={() => {
                      if (dragIndexPending === null || dragIndexPending === i) { setDragIndexPending(null); setOverIndexPending(null); return }
                      const next = reorder(images, dragIndexPending, i)
                      setImages(next)
                      setDragIndexPending(null); setOverIndexPending(null)
                    }}
                    title="Drag to reorder"
                  >
                    <img src={it.previewUrl} alt="preview" className="pe-image" onClick={() => setPreviewUrl(it.previewUrl)} />
                    {it.uploading && (
                      <div className="pe-progressBar" aria-label="Uploading" style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
                        <div className="pe-progressInner" style={{ width: '60%' }} />
                      </div>
                    )}
                    <button
                      className="pe-removeBtn"
                      onClick={(e) => { e.stopPropagation(); setImages((prev) => prev.filter((x) => x.id !== it.id)) }}
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Modal open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)}>
              {previewUrl ? (
                <img src={previewUrl} alt="preview" style={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
              ) : null}
            </Modal>
          </section>

          {/* Right: Fields */}
          <section className="pe-panel">
            <form className="pe-form" onSubmit={(e) => e.preventDefault()}>
              <div className="pe-formGroup">
                <h3 className="pe-groupTitle">Basic Info</h3>
                <label className="pe-formField">
                  <span className="pe-label">Product Name</span>
                  <input
                      className="pe-input"
                      value={data?.name || ''}
                      onChange={(e) => {
                        const name = e.target.value
                        setField('name', name)
                        if (mode === 'create' && !slugTouched) setField('slug', toSlug(name))
                      }}
                  />
                </label>
                <label className="pe-formField">
                  <span className="pe-label">Slug</span>
                  <input
                      className="pe-input"
                      value={data?.slug || ''}
                      onChange={(e) => {
                        setSlugTouched(true)
                        setField('slug', toSlug(e.target.value))
                      }}
                  />
                </label>

                <div className="pe-rowFields">
                  <label className="pe-formField">
                    <span className="pe-label">SKU</span>
                    <input className="pe-input" value={data?.sku || ''}
                           onChange={(e) => setField('sku', e.target.value)}/>
                  </label>
                  <label className="pe-formField">
                    <span className="pe-label">Category</span>
                    <div className="pe-selectMenu" ref={catMenuRef}>
                      <button
                          type="button"
                          className="pe-selectControl"
                          onClick={() => setCatOpen((v) => !v)}
                          aria-haspopup="listbox"
                          aria-expanded={catOpen}
                          ref={catBtnRef}
                      >
                        <span>{data?.category || 'Select category'}</span>
                        <img src="/img/chevron-down.svg" alt="" className="pe-icon"/>
                      </button>
                      {catOpen && (
                          <ul className="pe-selectList" role="listbox">
                            <li
                                role="option"
                                aria-selected={!data?.category}
                                className={`pe-option ${!data?.category ? 'is-selected' : ''}`}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  setField('category', null)
                                  setCatOpen(false)
                                  requestAnimationFrame(() => catBtnRef.current?.blur())
                                }}
                            >
                              No category
                            </li>
                            {categoryList.data?.map((c) => (
                                <li
                                    key={c.id}
                                    role="option"
                                    aria-selected={data?.category === c.name}
                                    className={`pe-option ${data?.category === c.name ? 'is-selected' : ''}`}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      setField('category', c.name)
                                      setCatOpen(false)
                                      requestAnimationFrame(() => catBtnRef.current?.blur())
                                    }}
                                >
                                  {c.name}
                                </li>
                            ))}
                            {(!categoryList.data || categoryList.data.length === 0) && (
                                <li className="pe-option is-empty">No categories yet</li>
                            )}
                          </ul>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="pe-formGroup">
                <h3 className="pe-groupTitle">Descriptions</h3>
                <label className="pe-formField">
                  <span className="pe-label">Short Description</span>
                  <input className="pe-input" value={data?.short_description || ''}
                         onChange={(e) => setField('short_description', e.target.value)}/>
                </label>
                <label className="pe-formField">
                  <span className="pe-label">Description</span>
                  <textarea className="pe-textarea" rows={6} value={data?.long_description || ''}
                            onChange={(e) => setField('long_description', e.target.value)}/>
                </label>
              </div>

              <div className="pe-formGroup">
                <h3 className="pe-groupTitle">Pricing</h3>
                <div className="pe-rowFields3">
                  <label className="pe-formField">
                    <span className="pe-label">Price</span>
                    <input className="pe-input" type="number" step="0.01" value={data?.base_price ?? 0}
                           onChange={(e) => setField('base_price', e.target.value === '' ? '' : Number(e.target.value))}/>
                  </label>
                  <label className="pe-formField">
                    <span className="pe-label">Discounted Price</span>
                    <input className="pe-input" type="number" step="0.01" value={data?.discounted_price ?? ''}
                           onChange={(e) => setField('discounted_price', e.target.value === '' ? null : Number(e.target.value))}/>
                  </label>
                  <label className="pe-formField">
                    <span className="pe-label">Currency</span>
                    <input className="pe-input" value={data?.currency || 'USD'}
                           onChange={(e) => setField('currency', e.target.value.toUpperCase())}/>
                  </label>
                </div>
              </div>

              <div className="pe-formGroup">
                <h3 className="pe-groupTitle">Inventory</h3>
                <div className="pe-rowFields">
                  <label className="pe-formField">
                    <span className="pe-label">Status</span>
                    <select className="pe-select" value={data?.status || 'active'}
                            onChange={(e) => setField('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="pe-formField">
                    <span className="pe-label">Stock Status</span>
                    <select className="pe-select" value={data?.stock_status || 'in_stock'}
                            onChange={(e) => setField('stock_status', e.target.value)}>
                      <option value="in_stock">In stock</option>
                      <option value="out_of_stock">Out of stock</option>
                    </select>
                  </label>
                </div>
                <div className="pe-rowFields3">
                  <label className="pe-formField">
                    <span className="pe-label">Stock Quantity</span>
                    <input className="pe-input" type="number" value={data?.stock_quantity ?? 0}
                           onChange={(e) => setField('stock_quantity', Number(e.target.value))}/>
                  </label>
                  <label className="pe-formField">
                    <span className="pe-label">Available From</span>
                    <input className="pe-input" type="date" value={data?.available_from || ''}
                           onChange={(e) => setField('available_from', e.target.value || null)}/>
                  </label>
                  <label className="pe-formField">
                    <span className="pe-label">Available To</span>
                    <input className="pe-input" type="date" value={data?.available_to || ''}
                           onChange={(e) => setField('available_to', e.target.value || null)}/>
                  </label>
                </div>
              </div>

            </form>
          </section>
        </div>
      )}

        {/* Delete confirmation modal */}
        <Modal open={deleteOpen} onClose={() => (!deleting && setDeleteOpen(false))}>
          <div style={{background: '#fff', color: '#111', padding: 20, minWidth: 320}}>
            <h3 style={{margin: '4px 0 12px 0'}}>Delete product?</h3>
            <p className="pe-muted" style={{marginBottom: 16}}>This action cannot be undone.</p>
            <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
              <button type="button" className="pe-preview pe-down" onClick={() => setDeleteOpen(false)}
                      disabled={deleting}>Cancel
              </button>
              <button type="button" className="pe-preview pe-down pe-red" onClick={onConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
      <div className="pe-rightpanel">
        <div className="pe-coverMeta">
          <span className="pe-coverLabel">Cover image</span>
          <p className="pe-coverHint">We use the first gallery image as the primary photo.</p>
        </div>
        <div className="pe-coverArea">
          {coverImage ? (
              <img src={coverImage} alt={coverAlt} className="pe-coverImage"/>
          ) : (
              <div className="pe-coverPlaceholder">
                <div className="pe-coverPlaceholderInner">
                  <img src="/img/image-03.svg" alt="" className="pe-coverIcon" aria-hidden="true"/>
                  <span>Upload images to set a cover</span>
                </div>
              </div>
          )}
        </div>
        <div className="pe-rightDetails">
          <div className="pe-rightCard">
            <span className="pe-rightCardTitle">Product status</span>
            <span className={`pe-statusBadge ${statusText === 'Active' ? 'is-live' : 'is-draft'}`}>{statusText}</span>
            <p className="pe-rightCardHint">{statusHint}</p>
          </div>
          {/*<div className="pe-rightCard">*/}
          {/*  <span className="pe-rightCardTitle">Pricing</span>*/}
          {/*  <dl className="pe-rightList">*/}
          {/*    <div className="pe-rightItem">*/}
          {/*      <dt>Base price</dt>*/}
          {/*      <dd>{basePriceDisplay}</dd>*/}
          {/*    </div>*/}
          {/*    {hasDiscount ? (*/}
          {/*      <div className="pe-rightItem">*/}
          {/*        <dt>Discounted</dt>*/}
          {/*        <dd>{discountedPriceDisplay}</dd>*/}
          {/*      </div>*/}
          {/*    ) : null}*/}
          {/*    <div className="pe-rightItem">*/}
          {/*      <dt>Currency</dt>*/}
          {/*      <dd>{currencyCode}</dd>*/}
          {/*    </div>*/}
          {/*  </dl>*/}
          {/*</div>*/}
          <div className={`pe-rightCard pe-cardWarning ${hasUnsaved ? 'is-warning' : 'is-clear'}`}>
            <div className="pe-rightUnsavedHeader">
              <span className={`pe-warningDot ${hasUnsaved ? 'is-warning' : 'is-clear'}`} aria-hidden="true"></span>
              <span className="pe-rightCardTitle">Unsaved changes</span>
            </div>
            <div className="pe-rightUnsavedContent">
              <span className={`pe-rightUnsavedCount ${hasUnsaved ? 'is-warning' : 'is-clear'}`}>{unsavedCount}</span>
              <p className={`pe-rightCardHint ${hasUnsaved ? 'is-warning' : 'is-clear'}`}>
                {hasUnsaved ? 'Remember to save your edits.' : 'Nothing to save right now.'}
              </p>
            </div>
          </div>
        </div>
        <div className="pe-rightActions">
          <span className="pe-rightTitle">Actions</span>
          <p className="pe-rightHint">Save your changes or remove the product.</p>
          <button type="button" className="pe-preview pe-down" onClick={onPrimary} disabled={primaryDisabled}>
            <span>{primaryLabel}</span>
          </button>
          {mode === 'update' && (
            <button type="button" className="pe-preview pe-down pe-red" onClick={() => setDeleteOpen(true)}>
              Delete
            </button>
          )}
        </div>
      </div>
  </>
  )
}
