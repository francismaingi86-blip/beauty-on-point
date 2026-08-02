import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'More', icon: Menu },
]

export function MobileNav() {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[var(--border-subtle)] py-2 md:hidden">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
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
