import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, Receipt } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatKes } from '@/lib/utils'
import type { Expense } from '@/lib/db'
import { useExpenses, useSaveExpense, useDeleteExpense } from './hooks/useExpenses'
import { ExpenseForm } from './components/ExpenseForm'
import type { ExpenseFormValues } from './api/expenses-api'

export function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses()
  const saveExpense = useSaveExpense()
  const deleteExpense = useDeleteExpense()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const thisMonthTotal = useMemo(() => {
    const now = new Date()
    return expenses
      .filter((e) => {
        const d = new Date(e.incurredAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditing(expense)
    setDialogOpen(true)
  }

  function handleSubmit(values: ExpenseFormValues) {
    saveExpense.mutate({ values, id: editing?.id }, { onSuccess: () => setDialogOpen(false) })
  }

  function handleDelete(expense: Expense) {
    if (confirm(`Remove this ${expense.category} expense of ${formatKes(expense.amount)}?`)) {
      deleteExpense.mutate(expense.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {expenses.length} expense{expenses.length === 1 ? '' : 's'} recorded
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Record expense
        </Button>
      </div>

      <Card className="max-w-xs">
        <CardHeader>
          <CardTitle>This month</CardTitle>
        </CardHeader>
        <CardValue>{formatKes(thisMonthTotal)}</CardValue>
      </Card>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : expenses.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Receipt size={22} className="text-brand-pink-400" />
          <p className="font-medium">No expenses recorded yet</p>
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border-subtle)] p-0">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{e.category}</Badge>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(e.incurredAt).toLocaleDateString('en-KE')}
                  </p>
                </div>
                {e.note && <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{e.note}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold">{formatKes(e.amount)}</p>
                <Button variant="ghost" size="icon" onClick={() => openEdit(e)} aria-label="Edit expense">
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(e)} aria-label="Delete expense">
                  <Trash2 size={15} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit expense' : 'Record expense'}>
        <ExpenseForm
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSaving={saveExpense.isPending}
        />
      </Dialog>
    </div>
  )
}

export default ExpensesPage
