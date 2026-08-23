import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { refreshProductsFromServer } from '@/features/products/api/products-api'
import { refreshSalesFromServer } from '@/features/sales/api/sales-api'
import { refreshCustomersFromServer } from '@/features/customers/api/customers-api'
import { refreshSuppliersFromServer } from '@/features/suppliers/api/suppliers-api'
import { refreshExpensesFromServer } from '@/features/expenses/api/expenses-api'
import { refreshPurchasesFromServer } from '@/features/purchases/api/purchases-api'
import { refreshPurchaseReturnsFromServer } from '@/features/purchases/api/purchase-returns-api'
import { refreshCreditNotesFromServer } from '@/features/credit-notes/api/credit-notes-api'
import { refreshStockTakesFromServer } from '@/features/inventory/api/stock-takes-api'

interface TableSync {
  table: string
  refresh: () => Promise<void>
  queryKey: string[]
}

const TABLES: TableSync[] = [
  { table: 'products', refresh: refreshProductsFromServer, queryKey: ['products'] },
  { table: 'sales', refresh: refreshSalesFromServer, queryKey: ['sales'] },
  { table: 'customers', refresh: refreshCustomersFromServer, queryKey: ['customers'] },
  { table: 'suppliers', refresh: refreshSuppliersFromServer, queryKey: ['suppliers'] },
  { table: 'expenses', refresh: refreshExpensesFromServer, queryKey: ['expenses'] },
  { table: 'purchases', refresh: refreshPurchasesFromServer, queryKey: ['purchases'] },
  { table: 'purchase_returns', refresh: refreshPurchaseReturnsFromServer, queryKey: ['purchase-returns'] },
  { table: 'credit_notes', refresh: refreshCreditNotesFromServer, queryKey: ['credit-notes'] },
  { table: 'stock_takes', refresh: refreshStockTakesFromServer, queryKey: ['stock-takes'] },
]

const DEBOUNCE_MS = 800

/**
 * Subscribes to live database changes (Supabase Realtime) so an edit made
 * on one device shows up on every other open device within about a
 * second, instead of waiting for the next periodic sync or for someone
 * to background and reopen the app. Debounced per table so a burst of
 * many changes at once (a bulk import, a big sale) triggers one refresh,
 * not one per row.
 *
 * Relies on Supabase's documented default behavior that postgres_changes
 * subscriptions respect each table's row-level security — a cashier's
 * realtime feed for `sales`, for instance, is filtered the same way a
 * direct query would be, not a way to bypass the visibility rules
 * already enforced everywhere else in the app.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    let channel = supabase.channel('db-changes')
    for (const { table, refresh, queryKey } of TABLES) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        const existing = timers.get(table)
        if (existing) clearTimeout(existing)
        timers.set(
          table,
          setTimeout(() => {
            refresh().then(() => queryClient.invalidateQueries({ queryKey }))
          }, DEBOUNCE_MS)
        )
      })
    }
    channel.subscribe()

    return () => {
      timers.forEach((t) => clearTimeout(t))
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
