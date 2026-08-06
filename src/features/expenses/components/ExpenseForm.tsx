import { useState } from 'react'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import type { Expense } from '@/lib/db'
import type { ExpenseFormValues } from '../api/expenses-api'

const COMMON_CATEGORIES = ['Rent', 'Utilities', 'Restock', 'Transport', 'Wages', 'Marketing', 'Other']

interface ExpenseFormProps {
  initialValues?: Expense
  onSubmit: (values: ExpenseFormValues) => void
  onCancel: () => void
  isSaving?: boolean
}

function toDateInputValue(timestamp?: number) {
  const date = timestamp ? new Date(timestamp) : new Date()
  return date.toISOString().slice(0, 10)
}

export function ExpenseForm({ initialValues, onSubmit, onCancel, isSaving }: ExpenseFormProps) {
  const [category, setCategory] = useState(initialValues?.category ?? COMMON_CATEGORIES[0])
  const [amount, setAmount] = useState(initialValues?.amount ?? 0)
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [incurredAt, setIncurredAt] = useState(toDateInputValue(initialValues?.incurredAt))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ category, amount, note, incurredAt })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="mb-1.5 block text-sm font-medium">Category</span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c
                  ? 'border-brand-pink-500 bg-brand-pink-500 text-white'
                  : 'border-[var(--border-subtle)] hover:bg-brand-pink-50 dark:hover:bg-white/5'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount (KES)" required>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            required
          />
        </Field>
        <Field label="Date" required>
          <Input type="date" value={incurredAt} onChange={(e) => setIncurredAt(e.target.value)} required />
        </Field>
      </div>

      <Field label="Note">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save expense'}
        </Button>
      </div>
    </form>
  )
}
