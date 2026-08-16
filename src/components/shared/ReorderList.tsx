import { PackageX, AlertTriangle } from 'lucide-react'
import type { ReorderSuggestion } from '@/features/ai-insights/lib/analytics'

interface ReorderListProps {
  items: ReorderSuggestion[]
  limit?: number
}

export function ReorderList({ items, limit }: ReorderListProps) {
  const shown = limit ? items.slice(0, limit) : items
  const remaining = limit ? items.length - shown.length : 0

  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Nothing needs reordering right now.</p>
  }

  return (
    <div className="space-y-2">
      {shown.map(({ product, suggestedQuantity, urgent }) => (
        <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            {urgent ? (
              <PackageX size={14} className="shrink-0 text-red-500" />
            ) : (
              <AlertTriangle size={14} className="shrink-0 text-brand-gold-500" />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium">{product.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {product.stock} in stock
                {product.sku ? ` · ${product.sku}` : ''}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-xs font-semibold text-brand-pink-600">Order {suggestedQuantity}</p>
        </div>
      ))}
      {remaining > 0 && <p className="pt-1 text-xs text-[var(--text-muted)]">+{remaining} more</p>}
    </div>
  )
}
