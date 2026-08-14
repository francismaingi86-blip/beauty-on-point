import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  ClipboardList,
  Receipt,
  FileMinus2,
  BarChart3,
  Sparkles,
  Settings,
  UsersRound,
} from 'lucide-react'
import type { PageKey } from './permissions'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  page: PageKey
}

/** The single source of truth for every page in the app's navigation. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, page: 'dashboard' },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, page: 'sales' },
  { to: '/products', label: 'Products', icon: Package, page: 'products' },
  { to: '/inventory', label: 'Inventory', icon: Boxes, page: 'inventory' },
  { to: '/customers', label: 'Customers', icon: Users, page: 'customers' },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, page: 'suppliers' },
  { to: '/purchases', label: 'Purchases', icon: ClipboardList, page: 'purchases' },
  { to: '/expenses', label: 'Expenses', icon: Receipt, page: 'expenses' },
  { to: '/credit-notes', label: 'Credit Notes', icon: FileMinus2, page: 'credit-notes' },
  { to: '/reports', label: 'Reports', icon: BarChart3, page: 'reports' },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles, page: 'ai-insights' },
  { to: '/settings', label: 'Settings', icon: Settings, page: 'settings' },
  { to: '/staff', label: 'Staff', icon: UsersRound, page: 'staff' },
]
