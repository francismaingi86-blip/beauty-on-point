import { db } from './db'
import { supabase } from './supabase'

export interface StockDelta {
  productId: string
  delta: number
}

/**
 * Applies every stock change from one transaction (a sale, a purchase
 * receipt, a return, a credit note) in a single database round trip,
 * then reconciles each product's local stock with the database's true
 * resulting value — not the locally-guessed one — since other devices
 * may have changed it too.
 */
export async function pushStockDeltasBatch(deltas: StockDelta[]): Promise<void> {
  if (deltas.length === 0 || !navigator.onLine) return

  const { data, error } = await supabase.rpc('adjust_product_stock_batch', {
    items: deltas.map((d) => ({ id: d.productId, delta: d.delta })),
  })

  if (error || !data) return

  await Promise.all(
    (data as { id: string; new_stock: number }[]).map((row) =>
      db.products.update(row.id, { stock: row.new_stock, synced: true })
    )
  )
}
