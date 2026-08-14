import { NavLink } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { canAccessPage } from '@/lib/permissions'
import { NAV_ITEMS } from '@/lib/navItems'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { logout, user } = useAuthStore()
  const visibleNavItems = NAV_ITEMS.filter((item) => canAccessPage(user?.role, item.page))

  async function handleLogout() {
    await supabase.auth.signOut()
    logout()
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface)] transition-all duration-200 md:flex',
        sidebarCollapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <span className="font-display text-lg font-semibold tracking-tight">
            Beauty <span className="text-brand-pink-500">on Point</span>
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="focus-ring ml-auto flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-brand-pink-50 dark:hover:bg-white/5"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-pink-500 text-white shadow-[var(--shadow-glow-pink)]'
                  : 'text-[var(--text-muted)] hover:bg-brand-pink-50 hover:text-brand-pink-700 dark:hover:bg-white/5 dark:hover:text-white'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--border-subtle)] p-3">
        <button
          onClick={handleLogout}
          className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-brand-pink-50 hover:text-brand-pink-700 dark:hover:bg-white/5"
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
