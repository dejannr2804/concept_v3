"use client"
import Link from 'next/link'
import { useResourceItem, useResourceList } from '@/hooks/resource'

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
}

export default function ProductsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const shop = useResourceItem<Shop>(`shops/${id}`)
  const products = useResourceList<Product>(`shops/${id}/products`)

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
        <ul>
          {products.data.map((p) => (
            <li key={p.id}>
              <p>
                <strong>{p.name}</strong>
              </p>
              <p>
                SKU: {p.sku}
                {p.category ? <> | Category: {p.category}</> : null}
                {' '}| Status: {p.status}
              </p>
              {(p.short_description || p.description) && (
                <p>{p.short_description || p.description}</p>
              )}
              <p>
                Price:{' '}
                {p.discounted_price != null && p.discounted_price !== undefined ? (
                  <>
                    <strong>
                      {(p.currency || 'USD')} {Number(p.discounted_price).toFixed(2)}
                    </strong>
                    {' '}({(p.currency || 'USD')} {Number(p.base_price || 0).toFixed(2)} original)
                  </>
                ) : (
                  <strong>
                    {(p.currency || 'USD')} {Number(p.base_price || 0).toFixed(2)}
                  </strong>
                )}
                {' '}| Stock: {p.stock_quantity ?? 0} ({p.stock_status === 'out_of_stock' ? 'Out of stock' : 'In stock'})
              </p>
              <p>
                {shop.data && (
                  <>
                    <Link href={`/shops/${shop.data.slug}/products/${p.slug}`}>View</Link>
                    {' '}
                  </>
                )}
                <Link href={`/dashboard/${id}/products/${p.id}`}>Manage</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
