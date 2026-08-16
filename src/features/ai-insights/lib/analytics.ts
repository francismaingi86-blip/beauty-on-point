import type { Product, Sale, Expense, Customer } from '@/lib/db'

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function isCompleted(sale: Sale): boolean {
  return sale.status === 'completed'
}

// ---------- Core stats ----------

export interface PeriodStats {
  revenue: number
  profit: number
  transactionCount: number
}

function statsSince(sales: Sale[], since: number): PeriodStats {
  const inRange = sales.filter((s) => isCompleted(s) && s.createdAt >= since)
  const revenue = inRange.reduce((sum, s) => sum + s.total, 0)
  const profit = inRange.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + (i.unitPrice - i.unitCost) * i.quantity, 0) - s.discount,
    0
  )
  return { revenue, profit, transactionCount: inRange.length }
}

export function computeDashboardStats(sales: Sale[], expenses: Expense[]) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const today = statsSince(sales, startOfToday.getTime())
  const week = statsSince(sales, daysAgo(7))
  const month = statsSince(sales, daysAgo(30))

  const todayExpenses = expenses
    .filter((e) => e.incurredAt >= startOfToday.getTime())
    .reduce((sum, e) => sum + e.amount, 0)
  const monthExpenses = expenses.filter((e) => e.incurredAt >= daysAgo(30)).reduce((sum, e) => sum + e.amount, 0)

  // Rough cash-in-hand: cash-method sales minus today's expenses. Not a
  // substitute for a real cash drawer count, just a directional figure.
  const todayCashSales = sales
    .filter((s) => isCompleted(s) && s.createdAt >= startOfToday.getTime() && s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0)

  return {
    today,
    week,
    month,
    todayExpenses,
    monthExpenses,
    cashInHand: Math.max(todayCashSales - todayExpenses, 0),
  }
}

// ---------- Revenue chart (last 7 days) ----------

export function revenueSeriesLast7Days(sales: Sale[]) {
  const days: { day: string; revenue: number; profit: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - i)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const dayStats = statsSince(
      sales.filter((s) => s.createdAt < nextDate.getTime()),
      date.getTime()
    )
    days.push({
      day: date.toLocaleDateString('en-KE', { weekday: 'short' }),
      revenue: dayStats.revenue,
      profit: dayStats.profit,
    })
  }
  return days
}

// ---------- Stock alerts ----------

export function computeStockAlerts(products: Product[]) {
  const outOfStock = products.filter((p) => p.stock <= 0)
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minimumStock)
  const expiringSoon = products.filter((p) => {
    if (!p.expiryDate) return false
    const days = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days <= 30
  })
  return { outOfStock, lowStock, expiringSoon }
}

export interface ReorderSuggestion {
  product: Product
  suggestedQuantity: number
  urgent: boolean
}

/**
 * A real, actionable reorder list — the specific products that need
 * restocking, by name, with a suggested quantity for each, instead of
 * just a count like "12 products need reordering". Most urgent (already
 * out of stock) first.
 *
 * Suggested quantity: enough to reach the product's maximum stock level
 * if one's set, otherwise enough to reach double its minimum stock — a
 * reasonable buffer above the reorder point either way.
 */
export function computeReorderList(products: Product[]): ReorderSuggestion[] {
  return products
    .filter((p) => p.stock <= p.minimumStock)
    .map((product) => {
      const target = product.maximumStock ?? product.minimumStock * 2
      const suggestedQuantity = Math.max(Math.round(target - product.stock), 1)
      return { product, suggestedQuantity, urgent: product.stock <= 0 }
    })
    .sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
      return a.product.name.localeCompare(b.product.name)
    })
}

// ---------- Business health score ----------

export function computeBusinessHealthScore(products: Product[], sales: Sale[], expenses: Expense[]): number {
  if (products.length === 0) return 0

  // Stock health: share of products at or above their minimum stock.
  const healthyStock = products.filter((p) => p.stock > p.minimumStock).length
  const stockScore = (healthyStock / products.length) * 100

  // Sales trend: this week vs the previous week.
  const thisWeek = statsSince(sales, daysAgo(7)).revenue
  const lastWeekSales = sales.filter((s) => isCompleted(s) && s.createdAt >= daysAgo(14) && s.createdAt < daysAgo(7))
  const lastWeek = lastWeekSales.reduce((sum, s) => sum + s.total, 0)
  let trendScore = 50
  if (lastWeek > 0) {
    const change = (thisWeek - lastWeek) / lastWeek
    trendScore = Math.min(Math.max(50 + change * 100, 0), 100)
  } else if (thisWeek > 0) {
    trendScore = 75
  }

  // Profitability: net margin over the last 30 days.
  const month = statsSince(sales, daysAgo(30))
  const monthExpenses = expenses.filter((e) => e.incurredAt >= daysAgo(30)).reduce((sum, e) => sum + e.amount, 0)
  const netProfit = month.profit - monthExpenses
  let marginScore = 50
  if (month.revenue > 0) {
    const margin = netProfit / month.revenue
    marginScore = Math.min(Math.max(margin * 200 + 50, 0), 100)
  }

  return Math.round(stockScore * 0.4 + trendScore * 0.3 + marginScore * 0.3)
}

// ---------- Product velocity ----------

interface ProductVelocity {
  product: Product
  unitsSold: number
}

function productVelocity(products: Product[], sales: Sale[], since: number): ProductVelocity[] {
  const sold = new Map<string, number>()
  for (const sale of sales) {
    if (!isCompleted(sale) || sale.createdAt < since) continue
    for (const item of sale.items) {
      sold.set(item.productId, (sold.get(item.productId) ?? 0) + item.quantity)
    }
  }
  return products.map((product) => ({ product, unitsSold: sold.get(product.id) ?? 0 }))
}

export function computeFastMovers(products: Product[], sales: Sale[], limit = 5) {
  return productVelocity(products, sales, daysAgo(30))
    .filter((v) => v.unitsSold > 0)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit)
}

/** Products with stock on hand that haven't sold at all in 30 days. */
export function computeSlowMovers(products: Product[], sales: Sale[], limit = 5) {
  return productVelocity(products, sales, daysAgo(30))
    .filter((v) => v.unitsSold === 0 && v.product.stock > 0)
    .sort((a, b) => b.product.stock - a.product.stock)
    .slice(0, limit)
}

// ---------- Stock valuation ----------

export function computeStockValuation(products: Product[]) {
  const costValue = products.reduce((sum, p) => sum + p.stock * p.buyingPrice, 0)
  const retailValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0)
  return { costValue, retailValue, potentialProfit: retailValue - costValue }
}

// ---------- Profit & Loss statement ----------

export interface ProfitAndLossInputs {
  products: Product[]
  sales: Sale[]
  expenses: Expense[]
  purchasesTotal: number
  purchaseReturnsTotal: number
  salesReturnsTotal: number
  since: number
}

export function computeProfitAndLoss({
  products,
  sales,
  expenses,
  purchasesTotal,
  purchaseReturnsTotal,
  salesReturnsTotal,
  since,
}: ProfitAndLossInputs) {
  const periodStats = statsSince(sales, since)
  const salesRevenue = periodStats.revenue
  const cogs = sales
    .filter((s) => isCompleted(s) && s.createdAt >= since)
    .reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.unitCost * i.quantity, 0), 0)

  const { costValue: closingStock } = computeStockValuation(products)
  // Opening + Purchases - Purchase Returns - COGS = Closing
  // => Opening = Closing - Purchases + Purchase Returns + COGS
  const openingStock = closingStock - purchasesTotal + purchaseReturnsTotal + cogs

  const periodExpenses = expenses.filter((e) => e.incurredAt >= since).reduce((sum, e) => sum + e.amount, 0)
  const grossProfit = salesRevenue - salesReturnsTotal - cogs
  const netProfit = grossProfit - periodExpenses
  const profitMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0

  return {
    openingStock,
    purchases: purchasesTotal,
    purchaseReturns: purchaseReturnsTotal,
    closingStock,
    cogs,
    salesRevenue,
    salesReturns: salesReturnsTotal,
    grossProfit,
    expenses: periodExpenses,
    netProfit,
    profitMargin,
  }
}

export interface Recommendation {
  type: 'restock' | 'slow-mover' | 'expiring' | 'margin' | 'expense' | 'credit' | 'positive'
  message: string
}

export function computeRecommendations(
  products: Product[],
  sales: Sale[],
  expenses: Expense[],
  customers: Customer[]
): Recommendation[] {
  const recs: Recommendation[] = []
  const { outOfStock, lowStock, expiringSoon } = computeStockAlerts(products)

  if (outOfStock.length > 0) {
    recs.push({
      type: 'restock',
      message: `${outOfStock.length} product${outOfStock.length === 1 ? ' is' : 's are'} out of stock: ${outOfStock
        .slice(0, 3)
        .map((p) => p.name)
        .join(', ')}${outOfStock.length > 3 ? ', and more' : ''}. Consider a purchase order.`,
    })
  } else if (lowStock.length > 0) {
    recs.push({
      type: 'restock',
      message: `${lowStock.length} product${lowStock.length === 1 ? ' is' : 's are'} below minimum stock — worth restocking soon.`,
    })
  }

  const slowMovers = computeSlowMovers(products, sales, 3)
  if (slowMovers.length > 0) {
    recs.push({
      type: 'slow-mover',
      message: `${slowMovers.map((v) => v.product.name).join(', ')} ${slowMovers.length === 1 ? 'hasn\'t' : 'haven\'t'} sold in the last 30 days despite being in stock — consider a promotion or discount.`,
    })
  }

  if (expiringSoon.length > 0) {
    recs.push({
      type: 'expiring',
      message: `${expiringSoon.length} product${expiringSoon.length === 1 ? '' : 's'} expiring within 30 days: ${expiringSoon
        .slice(0, 3)
        .map((p) => p.name)
        .join(', ')}. Prioritize selling these first.`,
    })
  }

  const lowMarginProducts = products.filter((p) => {
    if (p.sellingPrice <= 0) return false
    const margin = (p.sellingPrice - p.buyingPrice) / p.sellingPrice
    return margin < 0.15 && margin >= 0
  })
  if (lowMarginProducts.length > 0) {
    recs.push({
      type: 'margin',
      message: `${lowMarginProducts.length} product${lowMarginProducts.length === 1 ? ' has' : 's have'} a thin profit margin (under 15%) — review pricing on ${lowMarginProducts
        .slice(0, 2)
        .map((p) => p.name)
        .join(', ')}.`,
    })
  }

  const thisMonthExpenses = expenses.filter((e) => e.incurredAt >= daysAgo(30)).reduce((s, e) => s + e.amount, 0)
  const prevMonthExpenses = expenses
    .filter((e) => e.incurredAt >= daysAgo(60) && e.incurredAt < daysAgo(30))
    .reduce((s, e) => s + e.amount, 0)
  if (prevMonthExpenses > 0 && thisMonthExpenses > prevMonthExpenses * 1.3) {
    const increase = Math.round(((thisMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100)
    recs.push({
      type: 'expense',
      message: `Expenses are up ${increase}% compared to the previous 30 days — worth reviewing where the increase is coming from.`,
    })
  }

  const overLimitCustomers = customers.filter((c) => c.creditLimit > 0 && c.currentBalance >= c.creditLimit)
  if (overLimitCustomers.length > 0) {
    recs.push({
      type: 'credit',
      message: `${overLimitCustomers.length} customer${overLimitCustomers.length === 1 ? ' has' : 's have'} reached their credit limit: ${overLimitCustomers
        .slice(0, 3)
        .map((c) => c.name)
        .join(', ')}. Consider following up on payment.`,
    })
  }

  if (recs.length === 0) {
    recs.push({
      type: 'positive',
      message: 'Stock levels, sales, and expenses all look healthy right now — no urgent action needed.',
    })
  }

  return recs
}
