import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Field, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { formatKes } from '@/lib/utils'
import type { Product, Customer, CreditNoteItem } from '@/lib/db'
import type { CreateCreditNoteInput } from '../api/credit-notes-api'

interface CreditNoteFormProps {
  customers: Customer[]
  products: Product[]
  onSubmit: (input: CreateCreditNoteInput) => void
  onCancel: () => void
  isSaving?: boolean
}

export function CreditNoteForm({ customers, products, onSubmit, onCancel, isSaving }: CreditNoteFormProps) {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<CreditNoteItem[]>([])
  const [reason, setReason] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')

  function addItem() {
    const product = products.find((p) => p.id === selectedProductId)
    if (!product || items.some((i) => i.productId === product.id)) return
    setItems([...items, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.sellingPrice, total: product.sellingPrice }])
    setSelectedProductId('')
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity, total: quantity * i.unitPrice } : i)))
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.total, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    const customer = customers.find((c) => c.id === customerId)
    onSubmit({ customerId: customerId || undefined, customerName: customer?.name, items, reason })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Customer (optional)">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="focus-ring w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">Walk-in / no customer on file</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Items being returned</span>
        <div className="flex gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="focus-ring flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <option value="">Choose a product…</option>
            {products
              .filter((p) => !items.some((i) => i.productId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <Button type="button" variant="outline" onClick={addItem} disabled={!selectedProductId}>
            <Plus size={15} />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{item.name}</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 1)}
                  className="focus-ring w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-right"
                />
                <span className="w-20 text-right font-medium">{formatKes(item.total)}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.productId)}>
                  <Trash2 size={13} className="text-red-500" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-2 text-sm font-semibold">
              Credit total: {formatKes(total)}
            </div>
          </div>
        )}
      </div>

      <Field label="Reason">
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong shade, defective, changed mind" />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || items.length === 0}>
          {isSaving ? 'Saving…' : 'Issue credit note'}
        </Button>
      </div>
    </form>
  )
}
