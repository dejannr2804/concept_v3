"use client"
import Link from 'next/link'
import { useResourceItem, useResourceList } from '@/hooks/resource'
import { api } from '@/lib/api'

type Shop = { id: number; name: string; slug: string }
type Product = {
  id: number
  name: string
  slug: string
  sku: string
  category?: string | null
  status: 'active' | 'inactive'
  short_description?: string
  description?: string
  base_price?: number
  discounted_price?: number | null
  currency?: string
  stock_quantity?: number
  stock_status?: 'in_stock' | 'out_of_stock'
  images?: { id: number; url: string; alt_text?: string; sort_order: number }[]
}

export default function ProductsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const products = useResourceList<Product>(`shops/${id}/products`)
  async function toggleStatus(productId: number, current: Product['status']) {
    const next = current === 'active' ? 'inactive' : 'active'
    try {
      await api.patch(`shops/${id}/products/${productId}`, { status: next })
      products.notify.success('Status updated')
      products.refresh()
    } catch (e: any) {
      products.notify.error(e?.message || 'Failed to update status')
    }
  }

  return (
    <div className="products-page-container">
      <div className="top-line">
        <h1 className="heading">Products</h1>
        <div className="buttons">
          <Link href={`/dashboard/${id}/products/new`}>
            <img src="/img/plus-l.svg" alt="" className="nav-icon"/>
            <span>Create New Product</span>
          </Link>
          <Link href={`/dashboard/${id}/products/new`}>
            <img src="/img/arrow-narrow-up-right.svg" alt="" className="nav-icon"/>
            <span>Preview</span>
          </Link>
        </div>
      </div>

      {products.loading || !products.data ? (
        <p>Loading products...</p>
      ) : products.data.length === 0 ? (
        <div className="no-products-message">No products yet.</div>
      ) : (
          <>
            <div className="filters"></div>
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {products.data.map((p) => {
                  const img = (p.images || []).find((i) => i.sort_order === 1) || (p.images || [])[0]
                  return (
                      <tr key={p.id}>
                        <td className="product-image-cell">
                          {img ? (
                              <img className="product-thumb" src={img.url} alt={img.alt_text || p.name}/>
                          ) : (
                              <div className="product-thumb placeholder"/>
                          )}
                        </td>
                        <td className="product-name">
                          <strong>{p.name}</strong>
                        </td>
                        <td>{p.sku}</td>
                        <td>{p.category || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className={`toggle-switch ${p.status === 'active' ? 'on' : 'off'}`}
                        aria-pressed={p.status === 'active'}
                        aria-label={p.status === 'active' ? 'Set inactive' : 'Set active'}
                        onClick={() => toggleStatus(p.id, p.status)}
                      >
                        <span className="toggle-knob" />
                      </button>
                    </td>
                        <td>
                          <strong>
                            {(p.currency || 'USD')} {Number((p.discounted_price ?? p.base_price ?? 0)).toFixed(2)}
                          </strong>
                        </td>
                        <td className="actions">
                          {shop.data && (
                              <Link href={`/shops/${shop.data.slug}/products/${p.slug}`}>View</Link>
                          )}
                          <span> </span>
                          <Link href={`/dashboard/${id}/products/${p.id}`}>Manage</Link>
                        </td>
                      </tr>
                  )
                })}
                </tbody>
              </table>
            </div>
          </>
      )}
    </div>
  )
}
