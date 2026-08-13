import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { canAccessPage, type PageKey } from '@/lib/permissions'

const ITEMS: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; page: PageKey }[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true, page: 'dashboard' },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, page: 'sales' },
  { to: '/products', label: 'Products', icon: Package, page: 'products' },
  { to: '/reports', label: 'Reports', icon: BarChart3, page: 'reports' },
  { to: '/settings', label: 'Settings', icon: Settings, page: 'settings' },
]

export function MobileNav() {
  const role = useAuthStore((s) => s.user?.role)
  const items = ITEMS.filter((item) => canAccessPage(role, item.page))

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[var(--border-subtle)] py-2 md:hidden">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'focus-ring flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium',
              isActive ? 'text-brand-pink-600' : 'text-[var(--text-muted)]'
            )
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
