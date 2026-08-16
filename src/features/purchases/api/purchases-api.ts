import { db, type Purchase, type PurchaseItem } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type SupabasePurchaseRow = {
  id: string
  supplier_id: string | null
  items: PurchaseItem[]
  total: number
  status: Purchase['status']
  notes: string | null
  ordered_at: string | null
  received_at: string | null
  created_at: string
  updated_at: string
}

function toSupabaseRow(p: Purchase): Omit<SupabasePurchaseRow, 'updated_at'> {
  return {
    id: p.id,
    supplier_id: p.supplierId ?? null,
    items: p.items,
    total: p.total,
    status: p.status,
    notes: p.notes ?? null,
    ordered_at: p.orderedAt ? new Date(p.orderedAt).toISOString() : null,
    received_at: p.receivedAt ? new Date(p.receivedAt).toISOString() : null,
    created_at: new Date(p.createdAt).toISOString(),
  }
}

export async function listPurchases(): Promise<Purchase[]> {
  const all = await db.purchases.toArray()
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export interface PurchaseFormValues {
  supplierId?: string
  supplierName?: string
  items: PurchaseItem[]
  notes?: string
}

export async function savePurchase(values: PurchaseFormValues, existingId?: string): Promise<Purchase> {
  const total = values.items.reduce((sum, i) => sum + i.total, 0)
  const existing = existingId ? await db.purchases.get(existingId) : undefined

  const purchase: Purchase = {
    id: existingId ?? crypto.randomUUID(),
    supplierId: values.supplierId,
    supplierName: values.supplierName,
    items: values.items,
    total,
    status: existing?.status ?? 'draft',
    notes: values.notes,
    orderedAt: existing?.orderedAt,
    receivedAt: existing?.receivedAt,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }
  await db.purchases.put(purchase)
  void pushPurchase(purchase)
  return purchase
}

export async function markPurchaseOrdered(id: string): Promise<void> {
  await db.purchases.update(id, { status: 'ordered', orderedAt: Date.now(), updatedAt: Date.now(), synced: false })
  const purchase = await db.purchases.get(id)
  if (purchase) void pushPurchase(purchase)
}

/**
 * Marks a purchase received and adds its item quantities into product
 * stock. If an item's cost differs from the product's current buying
 * price:
 *  - if stock was already at zero, the new price applies immediately
 *  - otherwise, the new price is queued and takes effect automatically
 *    once the remaining (old-priced) stock sells out
 */
export async function markPurchaseReceived(id: string): Promise<void> {
  const purchase = await db.purchases.get(id)
  if (!purchase) return
  // Idempotency guard: if this purchase was already received, do nothing.
  // Without this, a double-tap on "Receive" (or any retry) would add the
  // same stock quantities into inventory a second time.
  if (purchase.status === 'received') return

  await db.transaction('rw', db.purchases, db.products, async () => {
    await db.purchases.update(id, {
      status: 'received',
      receivedAt: Date.now(),
      updatedAt: Date.now(),
      synced: false,
    })
    for (const item of purchase.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue

      const costChanged = Math.abs(item.unitCost - product.buyingPrice) > 0.001
      const hadStockBefore = product.stock > 0

      if (costChanged && hadStockBefore) {
        // Preserve the existing margin to suggest a matching new selling
        // price for the queued batch.
        const suggestedSellingPrice =
          product.buyingPrice > 0
            ? Math.round(item.unitCost * (product.sellingPrice / product.buyingPrice) * 100) / 100
            : product.sellingPrice

        await db.products.update(item.productId, {
          stock: product.stock + item.quantity,
          pendingBuyingPrice: item.unitCost,
          pendingSellingPrice: suggestedSellingPrice,
          updatedAt: Date.now(),
          synced: false,
        })
      } else if (costChanged) {
        // No old stock left to protect — the new price is just the price now.
        await db.products.update(item.productId, {
          stock: product.stock + item.quantity,
          buyingPrice: item.unitCost,
          pendingBuyingPrice: undefined,
          pendingSellingPrice: undefined,
          updatedAt: Date.now(),
          synced: false,
        })
      } else {
        await db.products.update(item.productId, {
          stock: product.stock + item.quantity,
          updatedAt: Date.now(),
          synced: false,
        })
      }
    }
  })

  const updated = await db.purchases.get(id)
  if (updated) void pushPurchase(updated)

  if (navigator.onLine) {
    for (const item of purchase.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue

      const { data: newStock, error: stockError } = await supabase.rpc('adjust_product_stock', {
        p_id: item.productId,
        delta: item.quantity,
      })

      // Price fields are pushed separately from stock so this update can
      // never clobber the atomic stock adjustment above with a stale
      // locally-computed number.
      const { error: priceError } = await supabase
        .from('products')
        .update({
          buying_price: product.buyingPrice,
          selling_price: product.sellingPrice,
          pending_buying_price: product.pendingBuyingPrice ?? null,
          pending_selling_price: product.pendingSellingPrice ?? null,
        })
        .eq('id', item.productId)

      if (!stockError && !priceError) {
        const updates: Partial<typeof product> = { synced: true }
        if (typeof newStock === 'number') updates.stock = newStock
        await db.products.update(item.productId, updates)
      }
    }
  }
}

export async function deletePurchase(id: string): Promise<void> {
  await db.purchases.delete(id)
  if (navigator.onLine) await supabase.from('purchases').delete().eq('id', id)
}

async function pushPurchase(purchase: Purchase): Promise<void> {
  if (!navigator.onLine) return
  const { error } = await supabase.from('purchases').upsert(toSupabaseRow(purchase))
  if (!error) await db.purchases.update(purchase.id, { synced: true })
}

export async function syncPendingPurchases(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.purchases.filter((p) => !p.synced).toArray()
  await Promise.all(pending.map(pushPurchase))
}
