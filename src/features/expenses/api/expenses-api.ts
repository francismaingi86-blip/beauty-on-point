import { db, type Expense } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type SupabaseExpenseRow = {
  id: string
  category: string
  amount: number
  note: string | null
  receipt_url: string | null
  incurred_at: string
  updated_at: string
}

function toSupabaseRow(e: Expense): Omit<SupabaseExpenseRow, 'updated_at'> {
  return {
    id: e.id,
    category: e.category,
    amount: e.amount,
    note: e.note ?? null,
    receipt_url: e.receiptUrl ?? null,
    incurred_at: new Date(e.incurredAt).toISOString().slice(0, 10),
  }
}

function fromSupabaseRow(row: SupabaseExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    amount: row.amount,
    note: row.note ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    incurredAt: new Date(row.incurred_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

export async function listExpenses(): Promise<Expense[]> {
  const all = await db.expenses.toArray()
  return all.sort((a, b) => b.incurredAt - a.incurredAt)
}

export interface ExpenseFormValues {
  category: string
  amount: number
  note?: string
  incurredAt: string // yyyy-mm-dd
}

export async function saveExpense(values: ExpenseFormValues, existingId?: string): Promise<Expense> {
  const expense: Expense = {
    id: existingId ?? crypto.randomUUID(),
    category: values.category,
    amount: values.amount,
    note: values.note || undefined,
    incurredAt: new Date(values.incurredAt).getTime(),
    updatedAt: Date.now(),
    synced: false,
  }
  await db.expenses.put(expense)
  void pushExpense(expense)
  return expense
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id)
  if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id)
}

async function pushExpense(expense: Expense): Promise<void> {
  if (!navigator.onLine) return
  const { error } = await supabase.from('expenses').upsert(toSupabaseRow(expense))
  if (!error) await db.expenses.update(expense.id, { synced: true })
}

export async function syncPendingExpenses(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.expenses.filter((e) => !e.synced).toArray()
  await Promise.all(pending.map(pushExpense))
}

export async function refreshExpensesFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('expenses').select('*')
  if (error || !data) return
  await db.expenses.bulkPut((data as SupabaseExpenseRow[]).map(fromSupabaseRow))
}
