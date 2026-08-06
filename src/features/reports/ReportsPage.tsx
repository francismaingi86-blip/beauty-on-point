import { useMemo } from 'react'
import { TrendingUp, Wallet, Receipt as ReceiptIcon, ShoppingBag, Boxes, Truck, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatKes } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSales } from '@/features/sales/hooks/useSales'
import { useExpenses } from '@/features/expenses/hooks/useExpenses'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import { usePurchases } from '@/features/purchases/hooks/usePurchases'
import { usePurchaseReturns } from '@/features/purchases/hooks/usePurchaseReturns'
import { useCreditNotes } from '@/features/credit-notes/hooks/useCreditNotes'
import { computeStockValuation, computeProfitAndLoss } from '@/features/ai-insights/lib/analytics'
import type { Sale } from '@/lib/db'

function isSameDay(a: number, b: number) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return d1.toDateString() === d2.toDateString()
}

function isThisWeek(timestamp: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return timestamp >= start.getTime()
}

function isThisMonth(timestamp: number) {
  const now = new Date()
  const d = new Date(timestamp)
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function sumRevenue(sales: Sale[]) {
  return sales.reduce((sum, s) => sum + s.total, 0)
}

function sumProfit(sales: Sale[]) {
  return sales.reduce(
    (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + (i.unitPrice - i.unitCost) * i.quantity, 0) - s.discount,
    0
  )
}

export function ReportsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const canSeeFullReports = currentUser?.role === 'administrator' || currentUser?.role === 'manager'
  const { data: allSales = [], isLoading } = useSales()
  const { data: expenses = [] } = useExpenses()
  const { data: products = [] } = useProducts()
  const { data: suppliers = [] } = useSuppliers()
  const { data: customers = [] } = useCustomers()
  const { data: purchases = [] } = usePurchases()
  const { data: purchaseReturns = [] } = usePurchaseReturns()
  const { data: creditNotes = [] } = useCreditNotes()

  const completedSales = useMemo(() => allSales.filter((s) => s.status === 'completed'), [allSales])
  const now = Date.now()

  const todaySales = useMemo(() => completedSales.filter((s) => isSameDay(s.createdAt, now)), [completedSales, now])
  const weekSales = useMemo(() => completedSales.filter((s) => isThisWeek(s.createdAt)), [completedSales])
  const monthSales = useMemo(() => completedSales.filter((s) => isThisMonth(s.createdAt)), [completedSales])

  const todayExpenses = useMemo(
    () => expenses.filter((e) => isSameDay(e.incurredAt, now)).reduce((sum, e) => sum + e.amount, 0),
    [expenses, now]
  )
  const monthExpenses = useMemo(
    () => expenses.filter((e) => isThisMonth(e.incurredAt)).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  const topProducts = useMemo(() => {
    const totals = new Map<string, { name: string; qty: number }>()
    for (const sale of monthSales) {
      for (const item of sale.items) {
        const existing = totals.get(item.productId)
        totals.set(item.productId, { name: item.name, qty: (existing?.qty ?? 0) + item.quantity })
      }
    }
    return Array.from(totals.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [monthSales])

  if (isLoading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading…</p>
  }

  if (!canSeeFullReports) {
    // Cashiers/storekeepers: their own sales only — RLS on the server
    // already guarantees these are their own, this is just the display.
    const myTodayTotal = sumRevenue(todaySales)
    const myTodayCount = todaySales.length

    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">My Sales</h1>
          <p className="text-sm text-[var(--text-muted)]">Your own sales activity.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's sales</CardTitle>
              <ShoppingBag size={16} className="text-brand-pink-400" />
            </CardHeader>
            <CardValue>{formatKes(myTodayTotal)}</CardValue>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Transactions today</CardTitle>
              <ReceiptIcon size={16} className="text-brand-pink-400" />
            </CardHeader>
            <CardValue>{myTodayCount}</CardValue>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          {completedSales.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No sales recorded yet.</p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {completedSales.slice(0, 20).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{sale.items.length} item{sale.items.length === 1 ? '' : 's'}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sale.createdAt).toLocaleString('en-KE')}
                    </p>
                  </div>
                  <p className="font-semibold">{formatKes(sale.total)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    )
  }

  // Administrator / Manager: full reports including profit.
  const todayRevenue = sumRevenue(todaySales)
  const todayProfit = sumProfit(todaySales)
  const weekRevenue = sumRevenue(weekSales)
  const monthRevenue = sumRevenue(monthSales)
  const monthProfit = sumProfit(monthSales)
  const netProfitMonth = monthProfit - monthExpenses

  const daysAgo30 = Date.now() - 30 * 24 * 60 * 60 * 1000
  const monthPurchasesTotal = purchases
    .filter((p) => p.status === 'received' && (p.receivedAt ?? p.createdAt) >= daysAgo30)
    .reduce((sum, p) => sum + p.total, 0)
  const monthPurchaseReturnsTotal = purchaseReturns
    .filter((r) => r.createdAt >= daysAgo30)
    .reduce((sum, r) => sum + r.total, 0)
  const monthSalesReturnsTotal = creditNotes
    .filter((c) => c.createdAt >= daysAgo30)
    .reduce((sum, c) => sum + c.total, 0)

  const stockValuation = computeStockValuation(products)
  const profitAndLoss = computeProfitAndLoss({
    products,
    sales: allSales,
    expenses,
    purchasesTotal: monthPurchasesTotal,
    purchaseReturnsTotal: monthPurchaseReturnsTotal,
    salesReturnsTotal: monthSalesReturnsTotal,
    since: daysAgo30,
  })

  const outstandingSuppliers = suppliers.filter((s) => s.outstandingBalance > 0)
  const outstandingCustomers = customers.filter((c) => c.currentBalance > 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--text-muted)]">Sales, profit, and expenses across the shop.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's sales</CardTitle>
            <TrendingUp size={16} className="text-brand-pink-400" />
          </CardHeader>
          <CardValue>{formatKes(todayRevenue)}</CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today's profit</CardTitle>
            <Wallet size={16} className="text-brand-pink-400" />
          </CardHeader>
          <CardValue>{formatKes(todayProfit)}</CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today's expenses</CardTitle>
            <ReceiptIcon size={16} className="text-brand-pink-400" />
          </CardHeader>
          <CardValue>{formatKes(todayExpenses)}</CardValue>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This week's sales</CardTitle>
            <ShoppingBag size={16} className="text-brand-pink-400" />
          </CardHeader>
          <CardValue>{formatKes(weekRevenue)}</CardValue>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This month</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[var(--text-muted)]">Revenue</p>
              <p className="text-lg font-semibold">{formatKes(monthRevenue)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Gross profit</p>
              <p className="text-lg font-semibold">{formatKes(monthProfit)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Expenses</p>
              <p className="text-lg font-semibold">{formatKes(monthExpenses)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Net profit</p>
              <p className="text-lg font-semibold text-brand-pink-600">{formatKes(netProfitMonth)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products this month</CardTitle>
          </CardHeader>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No sales yet this month.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.name}</span>
                  <Badge variant="pink">{p.qty} sold</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit &amp; Loss — Last 30 days</CardTitle>
        </CardHeader>
        <div className="divide-y divide-[var(--border-subtle)] text-sm">
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Opening stock (at cost)</span>
            <span>{formatKes(profitAndLoss.openingStock)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">+ Purchases</span>
            <span>{formatKes(profitAndLoss.purchases)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">− Purchase returns</span>
            <span>{formatKes(profitAndLoss.purchaseReturns)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">− Closing stock (at cost)</span>
            <span>{formatKes(profitAndLoss.closingStock)}</span>
          </div>
          <div className="flex justify-between py-1.5 font-medium">
            <span>= Cost of goods sold</span>
            <span>{formatKes(profitAndLoss.cogs)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Sales</span>
            <span>{formatKes(profitAndLoss.salesRevenue)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">− Sales returns (credit notes)</span>
            <span>{formatKes(profitAndLoss.salesReturns)}</span>
          </div>
          <div className="flex justify-between py-1.5 font-medium">
            <span>= Gross profit</span>
            <span>{formatKes(profitAndLoss.grossProfit)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">− Expenses</span>
            <span>{formatKes(profitAndLoss.expenses)}</span>
          </div>
          <div className="flex justify-between py-2 text-base font-semibold text-brand-pink-600">
            <span>Net profit</span>
            <span>{formatKes(profitAndLoss.netProfit)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-xs text-[var(--text-muted)]">
            <span>Net margin</span>
            <span>{profitAndLoss.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Boxes size={14} /> Stock valuation
            </CardTitle>
          </CardHeader>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">At cost</span>
              <span className="font-medium">{formatKes(stockValuation.costValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">At retail</span>
              <span className="font-medium">{formatKes(stockValuation.retailValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Potential profit</span>
              <span className="font-medium text-emerald-600">{formatKes(stockValuation.potentialProfit)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Truck size={14} /> Owed to suppliers
            </CardTitle>
          </CardHeader>
          {outstandingSuppliers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing outstanding.</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              {outstandingSuppliers.slice(0, 5).map((s) => (
                <div key={s.id} className="flex justify-between">
                  <span className="truncate">{s.name}</span>
                  <span className="font-medium">{formatKes(s.outstandingBalance)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Users size={14} /> Owed by customers
            </CardTitle>
          </CardHeader>
          {outstandingCustomers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing outstanding.</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              {outstandingCustomers.slice(0, 5).map((c) => (
                <div key={c.id} className="flex justify-between">
                  <span className="truncate">{c.name}</span>
                  <span className="font-medium">{formatKes(c.currentBalance)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
        </CardHeader>
        {completedSales.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No sales recorded yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {completedSales.slice(0, 20).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">
                    {sale.items.length} item{sale.items.length === 1 ? '' : 's'}
                    {sale.staffName && <span className="text-[var(--text-muted)]"> · {sale.staffName}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(sale.createdAt).toLocaleString('en-KE')}
                  </p>
                </div>
                <p className="font-semibold">{formatKes(sale.total)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default ReportsPage
