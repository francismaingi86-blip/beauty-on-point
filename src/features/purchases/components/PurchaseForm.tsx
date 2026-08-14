import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Field, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { formatKes } from '@/lib/utils'
import { ProductSearchPicker } from '@/components/shared/ProductSearchPicker'
import type { Purchase, PurchaseItem, Product } from '@/lib/db'
import type { Supplier } from '@/lib/db'
import type { PurchaseFormValues } from '../api/purchases-api'

interface PurchaseFormProps {
  suppliers: Supplier[]
  products: Product[]
  initialValues?: Purchase
  onSubmit: (values: PurchaseFormValues) => void
  onCancel: () => void
  isSaving?: boolean
}

export function PurchaseForm({ suppliers, products, initialValues, onSubmit, onCancel, isSaving }: PurchaseFormProps) {
  const [supplierId, setSupplierId] = useState(initialValues?.supplierId ?? '')
  const [items, setItems] = useState<PurchaseItem[]>(initialValues?.items ?? [])
  const [notes, setNotes] = useState(initialValues?.notes ?? '')

  function addItem(product: Product) {
    if (items.some((i) => i.productId === product.id)) return
    setItems([
      ...items,
      { productId: product.id, name: product.name, quantity: 1, unitCost: product.buyingPrice, total: product.buyingPrice },
    ])
  }

  function updateItem(productId: string, field: 'quantity' | 'unitCost', value: number) {
    setItems(
      items.map((i) =>
        i.productId === productId
          ? { ...i, [field]: value, total: field === 'quantity' ? value * i.unitCost : i.quantity * value }
          : i
      )
    )
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.total, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    const supplier = suppliers.find((s) => s.id === supplierId)
    onSubmit({ supplierId: supplierId || undefined, supplierName: supplier?.name, items, notes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Supplier">
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">No supplier selected</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Items</span>
        <ProductSearchPicker
          products={products}
          excludeIds={items.map((i) => i.productId)}
          onSelect={addItem}
          placeholder="Search a product to add…"
        />

        {items.length > 0 && (
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{item.name}</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.productId, 'quantity', e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                  onBlur={(e) => {
                    if (!e.target.value || Number(e.target.value) < 1) updateItem(item.productId, 'quantity', 1)
                  }}
                  className="focus-ring w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-right"
                />
                <span className="text-[var(--text-muted)]">×</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitCost}
                  onChange={(e) => updateItem(item.productId, 'unitCost', Number(e.target.value) || 0)}
                  className="focus-ring w-24 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-right"
                />
                <span className="w-20 text-right font-medium">{formatKes(item.total)}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.productId)}>
                  <Trash2 size={13} className="text-red-500" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-2 text-sm font-semibold">
              Total: {formatKes(total)}
            </div>
          </div>
        )}
      </div>

      <Field label="Notes">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || items.length === 0}>
          {isSaving ? 'Saving…' : 'Save purchase'}
        </Button>
      </div>
    </form>
  )
}
