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

/** Marks a purchase received and adds its item quantities into product stock. */
export async function markPurchaseReceived(id: string): Promise<void> {
  const purchase = await db.purchases.get(id)
  if (!purchase) return

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
      await db.products.update(item.productId, {
        stock: product.stock + item.quantity,
        updatedAt: Date.now(),
        synced: false,
      })
    }
  })

  const updated = await db.purchases.get(id)
  if (updated) void pushPurchase(updated)

  if (navigator.onLine) {
    for (const item of purchase.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue
      const { error } = await supabase.from('products').update({ stock: product.stock }).eq('id', item.productId)
      if (!error) await db.products.update(item.productId, { synced: true })
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
