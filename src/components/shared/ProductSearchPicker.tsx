import { useMemo, useRef, useState } from 'react'
import { Search, Plus } from 'lucide-react'
import type { Product } from '@/lib/db'

interface ProductSearchPickerProps {
  products: Product[]
  excludeIds: string[]
  onSelect: (product: Product) => void
  placeholder?: string
}

/**
 * A search-as-you-type field for adding a product to a line-item list —
 * filters by name, SKU, or barcode as you type, and tapping a result adds
 * it immediately. Replaces a plain <select>, which becomes unusable once
 * a catalog has more than a handful of products.
 */
export function ProductSearchPicker({ products, excludeIds, onSelect, placeholder }: ProductSearchPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const available = products.filter((p) => !excludeIds.includes(p.id))
    const term = query.trim().toLowerCase()
    if (!term) return available.slice(0, 8)
    return available
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      )
      .slice(0, 8)
  }, [products, excludeIds, query])

  function handleSelect(product: Product) {
    onSelect(product)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? 'Search product name, SKU, or barcode…'}
          className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {open && (
        <div className="card-surface absolute z-20 mt-1 max-h-64 w-full overflow-y-auto p-1 shadow-[var(--shadow-glass)]">
          {results.length === 0 ? (
            <p className="p-3 text-center text-sm text-[var(--text-muted)]">No matching products.</p>
          ) : (
            results.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(product)}
                className="focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-pink-50 dark:hover:bg-white/5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    {product.sku}
                    {product.category ? ` · ${product.category}` : ''}
                  </span>
                </span>
                <Plus size={14} className="shrink-0 text-brand-pink-500" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
