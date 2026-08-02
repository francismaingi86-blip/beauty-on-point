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

// Placeholder series — wire to Supabase queries once sales data exists.
const revenueSeries = [
  { day: 'Mon', revenue: 12000, profit: 4200 },
  { day: 'Tue', revenue: 15800, profit: 5600 },
  { day: 'Wed', revenue: 9800, profit: 3100 },
  { day: 'Thu', revenue: 17200, profit: 6200 },
  { day: 'Fri', revenue: 21200, profit: 8100 },
  { day: 'Sat', revenue: 26400, profit: 9800 },
  { day: 'Sun', revenue: 14100, profit: 4900 },
]

const topProducts = [
  { name: 'Matte Lip Kit', units: 42 },
  { name: 'Hydra Glow Serum', units: 35 },
  { name: 'Rose Nude Palette', units: 28 },
  { name: 'Silk Foundation', units: 24 },
]

const STAT_CARDS = [
  { label: "Today's Sales", value: formatKes(26400), icon: TrendingUp },
  { label: "Today's Profit", value: formatKes(9800), icon: Wallet },
  { label: "Today's Expenses", value: formatKes(3200), icon: Receipt },
  { label: 'Cash in Hand', value: formatKes(18450), icon: ShoppingBag },
]

const HEALTH_SCORE = 82

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Good morning, Francis</h1>
          <p className="text-sm text-[var(--text-muted)]">Here's how Beauty on Point is doing today.</p>
        </div>
        <Badge variant="gold" className="w-fit">
          Business Health: {HEALTH_SCORE}/100
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
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <Tooltip />
                <Bar dataKey="units" fill="#fa5a9a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-start gap-3">
          <PackageX size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold">2 products out of stock</p>
            <p className="text-sm text-[var(--text-muted)]">Restock to avoid missed sales.</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-brand-gold-500" />
          <div>
            <p className="text-sm font-semibold">5 products low on stock</p>
            <p className="text-sm text-[var(--text-muted)]">Below their minimum stock level.</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <CalendarClock size={18} className="mt-0.5 shrink-0 text-brand-gold-500" />
          <div>
            <p className="text-sm font-semibold">3 products expiring soon</p>
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
        <p className="text-sm text-[var(--text-muted)]">
          Connect Supabase and record a few days of sales, and AI Insights will
          generate real restock suggestions, slow-mover alerts, and profit tips
          here — grounded only in your actual data.
        </p>
      </Card>
    </div>
  )
}

export default DashboardPage
