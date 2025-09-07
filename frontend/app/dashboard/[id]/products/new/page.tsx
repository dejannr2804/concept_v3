"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useResourceCreator } from '@/hooks/resource'

export default function NewProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const creator = useResourceCreator(`shops/${id}/products`)
  const [slugTouched, setSlugTouched] = useState(false)

  function toSlug(v: string) {
    return v
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = String(creator.data?.name || '').trim()
    if (!n) return alert('Product name is required')
    const currentSlug = String(creator.data?.slug || '').trim()
    if (!currentSlug) creator.setField('slug', toSlug(n))
    // Require SKU
    const sku = String(creator.data?.sku || '').trim()
    if (!sku) return alert('SKU is required')
    const res = await creator.create([
      'name', 'slug', 'sku', 'category',
      'short_description', 'long_description',
      'status',
      'base_price', 'discounted_price', 'currency',
      'stock_quantity', 'stock_status',
      'available_from', 'available_to',
    ])
    if (res.ok) { router.push(`/dashboard/${id}`); router.refresh() }
  }

  return (
    <main className="container">
      <div className="card">
        <h1>Create Product</h1>
        <form onSubmit={onSubmit} className="col gap-075">
          <label>
            <div>Name</div>
            <input
              value={creator.data?.name || ''}
              onChange={(e) => {
                const name = e.target.value
                creator.setField('name', name)
                if (!slugTouched) creator.setField('slug', toSlug(name))
              }}
              placeholder="Product name"
            />
          </label>
          <label>
            <div>Slug</div>
            <input
              value={creator.data?.slug || ''}
              onChange={(e) => { setSlugTouched(true); creator.setField('slug', toSlug(e.target.value)) }}
              placeholder="my-product"
            />
            <small>Appears in the URL. Leave empty to auto-generate from name.</small>
          </label>
          <div className="row gap-075">
            <label className="flex-1">
              <div>SKU</div>
              <input value={creator.data?.sku || ''} onChange={(e) => creator.setField('sku', e.target.value)} placeholder="SKU"
              />
            </label>
            <label className="flex-1">
              <div>Category</div>
              <input value={creator.data?.category || ''} onChange={(e) => creator.setField('category', e.target.value)} placeholder="Category"
              />
              <small className="text-muted">Enter a name; new categories are created for this shop.</small>
            </label>
          </div>
          <label>
            <div>Short Description</div>
            <input value={creator.data?.short_description || ''} onChange={(e) => creator.setField('short_description', e.target.value)} placeholder="Short summary" />
          </label>
          <label>
            <div>Long Description</div>
            <textarea rows={6} value={creator.data?.long_description || ''} onChange={(e) => creator.setField('long_description', e.target.value)} />
          </label>
          <div className="row gap-075">
            <label className="flex-1">
              <div>Status</div>
              <select value={creator.data?.status || 'active'} onChange={(e) => creator.setField('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="flex-1">
              <div>Stock Status</div>
              <select value={creator.data?.stock_status || 'in_stock'} onChange={(e) => creator.setField('stock_status', e.target.value)}>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </label>
          </div>
          <div className="row gap-075">
            <label className="flex-1">
              <div>Base Price</div>
              <input type="number" step="0.01" value={creator.data?.base_price ?? 0} onChange={(e) => creator.setField('base_price', e.target.value === '' ? '' : Number(e.target.value))} />
            </label>
            <label className="flex-1">
              <div>Discounted Price</div>
              <input type="number" step="0.01" value={creator.data?.discounted_price ?? ''} onChange={(e) => creator.setField('discounted_price', e.target.value === '' ? null : Number(e.target.value))} />
            </label>
            <label className="w-120">
              <div>Currency</div>
              <input value={creator.data?.currency || 'USD'} onChange={(e) => creator.setField('currency', e.target.value.toUpperCase())} />
            </label>
          </div>
          <div className="row gap-075">
            <label className="flex-1">
              <div>Stock Quantity</div>
              <input type="number" value={creator.data?.stock_quantity ?? 0} onChange={(e) => creator.setField('stock_quantity', Number(e.target.value))} />
            </label>
            <label className="flex-1">
              <div>Available From</div>
              <input type="date" value={creator.data?.available_from || ''} onChange={(e) => creator.setField('available_from', e.target.value || null)} />
            </label>
            <label className="flex-1">
              <div>Available To</div>
              <input type="date" value={creator.data?.available_to || ''} onChange={(e) => creator.setField('available_to', e.target.value || null)} />
            </label>
          </div>
          <div className="row gap-05">
            <button type="submit" disabled={creator.saving}>{creator.saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </main>
  )
}
