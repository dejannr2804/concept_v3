"use client"

import Link from 'next/link'
import LoaderStatus from '@/components/LoaderStatus'
import { ShopProductGrid } from '@/components/shops/ProductGrid'
import { useShop } from '@/hooks/useShop'

// Uses global styles from app/styles/shops.css

export default function PublicShopPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { shop, loading, error } = useShop(slug)

  if (loading) return <LoaderStatus label="Loading shop" delay={1000} />

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

  const heading = shop.heading || shop.name
  const allProducts = shop.products || []
  const featuredProducts = allProducts.slice(0, 3)
  const hasMoreProducts = allProducts.length > featuredProducts.length

  return (
    <main className="public-shop-page">
      <section
        className="public-shop-cover"
        style={shop.cover_image_url ? { backgroundImage: `url(${shop.cover_image_url})` } : undefined}
        aria-label="Cover"
      >
        <div className="public-shop-overlay" />
        <div className="public-shop-coverContent">
          <h1 className="public-shop-heading">{heading}</h1>
        </div>
      </section>

      <section className="public-shop-content">
        <div className="public-shop-contentHeader">
          <h2>Featured products</h2>
          <p>
            Explore a curated snapshot of what {shop.name} has to offer. Head to the full collection to
            browse every item in stock.
          </p>
        </div>
        <ShopProductGrid
          shopSlug={shop.slug}
          products={featuredProducts}
          emptyMessage="Products will appear here soon."
        />
        {hasMoreProducts ? (
          <div className="public-shop-actions">
            <Link href={`/shops/${shop.slug}/products`} className="public-shop-linkButton">
              View all products
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
