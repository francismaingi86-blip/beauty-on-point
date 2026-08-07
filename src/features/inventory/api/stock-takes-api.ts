import { db, type StockTake, type StockTakeItem } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { applyPendingPriceIfDepleted } from '@/lib/pricing'

type SupabaseStockTakeRow = {
  id: string
  items: StockTakeItem[]
  status: StockTake['status']
  notes: string | null
  staff_id: string | null
  staff_name: string | null
  created_at: string
  updated_at: string
}

function toSupabaseRow(st: StockTake): Omit<SupabaseStockTakeRow, 'updated_at'> {
  return {
    id: st.id,
    items: st.items,
    status: st.status,
    notes: st.notes ?? null,
    staff_id: st.staffId ?? null,
    staff_name: st.staffName ?? null,
    created_at: new Date(st.createdAt).toISOString(),
  }
}

function fromSupabaseRow(row: SupabaseStockTakeRow): StockTake {
  return {
    id: row.id,
    items: row.items,
    status: row.status,
    notes: row.notes ?? undefined,
    staffId: row.staff_id ?? undefined,
    staffName: row.staff_name ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

export async function listStockTakes(): Promise<StockTake[]> {
  const all = await db.stockTakes.toArray()
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export interface SubmitStockTakeInput {
  items: StockTakeItem[]
  notes?: string
}

/**
 * Records a stock take and immediately applies each counted quantity as
 * the new system stock for that product — this IS the adjustment, there's
 * no separate approval step for a small single-shop operation.
 */
export async function submitStockTake(input: SubmitStockTakeInput): Promise<StockTake> {
  const currentUser = useAuthStore.getState().user

  const stockTake: StockTake = {
    id: crypto.randomUUID(),
    items: input.items,
    status: 'completed',
    notes: input.notes,
    staffId: currentUser?.id,
    staffName: currentUser?.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }

  await db.transaction('rw', db.stockTakes, db.products, async () => {
    await db.stockTakes.put(stockTake)
    for (const item of input.items) {
      await db.products.update(item.productId, {
        stock: item.countedStock,
        updatedAt: Date.now(),
        synced: false,
      })
    }
  })

  for (const item of input.items) {
    await applyPendingPriceIfDepleted(item.productId)
  }

  void pushStockTakeAndStock(stockTake)
  return stockTake
}

async function pushStockTakeAndStock(stockTake: StockTake): Promise<void> {
  if (!navigator.onLine) return

  const { error } = await supabase.from('stock_takes').upsert(toSupabaseRow(stockTake))
  if (!error) await db.stockTakes.update(stockTake.id, { synced: true })

  for (const item of stockTake.items) {
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: item.countedStock })
      .eq('id', item.productId)
    if (!stockError) await db.products.update(item.productId, { synced: true })
  }
}

export async function syncPendingStockTakes(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.stockTakes.filter((s) => !s.synced).toArray()
  await Promise.all(pending.map(pushStockTakeAndStock))
}

export async function refreshStockTakesFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('stock_takes').select('*')
  if (error || !data) return
  await db.stockTakes.bulkPut((data as SupabaseStockTakeRow[]).map(fromSupabaseRow))
}
