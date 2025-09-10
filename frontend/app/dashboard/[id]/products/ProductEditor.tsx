"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useResourceCreator, useResourceItem, useResourceUpdater } from '@/hooks/resource'
import styles from './product-editor.module.css'
import { api } from '@/lib/api'
import { useNotifications } from '@/components/Notifications'

type Mode = 'create' | 'update'

type ImageItem = {
  id: string
  file: File
  previewUrl: string
  progress: number
  uploading: boolean
  error?: string | null
}

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
  const [slugTouched, setSlugTouched] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const notify = useNotifications()

  // Local mirror of server images so we can append after upload
  const [serverImages, setServerImages] = useState<{ id: number; url: string; alt_text?: string; sort_order?: number }[]>([])

  const shop = useResourceItem<{ id: number; name: string; slug: string }>(`shops/${shopId}`)

  const updater = mode === 'update' && productId
    ? useResourceUpdater(`shops/${shopId}/products/${productId}`)
    : null

  const creator = mode === 'create'
    ? useResourceCreator(`shops/${shopId}/products`)
    : null

  const data = (mode === 'create' ? creator?.data : updater?.data) || {}
  const canUpload = mode === 'update' && Boolean(productId)
  const setField = (name: string, value: any) => {
    if (mode === 'create' && creator) creator.setField(name, value)
    else if (mode === 'update' && updater) updater.setField(name, value)
  }

  function toSlug(v: string) {
    return (v || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Drop handlers
  const onFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    const items: ImageItem[] = arr.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      progress: 0,
      uploading: true,
      error: null,
    }))
    setImages((prev) => [...prev, ...items])

    // Upload each file
    items.forEach(async (item) => {
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('alt_text', item.file.name)
        const created = await api.upload<{ id: number; url: string; alt_text?: string }>(
          `shops/${shopId}/products/${productId}/images/upload`,
          fd
        )
        setServerImages((prev) => [...prev, created])
        setImages((prev) => prev.filter((x) => x.id !== item.id))
        notify.success('Image uploaded')
      } catch (e: any) {
        const msg = e?.message || 'Upload failed'
        setImages((prev) => prev.map((x) => x.id === item.id ? { ...x, uploading: false, error: msg } : x))
        notify.error(msg)
      }
    })
  }, [shopId, productId, notify])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files)
  }, [onFiles])
  const onBrowse = useCallback(() => inputRef.current?.click(), [])

  useEffect(() => {
    const list = (updater?.data?.images || []) as { id: number; url: string; alt_text?: string; sort_order?: number }[]
    setServerImages(list)
  }, [updater?.data])

  const loading = updater ? updater.loading : false
  const error = updater ? updater.error : null

  const primaryLabel = mode === 'create' ? (creator?.saving ? 'Creating…' : 'Create') : (updater?.saving ? 'Saving…' : 'Update')
  const primaryDisabled = mode === 'create' ? Boolean(creator?.saving) : Boolean(updater?.saving)

  async function onPrimary() {
    const keys = [
      'name', 'slug', 'sku', 'category',
      'short_description', 'long_description',
      'status',
      'base_price', 'discounted_price', 'currency',
      'stock_quantity', 'stock_status',
      'available_from', 'available_to',
    ]
    if (mode === 'create' && creator) {
      const n = String(creator.data?.name || '').trim()
      if (!n) return alert('Product name is required')
      const currentSlug = String(creator.data?.slug || '').trim()
      if (!currentSlug) creator.setField('slug', toSlug(n))
      const sku = String(creator.data?.sku || '').trim()
      if (!sku) return alert('SKU is required')
      const res = await creator.create(keys)
      if (res.ok) { router.push(`/dashboard/${shopId}`); router.refresh() }
    } else if (mode === 'update' && updater) {
      await updater.save(keys)
    }
  }

  async function onDelete() {
    if (mode === 'update' && updater) {
      const res = await updater.deleteResource()
      if (res.ok) { router.push(`/dashboard/${shopId}`); router.refresh() }
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href={`/dashboard/${shopId}`} className={styles.btnSecondary}>Back</Link>
          <h1 className={styles.title}>Product</h1>
        </div>
        <div className={styles.actions}>
          {mode === 'update' && shop.data && updater?.data?.slug && (
            <Link href={`/shops/${shop.data.slug}/products/${updater.data.slug}`} className={styles.btnSecondary}>
              View
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.grid}>
          {/* Left: Images */}
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Add Images</h2>
            <div
              className={styles.dropZone}
              onDrop={canUpload ? onDrop : undefined}
              onDragOver={(e) => { if (!canUpload) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
              onClick={canUpload ? onBrowse : undefined}
              role="button"
              aria-label="Drop files or click to browse"
            >
              <div>
                {canUpload ? (
                  <>Drop your files here, or <span className={styles.link}>Browse</span></>
                ) : (
                  <>Save the product first to upload images.</>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.hiddenFile}
                onChange={(e) => { if (canUpload && e.target.files) onFiles(e.target.files); e.currentTarget.value = '' }}
              />
            </div>

            {serverImages?.length > 0 && (
              <div className={styles.fileList}>
                {serverImages.map((im, i) => (
                  <div key={`srv-${i}`} className={styles.fileItem}>
                    <img src={im.url} alt="" className={styles.thumb} />
                    <div className={styles.fileMeta}>
                      <div className={styles.fileName}>{im.url.split('/').pop()}</div>
                      <div className={styles.progressBar}><div className={styles.progressInner} style={{ width: '100%' }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.fileList}>
              {images.map((it) => (
                <div key={it.id} className={styles.fileItem}>
                  <img src={it.previewUrl} alt="preview" className={styles.thumb} />
                  <div className={styles.fileMeta}>
                    <div className={styles.fileName}>{it.file.name}</div>
                    <div className={styles.progressBar} aria-label={`Upload ${it.progress}%`}>
                      <div className={styles.progressInner} style={{ width: `${it.progress}%` }} />
                    </div>
                  </div>
                  <button
                    className={styles.iconButton}
                    onClick={() => setImages((prev) => prev.filter((x) => x.id !== it.id))}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Fields */}
          <section className={styles.panel}>
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              <label className={styles.formField}>
                <span className={styles.label}>Product Name</span>
                <input
                  className={styles.input}
                  value={data?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value
                    setField('name', name)
                    if (!slugTouched) setField('slug', toSlug(name))
                  }}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.label}>Slug</span>
                <input
                  className={styles.input}
                  value={data?.slug || ''}
                  onChange={(e) => { setSlugTouched(true); setField('slug', toSlug(e.target.value)) }}
                />
              </label>

              <div className={styles.rowFields}>
                <label className={styles.formField}>
                  <span className={styles.label}>SKU</span>
                  <input className={styles.input} value={data?.sku || ''} onChange={(e) => setField('sku', e.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span className={styles.label}>Category</span>
                  <input className={styles.input} value={data?.category || ''} onChange={(e) => setField('category', e.target.value)} />
                </label>
              </div>

              <label className={styles.formField}>
                <span className={styles.label}>Short Description</span>
                <input className={styles.input} value={data?.short_description || ''} onChange={(e) => setField('short_description', e.target.value)} />
              </label>
              <label className={styles.formField}>
                <span className={styles.label}>Description</span>
                <textarea className={styles.textarea} rows={6} value={data?.long_description || ''}
                  onChange={(e) => setField('long_description', e.target.value)} />
              </label>

              <div className={styles.rowFields}>
                <label className={styles.formField}>
                  <span className={styles.label}>Status</span>
                  <select className={styles.select} value={data?.status || 'active'} onChange={(e) => setField('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className={styles.formField}>
                  <span className={styles.label}>Stock Status</span>
                  <select className={styles.select} value={data?.stock_status || 'in_stock'} onChange={(e) => setField('stock_status', e.target.value)}>
                    <option value="in_stock">In stock</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                </label>
              </div>

              <div className={styles.rowFields3}>
                <label className={styles.formField}>
                  <span className={styles.label}>Price</span>
                  <input className={styles.input} type="number" step="0.01" value={data?.base_price ?? 0}
                    onChange={(e) => setField('base_price', e.target.value === '' ? '' : Number(e.target.value))} />
                </label>
                <label className={styles.formField}>
                  <span className={styles.label}>Discounted Price</span>
                  <input className={styles.input} type="number" step="0.01" value={data?.discounted_price ?? ''}
                    onChange={(e) => setField('discounted_price', e.target.value === '' ? null : Number(e.target.value))} />
                </label>
                <label className={styles.formField}>
                  <span className={styles.label}>Currency</span>
                  <input className={styles.input} value={data?.currency || 'USD'} onChange={(e) => setField('currency', e.target.value.toUpperCase())} />
                </label>
              </div>

              <div className={styles.rowFields}>
                <label className={styles.formField}>
                  <span className={styles.label}>Stock Quantity</span>
                  <input className={styles.input} type="number" value={data?.stock_quantity ?? 0}
                    onChange={(e) => setField('stock_quantity', Number(e.target.value))} />
                </label>
                <label className={styles.formField}>
                  <span className={styles.label}>Available From</span>
                  <input className={styles.input} type="date" value={data?.available_from || ''}
                    onChange={(e) => setField('available_from', e.target.value || null)} />
                </label>
                <label className={styles.formField}>
                  <span className={styles.label}>Available To</span>
                  <input className={styles.input} type="date" value={data?.available_to || ''}
                    onChange={(e) => setField('available_to', e.target.value || null)} />
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnPrimary} onClick={onPrimary} disabled={primaryDisabled}>
                  {primaryLabel}
                </button>
                {mode === 'update' && (
                  <button type="button" className={styles.btnDanger} disabled={Boolean(updater?.deleting)} onClick={onDelete}>
                    {updater?.deleting ? 'Deleting…' : 'Delete Product'}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
