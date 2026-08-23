import { db } from './db'
import { syncPendingProducts, refreshProductsFromServer } from '@/features/products/api/products-api'
import { syncPendingSales, refreshSalesFromServer } from '@/features/sales/api/sales-api'
import { syncPendingCustomers, refreshCustomersFromServer } from '@/features/customers/api/customers-api'
import { syncPendingSuppliers, refreshSuppliersFromServer } from '@/features/suppliers/api/suppliers-api'
import { syncPendingExpenses, refreshExpensesFromServer } from '@/features/expenses/api/expenses-api'
import { syncPendingPurchases, refreshPurchasesFromServer } from '@/features/purchases/api/purchases-api'
import { syncPendingPurchaseReturns, refreshPurchaseReturnsFromServer } from '@/features/purchases/api/purchase-returns-api'
import { syncPendingCreditNotes, refreshCreditNotesFromServer } from '@/features/credit-notes/api/credit-notes-api'
import { syncPendingStockTakes, refreshStockTakesFromServer } from '@/features/inventory/api/stock-takes-api'

/**
 * Pushes every unsynced local change, then pulls fresh server data —
 * across every module at once. This is the ONLY place sync happens; pages
 * just read from the local Dexie cache and rely on this running in the
 * background (on load, on reconnect, on app focus, and periodically) to
 * keep that cache current. Keeping this centralized — rather than every
 * page also syncing its own slice on mount — avoids doing the same work
 * twice at once and competing for bandwidth.
 */
export async function runFullSync(): Promise<void> {
  if (!navigator.onLine) return

  // Push first, then pull — so a just-synced local change is reflected
  // correctly rather than racing its own pull.
  await Promise.allSettled([
    syncPendingProducts(),
    syncPendingSales(),
    syncPendingCustomers(),
    syncPendingSuppliers(),
    syncPendingExpenses(),
    syncPendingPurchases(),
    syncPendingPurchaseReturns(),
    syncPendingCreditNotes(),
    syncPendingStockTakes(),
  ])

  await Promise.allSettled([
    refreshProductsFromServer(),
    refreshSalesFromServer(),
    refreshCustomersFromServer(),
    refreshSuppliersFromServer(),
    refreshExpensesFromServer(),
    refreshPurchasesFromServer(),
    refreshPurchaseReturnsFromServer(),
    refreshCreditNotesFromServer(),
    refreshStockTakesFromServer(),
  ])
}

/** Total number of records across every table still waiting to sync. */
export async function countPendingSync(): Promise<number> {
  const counts = await Promise.all([
    db.products.filter((r) => !r.synced).count(),
    db.sales.filter((r) => !r.synced).count(),
    db.customers.filter((r) => !r.synced).count(),
    db.suppliers.filter((r) => !r.synced).count(),
    db.expenses.filter((r) => !r.synced).count(),
    db.purchases.filter((r) => !r.synced).count(),
    db.purchaseReturns.filter((r) => !r.synced).count(),
    db.creditNotes.filter((r) => !r.synced).count(),
    db.stockTakes.filter((r) => !r.synced).count(),
  ])
  return counts.reduce((sum, c) => sum + c, 0)
}

/**
 * The oldest still-unsynced change's timestamp, across every table — used
 * to warn loudly if something has been sitting unsynced for a long time,
 * rather than leaving it silently pending until someone happens to notice.
 */
export async function getOldestPendingTimestamp(): Promise<number | null> {
  const arrays = await Promise.all([
    db.products.filter((r) => !r.synced).toArray(),
    db.sales.filter((r) => !r.synced).toArray(),
    db.customers.filter((r) => !r.synced).toArray(),
    db.suppliers.filter((r) => !r.synced).toArray(),
    db.expenses.filter((r) => !r.synced).toArray(),
    db.purchases.filter((r) => !r.synced).toArray(),
    db.purchaseReturns.filter((r) => !r.synced).toArray(),
    db.creditNotes.filter((r) => !r.synced).toArray(),
    db.stockTakes.filter((r) => !r.synced).toArray(),
  ])
  const timestamps = arrays.flat().map((r) => r.updatedAt)
  return timestamps.length > 0 ? Math.min(...timestamps) : null
}
