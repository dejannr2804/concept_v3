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

export type ProductVariantSelection = {
  variant_type_id: number
  variant_type_name: string
  variant_option_id: number
  variant_option_name: string
}

export type ProductInventoryItem = {
  id: number
  sku?: string | null
  stock_quantity: number
  is_active?: boolean
  is_default?: boolean
  is_available?: boolean
  price?: string | null
  price_override?: string | null
  currency?: string | null
  option_label?: string | null
  options: ProductVariantSelection[]
}

export type Product = {
  id: number
  name: string
  slug: string
  sku?: string | null
  description?: string | null
  base_price?: number | null
  discounted_price?: number | null
  currency?: string | null
  category?: string | null
  stock_status?: 'in_stock' | 'limited' | 'out_of_stock'
  stock_quantity?: number | null
  status?: 'active' | 'inactive'
  images?: ProductImage[]
  variant_types?: ProductVariantType[]
  inventory_items?: ProductInventoryItem[]
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

export type CartItemImage = {
  id: number
  url: string
  alt_text?: string | null
}

export type CartItem = {
  id: number
  product_id: number
  product_slug: string
  product_name: string
  sku?: string | null
  quantity: number
  unit_price: string
  subtotal_amount: string
  currency: string
  option_label?: string | null
  options: ProductVariantSelection[]
  product_image?: CartItemImage | null
  inventory_item_id?: number | null
}

export type Cart = {
  token: string
  status: 'active' | 'converted' | 'abandoned'
  shop_slug: string
  currency: string
  subtotal_amount: string
  total_items: number
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  shipping_address?: Record<string, any> | null
  items: CartItem[]
}

export type OrderItem = {
  id: number
  product_name: string
  product_slug: string
  sku?: string | null
  quantity: number
  unit_price: string
  subtotal_amount: string
  currency: string
  option_label?: string | null
  options: ProductVariantSelection[]
  product_image?: CartItemImage | null
  inventory_item_id?: number | null
}

export type Order = {
  id: number
  order_number: string
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded'
  currency: string
  subtotal_amount: string
  discount_amount?: string | null
  tax_amount?: string | null
  shipping_amount?: string | null
  total_amount: string
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  notes?: string | null
  shipping_address?: Record<string, any> | null
  billing_address?: Record<string, any> | null
  placed_at: string
  items?: OrderItem[]
}
