import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatKes } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSales } from '@/features/sales/hooks/useSales'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useExpenses } from '@/features/expenses/hooks/useExpenses'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import {
  computeDashboardStats,
  revenueSeriesLast7Days,
  computeStockAlerts,
  computeBusinessHealthScore,
  computeFastMovers,
  computeRecommendations,
} from '@/features/ai-insights/lib/analytics'
import {
  TrendingUp,
  Wallet,
  Receipt,
  ShoppingBag,
  AlertTriangle,
  PackageX,
  CalendarClock,
  Sparkles,
} from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const isCashierOrStorekeeper = user?.role === 'cashier' || user?.role === 'storekeeper'
  const { data: sales = [] } = useSales()
  const { data: products = [] } = useProducts()
  const { data: expenses = [] } = useExpenses()
  const { data: customers = [] } = useCustomers()

  if (isCashierOrStorekeeper) {
    const today = sales.filter(
      (s) => s.status === 'completed' && new Date(s.createdAt).toDateString() === new Date().toDateString()
    )
    const todayTotal = today.reduce((sum, s) => sum + s.total, 0)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Welcome, {firstName}</h1>
          <p className="text-sm text-[var(--text-muted)]">Here's your activity today.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your sales today</CardTitle>
              <ShoppingBag size={16} className="text-brand-pink-400" />
            </CardHeader>
            <CardValue>{formatKes(todayTotal)}</CardValue>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Transactions today</CardTitle>
              <Receipt size={16} className="text-brand-pink-400" />
            </CardHeader>
            <CardValue>{today.length}</CardValue>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          {today.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No sales yet today — head to Sales to ring one up.</p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {today.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{sale.items.length} item{sale.items.length === 1 ? '' : 's'}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
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

  const stats = computeDashboardStats(sales, expenses)
  const revenueSeries = revenueSeriesLast7Days(sales)
  const { outOfStock, lowStock, expiringSoon } = computeStockAlerts(products)
  const healthScore = computeBusinessHealthScore(products, sales, expenses)
  const fastMovers = computeFastMovers(products, sales, 5)
  const recommendations = computeRecommendations(products, sales, expenses, customers).slice(0, 3)

  const STAT_CARDS = [
    { label: "Today's Sales", value: formatKes(stats.today.revenue), icon: TrendingUp },
    { label: "Today's Profit", value: formatKes(stats.today.profit), icon: Wallet },
    { label: "Today's Expenses", value: formatKes(stats.todayExpenses), icon: Receipt },
    { label: 'Cash in Hand (est.)', value: formatKes(stats.cashInHand), icon: ShoppingBag },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Good morning, {firstName}</h1>
          <p className="text-sm text-[var(--text-muted)]">Here's how Beauty on Point is doing today.</p>
        </div>
        <Badge variant="gold" className="w-fit">
          Business Health: {healthScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <Icon size={16} className="text-brand-pink-400" />
            </CardHeader>
            <CardValue>{value}</CardValue>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue &amp; Profit — Last 7 Days</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec2b77" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ec2b77" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#ec2b77" fill="url(#revenueGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#c2911f" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products (30 days)</CardTitle>
          </CardHeader>
          <div className="h-64">
            {fastMovers.length === 0 ? (
              <p className="pt-8 text-center text-sm text-[var(--text-muted)]">No sales recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fastMovers.map((v) => ({ name: v.product.name, units: v.unitsSold }))}
                  layout="vertical"
                  margin={{ left: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                  <Tooltip />
                  <Bar dataKey="units" fill="#fa5a9a" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-start gap-3">
          <PackageX size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold">{outOfStock.length} products out of stock</p>
            <p className="text-sm text-[var(--text-muted)]">Restock to avoid missed sales.</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-brand-gold-500" />
          <div>
            <p className="text-sm font-semibold">{lowStock.length} products low on stock</p>
            <p className="text-sm text-[var(--text-muted)]">Below their minimum stock level.</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <CalendarClock size={18} className="mt-0.5 shrink-0 text-brand-gold-500" />
          <div>
            <p className="text-sm font-semibold">{expiringSoon.length} products expiring soon</p>
            <p className="text-sm text-[var(--text-muted)]">Within the next 30 days.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-gold-500" /> AI Recommendations
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <p key={i} className="text-sm text-[var(--text-muted)]">
              {rec.message}
            </p>
          ))}
        </div>
        <Link to="/ai-insights" className="mt-3 inline-block text-sm font-medium text-brand-pink-600">
          See full insights →
        </Link>
      </Card>
    </div>
  )
}

export default DashboardPage
