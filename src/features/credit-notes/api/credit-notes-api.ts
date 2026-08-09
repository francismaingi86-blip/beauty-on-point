import { db, type CreditNote, type CreditNoteItem } from '@/lib/db'
import { safeBulkPut } from '@/lib/safeBulkPut'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

type SupabaseCreditNoteRow = {
  id: string
  customer_id: string | null
  customer_name: string | null
  sale_id: string | null
  items: CreditNoteItem[]
  total: number
  reason: string | null
  staff_id: string | null
  staff_name: string | null
  created_at: string
  updated_at: string
}

function toSupabaseRow(c: CreditNote): Omit<SupabaseCreditNoteRow, 'updated_at'> {
  return {
    id: c.id,
    customer_id: c.customerId ?? null,
    customer_name: c.customerName ?? null,
    sale_id: c.saleId ?? null,
    items: c.items,
    total: c.total,
    reason: c.reason ?? null,
    staff_id: c.staffId ?? null,
    staff_name: c.staffName ?? null,
    created_at: new Date(c.createdAt).toISOString(),
  }
}

function fromSupabaseRow(row: SupabaseCreditNoteRow): CreditNote {
  return {
    id: row.id,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name ?? undefined,
    saleId: row.sale_id ?? undefined,
    items: row.items,
    total: row.total,
    reason: row.reason ?? undefined,
    staffId: row.staff_id ?? undefined,
    staffName: row.staff_name ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

export async function listCreditNotes(): Promise<CreditNote[]> {
  const all = await db.creditNotes.toArray()
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export interface CreateCreditNoteInput {
  customerId?: string
  customerName?: string
  items: CreditNoteItem[]
  reason?: string
}

/**
 * Records a credit note: returned items go back into stock, and if a
 * customer is attached, their outstanding balance is reduced by the note's
 * total (capped at zero — a credit note can't push a balance negative).
 */
export async function createCreditNote(input: CreateCreditNoteInput): Promise<CreditNote> {
  const total = input.items.reduce((sum, i) => sum + i.total, 0)
  const currentUser = useAuthStore.getState().user

  const creditNote: CreditNote = {
    id: crypto.randomUUID(),
    customerId: input.customerId,
    customerName: input.customerName,
    items: input.items,
    total,
    reason: input.reason,
    staffId: currentUser?.id,
    staffName: currentUser?.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }

  await db.transaction('rw', db.creditNotes, db.products, db.customers, async () => {
    await db.creditNotes.put(creditNote)

    for (const item of input.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue
      await db.products.update(item.productId, {
        stock: product.stock + item.quantity,
        updatedAt: Date.now(),
        synced: false,
      })
    }

    if (input.customerId) {
      const customer = await db.customers.get(input.customerId)
      if (customer) {
        await db.customers.update(input.customerId, {
          currentBalance: Math.max(customer.currentBalance - total, 0),
          updatedAt: Date.now(),
          synced: false,
        })
      }
    }
  })

  void pushCreditNoteAndSideEffects(creditNote)
  return creditNote
}

async function pushCreditNoteAndSideEffects(creditNote: CreditNote): Promise<void> {
  if (!navigator.onLine) return

  const { error } = await supabase.from('credit_notes').upsert(toSupabaseRow(creditNote))
  if (!error) await db.creditNotes.update(creditNote.id, { synced: true })

  for (const item of creditNote.items) {
    const product = await db.products.get(item.productId)
    if (!product) continue
    const { error: stockError } = await supabase.from('products').update({ stock: product.stock }).eq('id', item.productId)
    if (!stockError) await db.products.update(item.productId, { synced: true })
  }

  if (creditNote.customerId) {
    const customer = await db.customers.get(creditNote.customerId)
    if (customer) {
      const { error: custError } = await supabase
        .from('customers')
        .update({ current_balance: customer.currentBalance })
        .eq('id', creditNote.customerId)
      if (!custError) await db.customers.update(creditNote.customerId, { synced: true })
    }
  }
}

export async function syncPendingCreditNotes(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.creditNotes.filter((c) => !c.synced).toArray()
  await Promise.all(pending.map(pushCreditNoteAndSideEffects))
}

export async function refreshCreditNotesFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('credit_notes').select('*')
  if (error || !data) return
  await safeBulkPut(db.creditNotes, (data as SupabaseCreditNoteRow[]).map(fromSupabaseRow))
}
