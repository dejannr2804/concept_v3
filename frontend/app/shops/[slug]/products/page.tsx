"use client"

import LoaderStatus from '@/components/LoaderStatus'
import { ShopProductGrid } from '@/components/shops/ProductGrid'
import { useShop } from '@/hooks/useShop'
import { useEffect } from 'react'

export default function ShopProductsPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { shop, loading, error } = useShop(slug)

  useEffect(() => {
    if (loading) {
      document.title = 'Loading products…'
      return
    }
    if (error) {
      document.title = 'Products – Error'
      return
    }
    if (shop) {
      document.title = `${shop.name} · Products`
    } else {
      document.title = 'Products'
    }
  }, [loading, error, shop])

  if (loading) return <LoaderStatus label="Loading products" delay={600} />

  if (error) {
    return (
      <main className="public-shop-page">
        <section className="public-shop-content">
          <p>{error}</p>
        </section>
      </main>
    )
  }

  if (!shop) {
    return (
      <main className="public-shop-page">
        <section className="public-shop-content">
          <p>Shop not found.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="public-shop-page public-shop-products">
      <section className="public-shop-products-content">
        <div className="public-shop-products-header">
          <h2>All products</h2>
        </div>
        <ShopProductGrid
          shopSlug={shop.slug}
          products={shop.products}
          infoMode="compact"
          currency={shop.currency}
        />
      </section>
    </main>
  )
}
