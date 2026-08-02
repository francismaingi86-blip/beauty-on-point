import { cn } from '@/lib/utils'

interface FreshnessBarProps {
  stock: number
  minimumStock: number
  maximumStock?: number
  expiryDate?: string
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * A compact horizontal bar showing stock level health (and expiry proximity
 * when known), color-coded from red (critical) through gold (watch) to
 * green (healthy) — the same "freshness bar" pattern used across Francis's
 * pharmacy POS projects.
 */
export function FreshnessBar({ stock, minimumStock, maximumStock, expiryDate }: FreshnessBarProps) {
  const ceiling = maximumStock ?? Math.max(minimumStock * 3, 1)
  const ratio = ceiling > 0 ? Math.min(stock / ceiling, 1) : 0
  const days = daysUntil(expiryDate)

  let tone: 'danger' | 'gold' | 'success' = 'success'
  if (stock <= 0) tone = 'danger'
  else if (stock <= minimumStock) tone = 'gold'
  if (days !== null && days <= 30) tone = days <= 7 ? 'danger' : 'gold'

  const barColor =
    tone === 'danger' ? 'bg-red-500' : tone === 'gold' ? 'bg-brand-gold-400' : 'bg-emerald-500'

  const label =
    stock <= 0
      ? 'Out of stock'
      : days !== null && days <= 30
        ? `Expires in ${days}d`
        : stock <= minimumStock
          ? 'Low stock'
          : 'Healthy'

  return (
    <div className="w-28">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-black-100 dark:bg-white/10">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.max(ratio * 100, stock > 0 ? 6 : 0)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{label}</p>
    </div>
  )
}
