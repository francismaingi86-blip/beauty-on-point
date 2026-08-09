import { db } from './db'
import { syncPendingProducts, refreshProductsFromServer } from '@/features/products/api/products-api'
import { syncPendingSales, refreshSalesFromServer } from '@/features/sales/api/sales-api'
import { syncPendingCustomers, refreshCustomersFromServer } from '@/features/customers/api/customers-api'
import { syncPendingSuppliers, refreshSuppliersFromServer } from '@/features/suppliers/api/suppliers-api'
import { syncPendingExpenses, refreshExpensesFromServer } from '@/features/expenses/api/expenses-api'
import { syncPendingPurchases } from '@/features/purchases/api/purchases-api'
import { syncPendingPurchaseReturns, refreshPurchaseReturnsFromServer } from '@/features/purchases/api/purchase-returns-api'
import { syncPendingCreditNotes, refreshCreditNotesFromServer } from '@/features/credit-notes/api/credit-notes-api'
import { syncPendingStockTakes, refreshStockTakesFromServer } from '@/features/inventory/api/stock-takes-api'

/**
 * Pushes every unsynced local change, then pulls fresh server data —
 * across every module at once. Individual pages still sync their own
 * domain when they mount, but this runs everything together on the
 * triggers below so nothing is ever more than a minute or two stale,
 * even for data belonging to a page the person hasn't opened.
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
