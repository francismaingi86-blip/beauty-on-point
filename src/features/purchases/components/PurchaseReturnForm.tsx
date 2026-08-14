import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Field, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { formatKes } from '@/lib/utils'
import { ProductSearchPicker } from '@/components/shared/ProductSearchPicker'
import type { Product, Supplier, PurchaseReturnItem } from '@/lib/db'
import type { CreatePurchaseReturnInput } from '../api/purchase-returns-api'

interface PurchaseReturnFormProps {
  suppliers: Supplier[]
  products: Product[]
  onSubmit: (input: CreatePurchaseReturnInput) => void
  onCancel: () => void
  isSaving?: boolean
}

export function PurchaseReturnForm({ suppliers, products, onSubmit, onCancel, isSaving }: PurchaseReturnFormProps) {
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseReturnItem[]>([])
  const [reason, setReason] = useState('')

  function addItem(product: Product) {
    if (items.some((i) => i.productId === product.id)) return
    setItems([
      ...items,
      { productId: product.id, name: product.name, quantity: 1, unitCost: product.buyingPrice, total: product.buyingPrice },
    ])
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity, total: quantity * i.unitCost } : i)))
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.total, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    const supplier = suppliers.find((s) => s.id === supplierId)
    onSubmit({ supplierId: supplierId || undefined, supplierName: supplier?.name, items, reason })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Supplier" required>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          required
          className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">Choose a supplier…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Items being returned</span>
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
                  onChange={(e) => updateQuantity(item.productId, e.target.value === '' ? 0 : Number(e.target.value) || 0)}
                  onBlur={(e) => {
                    if (!e.target.value || Number(e.target.value) < 1) updateQuantity(item.productId, 1)
                  }}
                  className="focus-ring w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-right"
                />
                <span className="w-20 text-right font-medium">{formatKes(item.total)}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.productId)}>
                  <Trash2 size={13} className="text-red-500" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-2 text-sm font-semibold">
              Return total: {formatKes(total)}
            </div>
          </div>
        )}
      </div>

      <Field label="Reason">
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. damaged on arrival, wrong items sent" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || items.length === 0 || !supplierId}>
          {isSaving ? 'Saving…' : 'Record return'}
        </Button>
      </div>
    </form>
  )
}
