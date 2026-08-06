import { db, type Sale, type SaleItem } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

type SupabaseSaleRow = {
  id: string
  customer_id: string | null
  staff_id: string | null
  staff_name: string | null
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  payment_method: string
  status: string
  created_at: string
  updated_at: string
}

function toSupabaseRow(sale: Sale): Omit<SupabaseSaleRow, 'updated_at'> {
  return {
    id: sale.id,
    customer_id: sale.customerId ?? null,
    staff_id: sale.staffId ?? null,
    staff_name: sale.staffName ?? null,
    items: sale.items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    payment_method: sale.paymentMethod,
    status: sale.status,
    created_at: new Date(sale.createdAt).toISOString(),
  }
}

interface CompleteSaleInput {
  items: SaleItem[]
  discount: number
  paymentMethod: Sale['paymentMethod']
  customerId?: string
}

/**
 * Completes a sale: deducts stock from each product locally, records the
 * sale, and attempts to push both to Supabase. Works fully offline — stock
 * and sale both stay marked unsynced until the connection returns.
 */
export async function completeSale(input: CompleteSaleInput): Promise<Sale> {
  const subtotal = input.items.reduce((sum, i) => sum + i.total, 0)
  const total = Math.max(subtotal - input.discount, 0)
  const currentUser = useAuthStore.getState().user

  const sale: Sale = {
    id: crypto.randomUUID(),
    customerId: input.customerId,
    staffId: currentUser?.id,
    staffName: currentUser?.name,
    items: input.items,
    subtotal,
    discount: input.discount,
    total,
    paymentMethod: input.paymentMethod,
    status: 'completed',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }

  await db.transaction('rw', db.sales, db.products, async () => {
    await db.sales.put(sale)
    for (const item of input.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue
      await db.products.update(item.productId, {
        stock: Math.max(product.stock - item.quantity, 0),
        updatedAt: Date.now(),
        synced: false,
      })
    }
  })

  void pushSaleAndStock(sale)
  return sale
}

async function pushSaleAndStock(sale: Sale): Promise<void> {
  if (!navigator.onLine) return

  const { error } = await supabase.from('sales').upsert(toSupabaseRow(sale))
  if (!error) {
    await db.sales.update(sale.id, { synced: true })
  }

  for (const item of sale.items) {
    const product = await db.products.get(item.productId)
    if (!product) continue
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: product.stock })
      .eq('id', item.productId)
    if (!stockError) {
      await db.products.update(item.productId, { synced: true })
    }
  }
}

export async function listSales(): Promise<Sale[]> {
  const all = await db.sales.toArray()
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function listHeldSales(): Promise<Sale[]> {
  const held = await db.sales.where('status').equals('held').toArray()
  return held.sort((a, b) => b.createdAt - a.createdAt)
}

interface HoldSaleInput {
  items: SaleItem[]
  discount: number
  customerId?: string
}

/** Saves the current cart as a held sale (no stock deducted yet). */
export async function holdSale(input: HoldSaleInput): Promise<Sale> {
  const subtotal = input.items.reduce((sum, i) => sum + i.total, 0)
  const currentUser = useAuthStore.getState().user
  const sale: Sale = {
    id: crypto.randomUUID(),
    customerId: input.customerId,
    staffId: currentUser?.id,
    staffName: currentUser?.name,
    items: input.items,
    subtotal,
    discount: input.discount,
    total: Math.max(subtotal - input.discount, 0),
    paymentMethod: 'cash',
    status: 'held',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }
  await db.sales.put(sale)
  return sale
}

/** Removes a held sale — used once its items are back in the active cart. */
export async function deleteHeldSale(saleId: string): Promise<void> {
  await db.sales.delete(saleId)
}

export async function syncPendingSales(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.sales.filter((s) => !s.synced).toArray()
  await Promise.all(pending.map(pushSaleAndStock))
}

function fromSupabaseRow(row: SupabaseSaleRow): Sale {
  return {
    id: row.id,
    customerId: row.customer_id ?? undefined,
    staffId: row.staff_id ?? undefined,
    staffName: row.staff_name ?? undefined,
    items: row.items,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    paymentMethod: row.payment_method as Sale['paymentMethod'],
    status: row.status as Sale['status'],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

/**
 * Pulls completed sales from Supabase into the local cache — RLS on the
 * server ensures a cashier only ever receives their own sales here, while
 * admins/managers receive everyone's.
 */
export async function refreshSalesFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('sales').select('*').eq('status', 'completed')
  if (error || !data) return
  await db.sales.bulkPut((data as SupabaseSaleRow[]).map(fromSupabaseRow))
}
