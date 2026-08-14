import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { canAccessPage } from '@/lib/permissions'
import { NAV_ITEMS } from '@/lib/navItems'
import { supabase } from '@/lib/supabase'

// The 3 fixed bottom-bar slots, in priority order — whichever of these the
// role can access fill the primary slots; "More" always covers the rest,
// so nothing is ever unreachable regardless of role.
const PRIMARY_ORDER = ['sales', 'products', 'inventory', 'reports'] as const

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const role = useAuthStore((s) => s.user?.role)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()

  const accessible = NAV_ITEMS.filter((item) => canAccessPage(role, item.page))
  const dashboard = accessible.find((item) => item.page === 'dashboard')
  const primaries = PRIMARY_ORDER.map((page) => accessible.find((item) => item.page === page))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 2)
  const primaryPages = new Set([dashboard?.page, ...primaries.map((p) => p.page)])
  const moreItems = accessible.filter((item) => !primaryPages.has(item.page))

  const isMoreActive = moreItems.some((item) => item.to === location.pathname)

  async function handleLogout() {
    await supabase.auth.signOut()
    logout()
    setMoreOpen(false)
  }

  return (
    <>
      <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[var(--border-subtle)] py-2 md:hidden">
        {dashboard && (
          <NavLink
            to={dashboard.to}
            end={dashboard.end}
            className={({ isActive }) =>
              cn(
                'focus-ring flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium',
                isActive ? 'text-brand-pink-600' : 'text-[var(--text-muted)]'
              )
            }
          >
            <LayoutDashboard size={20} />
            Home
          </NavLink>
        )}

        {primaries.map(({ to, label, icon: Icon, end }) => (
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

        {moreItems.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'focus-ring flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium',
              isMoreActive ? 'text-brand-pink-600' : 'text-[var(--text-muted)]'
            )}
          >
            <Menu size={20} />
            More
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 flex items-end md:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="card-surface relative max-h-[75vh] w-full overflow-y-auto rounded-b-none p-0 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-4">
              <h2 className="font-display text-lg font-semibold">More</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="focus-ring rounded-full p-1.5 hover:bg-brand-pink-50 dark:hover:bg-white/5"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {moreItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-medium',
                      isActive
                        ? 'bg-brand-pink-50 text-brand-pink-600 dark:bg-brand-pink-500/10'
                        : 'text-[var(--text-muted)] hover:bg-brand-pink-50/50 dark:hover:bg-white/5'
                    )
                  }
                >
                  <Icon size={22} />
                  {label}
                </NavLink>
              ))}
            </div>
            <div className="border-t border-[var(--border-subtle)] p-4">
              <button
                onClick={handleLogout}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-brand-pink-50 dark:hover:bg-white/5"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
