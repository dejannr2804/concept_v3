"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useResourceItem, useResourceUpdater } from '@/hooks/resource'
import { useState } from 'react'

export default function ProductDashboard({ params }: { params: { id: string; productId: string } }) {
  const { id: shopId, productId } = params
  const router = useRouter()
  const updater = useResourceUpdater(`shops/${shopId}/products/${productId}`)
  const shop = useResourceItem<{ id: number; name: string; slug: string }>(`shops/${shopId}`)
  const [slugTouched, setSlugTouched] = useState(false)

  function toSlug(v: string) {
    return v
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  return (
    <main className="container">
      <div className="card">
        <div className="row row-between">
          <div className="row">
            <Link href={`/dashboard/${shopId}`} className="btn btn-secondary">
              Back
            </Link>
            <h1 className="m-0">Product</h1>
          </div>
          <div className="row gap-05">
            {shop.data && updater.data?.slug && (
              <Link href={`/shops/${shop.data.slug}/products/${updater.data.slug}`} className="btn btn-secondary">
                View
              </Link>
            )}
          </div>
        </div>
        <div className="spacer" />
        {updater.loading ? (
          <div>Loading…</div>
        ) : updater.error ? (
          <div className="error">{updater.error}</div>
        ) : (
          <div className="col gap-075">
            <label>
              <div>Name</div>
              <input
                value={updater.data?.name || ''}
                onChange={(e) => {
                  const name = e.target.value
                  updater.setField('name', name)
                  if (!slugTouched) updater.setField('slug', toSlug(name))
                }}
              />
            </label>
            <label>
              <div>Slug</div>
              <input
                value={updater.data?.slug || ''}
                onChange={(e) => { setSlugTouched(true); updater.setField('slug', toSlug(e.target.value)) }}
              />
              <small>Unique within this shop. Leave empty to auto-generate from name.</small>
            </label>
            <div className="row gap-075">
              <label className="flex-1">
                <div>SKU</div>
                <input value={updater.data?.sku || ''} onChange={(e) => updater.setField('sku', e.target.value)} />
              </label>
              <label className="flex-1">
                <div>Category</div>
                <input value={updater.data?.category || ''} onChange={(e) => updater.setField('category', e.target.value)} />
              </label>
            </div>
            <label>
              <div>Short Description</div>
              <input value={updater.data?.short_description || ''} onChange={(e) => updater.setField('short_description', e.target.value)} />
            </label>
            <label>
              <div>Long Description</div>
              <textarea rows={6} value={updater.data?.long_description || ''}
                onChange={(e) => updater.setField('long_description', e.target.value)} />
            </label>
            <div className="row gap-075">
              <label className="flex-1">
                <div>Status</div>
                <select value={updater.data?.status || 'active'} onChange={(e) => updater.setField('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="flex-1">
                <div>Stock Status</div>
                <select value={updater.data?.stock_status || 'in_stock'} onChange={(e) => updater.setField('stock_status', e.target.value)}>
                  <option value="in_stock">In stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </label>
            </div>
            <div className="row gap-075">
              <label className="flex-1">
                <div>Base Price</div>
                <input type="number" step="0.01" value={updater.data?.base_price ?? 0}
                  onChange={(e) => updater.setField('base_price', e.target.value === '' ? '' : Number(e.target.value))} />
              </label>
              <label className="flex-1">
                <div>Discounted Price</div>
                <input type="number" step="0.01" value={updater.data?.discounted_price ?? ''}
                  onChange={(e) => updater.setField('discounted_price', e.target.value === '' ? null : Number(e.target.value))} />
              </label>
              <label className="w-120">
                <div>Currency</div>
                <input value={updater.data?.currency || 'USD'} onChange={(e) => updater.setField('currency', e.target.value.toUpperCase())} />
              </label>
            </div>
            <div className="row gap-075">
              <label className="flex-1">
                <div>Stock Quantity</div>
                <input type="number" value={updater.data?.stock_quantity ?? 0}
                  onChange={(e) => updater.setField('stock_quantity', Number(e.target.value))} />
              </label>
              <label className="flex-1">
                <div>Available From</div>
                <input type="date" value={updater.data?.available_from || ''}
                  onChange={(e) => updater.setField('available_from', e.target.value || null)} />
              </label>
              <label className="flex-1">
                <div>Available To</div>
                <input type="date" value={updater.data?.available_to || ''}
                  onChange={(e) => updater.setField('available_to', e.target.value || null)} />
              </label>
            </div>
            <div className="row gap-05">
              <button
                onClick={() => updater.save([
                  'name', 'slug', 'sku', 'category',
                  'short_description', 'long_description',
                  'status',
                  'base_price', 'discounted_price', 'currency',
                  'stock_quantity', 'stock_status',
                  'available_from', 'available_to',
                ])}
                disabled={updater.saving}
              >
                {updater.saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={async () => {
                  const res = await updater.deleteResource()
                  if (res.ok) { router.push(`/dashboard/${shopId}`); router.refresh() }
                }}
                disabled={updater.deleting}
                className="btn btn-danger"
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
