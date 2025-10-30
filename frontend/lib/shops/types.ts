export type ProductImage = {
  id: number
  url: string
  alt_text?: string | null
  sort_order: number
}

export type ProductVariantOption = {
  id: number
  name: string
  value?: string | null
  color_hex?: string | null
  sort_order: number
}

export type ProductVariantType = {
  id: number
  name: string
  input_type: 'text' | 'color'
  sort_order: number
  options: ProductVariantOption[]
}

export type Product = {
  id: number
  name: string
  slug: string
  description?: string | null
  base_price?: number | null
  discounted_price?: number | null
  currency?: string | null
  category?: string | null
  stock_status?: 'in_stock' | 'out_of_stock'
  stock_quantity?: number | null
  images?: ProductImage[]
  variant_types?: ProductVariantType[]
}

export type CategorySummary = {
  id: number
  name: string
  slug: string
}

export type Shop = {
  id: number
  name: string
  slug: string
  currency?: string | null
  heading?: string | null
  description?: string | null
  profile_image_url?: string | null
  cover_image_url?: string | null
  products: Product[]
  featured_categories?: CategorySummary[]
  contact_email?: string | null
  contact_phone?: string | null
  contact_website?: string | null
  contact_address?: string | null
}

export type ShopSummary = Pick<Shop, 'id' | 'name' | 'slug' | 'profile_image_url' | 'heading'>
