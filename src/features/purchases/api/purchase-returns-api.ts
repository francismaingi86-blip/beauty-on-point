import { db, type PurchaseReturn, type PurchaseReturnItem } from '@/lib/db'
import { safeBulkPut } from '@/lib/safeBulkPut'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { applyPendingPriceIfDepleted } from '@/lib/pricing'

type SupabasePurchaseReturnRow = {
  id: string
  supplier_id: string | null
  supplier_name: string | null
  purchase_id: string | null
  items: PurchaseReturnItem[]
  total: number
  reason: string | null
  staff_id: string | null
  staff_name: string | null
  created_at: string
  updated_at: string
}

function toSupabaseRow(r: PurchaseReturn): Omit<SupabasePurchaseReturnRow, 'updated_at'> {
  return {
    id: r.id,
    supplier_id: r.supplierId ?? null,
    supplier_name: r.supplierName ?? null,
    purchase_id: r.purchaseId ?? null,
    items: r.items,
    total: r.total,
    reason: r.reason ?? null,
    staff_id: r.staffId ?? null,
    staff_name: r.staffName ?? null,
    created_at: new Date(r.createdAt).toISOString(),
  }
}

function fromSupabaseRow(row: SupabasePurchaseReturnRow): PurchaseReturn {
  return {
    id: row.id,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    purchaseId: row.purchase_id ?? undefined,
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

export async function listPurchaseReturns(): Promise<PurchaseReturn[]> {
  const all = await db.purchaseReturns.toArray()
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export interface CreatePurchaseReturnInput {
  supplierId?: string
  supplierName?: string
  purchaseId?: string
  items: PurchaseReturnItem[]
  reason?: string
}

/**
 * Records stock sent back to a supplier: reduces product stock and
 * reduces that supplier's outstanding balance (capped at zero).
 */
export async function createPurchaseReturn(input: CreatePurchaseReturnInput): Promise<PurchaseReturn> {
  const total = input.items.reduce((sum, i) => sum + i.total, 0)
  const currentUser = useAuthStore.getState().user

  const purchaseReturn: PurchaseReturn = {
    id: crypto.randomUUID(),
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    purchaseId: input.purchaseId,
    items: input.items,
    total,
    reason: input.reason,
    staffId: currentUser?.id,
    staffName: currentUser?.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false,
  }

  await db.transaction('rw', db.purchaseReturns, db.products, db.suppliers, async () => {
    await db.purchaseReturns.put(purchaseReturn)

    for (const item of input.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue
      await db.products.update(item.productId, {
        stock: Math.max(product.stock - item.quantity, 0),
        updatedAt: Date.now(),
        synced: false,
      })
    }

    if (input.supplierId) {
      const supplier = await db.suppliers.get(input.supplierId)
      if (supplier) {
        await db.suppliers.update(input.supplierId, {
          outstandingBalance: Math.max(supplier.outstandingBalance - total, 0),
          updatedAt: Date.now(),
          synced: false,
        })
      }
    }
  })

  for (const item of input.items) {
    await applyPendingPriceIfDepleted(item.productId)
  }

  void pushPurchaseReturnAndSideEffects(purchaseReturn)
  return purchaseReturn
}

async function pushPurchaseReturnAndSideEffects(purchaseReturn: PurchaseReturn): Promise<void> {
  if (!navigator.onLine) return

  const { error } = await supabase.from('purchase_returns').upsert(toSupabaseRow(purchaseReturn))
  if (!error) await db.purchaseReturns.update(purchaseReturn.id, { synced: true })

  for (const item of purchaseReturn.items) {
    const product = await db.products.get(item.productId)
    if (!product) continue
    const { error: stockError } = await supabase.from('products').update({ stock: product.stock }).eq('id', item.productId)
    if (!stockError) await db.products.update(item.productId, { synced: true })
  }

  if (purchaseReturn.supplierId) {
    const supplier = await db.suppliers.get(purchaseReturn.supplierId)
    if (supplier) {
      const { error: supError } = await supabase
        .from('suppliers')
        .update({ outstanding_balance: supplier.outstandingBalance })
        .eq('id', purchaseReturn.supplierId)
      if (!supError) await db.suppliers.update(purchaseReturn.supplierId, { synced: true })
    }
  }
}

export async function syncPendingPurchaseReturns(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.purchaseReturns.filter((r) => !r.synced).toArray()
  await Promise.all(pending.map(pushPurchaseReturnAndSideEffects))
}

export async function refreshPurchaseReturnsFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('purchase_returns').select('*')
  if (error || !data) return
  await safeBulkPut(db.purchaseReturns, (data as SupabasePurchaseReturnRow[]).map(fromSupabaseRow))
}
