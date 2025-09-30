"use client"

import Link from 'next/link'
import LoaderStatus from '@/components/LoaderStatus'
import { ShopProductGrid } from '@/components/shops/ProductGrid'
import { useShop } from '@/hooks/useShop'
import { useEffect } from 'react'

// Uses global styles from app/styles/shops.css

export default function PublicShopPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { shop, loading, error } = useShop(slug)

  useEffect(() => {
    if (loading) {
      document.title = 'Loading shop…'
      return
    }
    if (error) {
      document.title = 'Shop – Error'
      return
    }
    if (shop) {
      document.title = shop.name || 'Shop'
    } else {
      document.title = 'Shop not found'
    }
  }, [loading, error, shop])

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

  function pickRandom<T>(arr: T[], count: number): T[] {
    if (!arr || arr.length === 0) return []
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = copy[i]
      copy[i] = copy[j]
      copy[j] = tmp
    }
    return copy.slice(0, count)
  }

  // Determine featured categories: use configured ones if present, else fallback to first 3 distinct in products
  const configuredCategories = (shop as any).featured_categories as { id: number; name: string; slug: string }[] | undefined
  let categories: { id: number; name: string; slug: string }[] = configuredCategories && configuredCategories.length
    ? configuredCategories
    : Array.from(new Map(allProducts.filter(p => p.category).map(p => [p.category as string, { id: 0, name: p.category as string, slug: '' }])).values()).slice(0, 3)

  categories = categories.slice(0, 3)

  return (
      <main className="public-shop-page">
        <section
            className="public-shop-cover"
            style={shop.cover_image_url ? {backgroundImage: `url(${shop.cover_image_url})`} : undefined}
            aria-label="Cover"
        >
          <div className="public-shop-overlay"/>
          <div className="public-shop-coverContent">
            <h1 className="public-shop-heading">{heading}</h1>
          </div>
        </section>

        <section className="public-shop-description">
            <div className="icon">
                {/*<img src="/img/shopping-bag-02.svg" alt=""/>*/}
                <div className="underline"></div>
                <h3>About us</h3>
            </div>
            <p>{shop.description || 'No description available.'}</p>
        </section>

        <section className="public-shop-content">
          {/*<div className="public-shop-contentHeader">*/}
          {/*  <h2>Featured categories</h2>*/}
          {/*  <p>*/}
          {/*    Discover highlights across selected categories. Jump into the full collection to explore everything in {shop.name}.*/}
          {/*  </p>*/}
          {/*</div>*/}
          {categories.length === 0 ? (
              <ShopProductGrid
                  shopSlug={shop.slug}
                  products={[]}
                  infoMode="compact"
                  emptyMessage="No featured categories yet."
              />
          ) : null}

          {categories.map((cat) => {
            const inCategory = allProducts.filter(p => (p.category || '') === cat.name)
            const items = pickRandom(inCategory, 3)
            const hasMoreInCat = inCategory.length > items.length
            return (
                <div key={`${cat.id || cat.name}`} style={{marginBottom: 32}}>
                    <div className="category-name-cont">
                        <div className="underline"></div>
                        <span>{cat.name}</span>
                    </div>
                    <ShopProductGrid
                        shopSlug={shop.slug}
                      products={items}
                      infoMode="compact"
                      emptyMessage={`No products in ${cat.name} yet.`}
                  />
                  {hasMoreInCat ? (
                      <div className="public-shop-actions">
                        <Link href={`/shops/${shop.slug}/products`} className="public-shop-linkButton">
                          View all products
                        </Link>
                      </div>
                  ) : null}
                </div>
            )
          })}
        </section>
      <section className="public-shop-footer">

      </section>
      </main>
  )
}
