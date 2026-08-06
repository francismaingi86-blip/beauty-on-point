import { useMemo, useState } from 'react'
import { Search, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/field'
import type { Product } from '@/lib/db'
import { cn } from '@/lib/utils'

interface StockTakeSessionProps {
  products: Product[]
  onSubmit: (counts: Map<string, number>, notes: string) => void
  onCancel: () => void
  isSaving?: boolean
}

export function StockTakeSession({ products, onSubmit, onCancel, isSaving }: StockTakeSessionProps) {
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [notes, setNotes] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.barcode?.toLowerCase().includes(term)
    )
  }, [products, search])

  function setCount(productId: string, value: string) {
    const next = new Map(counts)
    if (value === '') {
      next.delete(productId)
    } else {
      next.set(productId, Math.max(0, Number(value) || 0))
    }
    setCounts(next)
  }

  const countedCount = counts.size
  const varianceCount = Array.from(counts.entries()).filter(([id, counted]) => {
    const product = products.find((p) => p.id === id)
    return product && counted !== product.stock
  }).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Stock take</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {countedCount} of {products.length} counted
            {varianceCount > 0 && <span className="text-brand-gold-600"> · {varianceCount} with a variance</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X size={15} /> Cancel
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product name, SKU, or barcode…"
          className="focus-ring w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] py-2 pl-9 pr-4 text-sm"
        />
      </div>

      <div className="card-surface divide-y divide-[var(--border-subtle)] p-0">
        {filtered.map((product) => {
          const counted = counts.get(product.id)
          const hasVariance = counted !== undefined && counted !== product.stock
          return (
            <div key={product.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {product.sku} · System stock: {product.stock}
                </p>
              </div>
              <input
                type="number"
                min={0}
                placeholder={String(product.stock)}
                value={counted ?? ''}
                onChange={(e) => setCount(product.id, e.target.value)}
                className={cn(
                  'focus-ring w-20 rounded-lg border bg-[var(--surface)] px-2 py-1.5 text-right text-sm',
                  hasVariance ? 'border-brand-gold-400' : 'border-[var(--border-subtle)]'
                )}
              />
              {hasVariance && (
                <span className={cn('w-12 text-right text-xs font-medium', counted! > product.stock ? 'text-emerald-600' : 'text-red-500')}>
                  {counted! > product.stock ? '+' : ''}
                  {counted! - product.stock}
                </span>
              )}
              {counted !== undefined && !hasVariance && <Check size={16} className="text-emerald-500" />}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--text-muted)]">No products match your search.</p>
        )}
      </div>

      {varianceCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-gold-50 p-3 text-sm dark:bg-brand-gold-500/10">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brand-gold-600" />
          <p>
            {varianceCount} product{varianceCount === 1 ? '' : 's'} will have their stock adjusted to match your count when you submit.
          </p>
        </div>
      )}

      <Field label="Notes (optional)">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. reason for shrinkage, who counted" />
      </Field>

      <div className="sticky bottom-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(counts, notes)} disabled={countedCount === 0 || isSaving}>
          {isSaving ? 'Submitting…' : `Submit stock take (${countedCount})`}
        </Button>
      </div>
    </div>
  )
}
