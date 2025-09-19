"use client"

import LoaderStatus from '@/components/LoaderStatus'

const LOADER_DELAY_MS = 2000

export function DashboardLoadingPlaceholder() {
  return <LoaderStatus label="Loading dashboard content" delay={LOADER_DELAY_MS} />
}

export default DashboardLoadingPlaceholder
