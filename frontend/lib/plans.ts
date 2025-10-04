export type PlanFeatures = {
  maxShops: number | null
  maxProductsPerShop: number | null
}

const PLANS: Record<string, PlanFeatures> = {
  free: { maxShops: 1, maxProductsPerShop: 20 },
  pro: { maxShops: 5, maxProductsPerShop: 100 },
  enterprise: { maxShops: null, maxProductsPerShop: null },
}

export function getPlanFeatures(accountType?: string | null): PlanFeatures {
  if (!accountType) return PLANS.free
  return PLANS[accountType] || { maxShops: null, maxProductsPerShop: null }
}

