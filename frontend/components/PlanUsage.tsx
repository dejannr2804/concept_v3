"use client"
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

function capFor(type?: string | null): number | null {
  if (!type || type === 'free') return 1
  if (type === 'paid') return 5
  if (type === 'enterprise') return null
  return null
}

function titleCase(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function PlanUsage({ currentCount, accountType }: { currentCount: number; accountType?: 'free' | 'paid' | 'enterprise' | string | null }) {
  const router = useRouter()
  const notify = useNotifications()
  const cap = capFor(accountType)
  const pct = cap ? Math.min(100, Math.round((currentCount / cap) * 100)) : 0

  return (
    <div className="plan-usage-card" aria-label="Plan usage">
      <div className="pu-topline">
        <div className="pu-left">
          <h3>Plan usage</h3>
          <span className={`pu-badge plan-${accountType || 'free'}`}>{titleCase(String(accountType || 'free'))}</span>
        </div>
        {accountType !== 'paid' && accountType !== 'enterprise' && (
          <button
            className="pu-upgradeBtn"
            onClick={() => {
              notify.info('Upgrade flow coming soon. Contact support or use admin to change plan.')
              try { router.push('/profile') } catch {}
            }}
          >
            Upgrade to Pro
          </button>
        )}
      </div>
      <div className="pu-content">
        {cap === null ? (
          <div className="pu-count">{currentCount} of ∞ shops used</div>
        ) : (
          <>
            <div className="pu-count">{currentCount} of {cap} shops used</div>
            <div className="pu-meter" role="progressbar" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={currentCount}>
              <div className="pu-meterFill" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )}
