import { Sparkles, TrendingUp, TrendingDown, PackageX, AlertTriangle, Percent, Receipt, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useSales } from '@/features/sales/hooks/useSales'
import { useExpenses } from '@/features/expenses/hooks/useExpenses'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import {
  computeRecommendations,
  computeFastMovers,
  computeSlowMovers,
  computeBusinessHealthScore,
  computeStockAlerts,
  computeReorderList,
  type Recommendation,
} from './lib/analytics'
import { ReorderList } from '@/components/shared/ReorderList'

const REC_ICON: Record<Recommendation['type'], typeof PackageX> = {
  restock: PackageX,
  'slow-mover': TrendingDown,
  expiring: AlertTriangle,
  margin: Percent,
  expense: Receipt,
  credit: Users,
  positive: Sparkles,
}

const REC_TONE: Record<Recommendation['type'], 'danger' | 'gold' | 'success'> = {
  restock: 'danger',
  'slow-mover': 'gold',
  expiring: 'gold',
  margin: 'gold',
  expense: 'gold',
  credit: 'gold',
  positive: 'success',
}

export function AiInsightsPage() {
  const { data: products = [] } = useProducts()
  const { data: sales = [] } = useSales()
  const { data: expenses = [] } = useExpenses()
  const { data: customers = [] } = useCustomers()

  const recommendations = computeRecommendations(products, sales, expenses, customers)
  const fastMovers = computeFastMovers(products, sales)
  const slowMovers = computeSlowMovers(products, sales)
  const healthScore = computeBusinessHealthScore(products, sales, expenses)
  const { outOfStock, lowStock, expiringSoon } = computeStockAlerts(products)
  const reorderList = computeReorderList(products)

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display flex items-center gap-2 text-2xl font-semibold">
            <Sparkles size={20} className="text-brand-gold-500" /> AI Insights
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Every figure here is computed from your real sales, stock, and expense data — nothing is guessed.
          </p>
        </div>
        <Badge variant="gold" className="w-fit">
          Business Health: {healthScore}/100
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const Icon = REC_ICON[rec.type]
            const tone = REC_TONE[rec.type]
            return (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    tone === 'danger'
                      ? 'bg-red-100 text-red-600'
                      : tone === 'success'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-brand-gold-100 text-brand-gold-700'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <p>{rec.message}</p>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-start gap-3">
          <PackageX size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold">{outOfStock.length} out of stock</p>
            <p className="text-sm text-[var(--text-muted)]">Restock to avoid missed sales.</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-brand-gold-500" />
          <div>
            <p className="text-sm font-semibold">{lowStock.length} low on stock</p>
            <p className="text-sm text-[var(--text-muted)]">Below their minimum stock level.</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-brand-gold-500" />
          <div>
            <p className="text-sm font-semibold">{expiringSoon.length} expiring soon</p>
            <p className="text-sm text-[var(--text-muted)]">Within the next 30 days.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products to reorder</CardTitle>
        </CardHeader>
        <ReorderList items={reorderList} />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" /> Fast movers (last 30 days)
            </CardTitle>
          </CardHeader>
          {fastMovers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No sales recorded in the last 30 days yet.</p>
          ) : (
            <div className="space-y-2">
              {fastMovers.map(({ product, unitsSold }) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{product.name}</span>
                  <Badge variant="success">{unitsSold} sold</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <TrendingDown size={14} className="text-brand-gold-500" /> Slow movers
            </CardTitle>
          </CardHeader>
          {slowMovers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing is sitting unsold right now.</p>
          ) : (
            <div className="space-y-2">
              {slowMovers.map(({ product }) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{product.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{product.stock} in stock</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default AiInsightsPage
