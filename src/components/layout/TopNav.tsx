import { Search, Bell, Sparkles, Sun, Moon, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'

export function TopNav() {
  const { theme, toggleTheme } = useThemeStore()
  const { toggleAIPanel, toggleNotifications } = useUIStore()
  const { user } = useAuthStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 px-4 md:px-6">
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="search"
          placeholder="Search products, customers, sales…"
          className="focus-ring w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] py-2 pl-9 pr-4 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
          title={isOnline ? 'Online — synced' : 'Offline — changes saved locally'}
        >
          {isOnline ? (
            <Wifi size={14} className="text-emerald-500" />
          ) : (
            <WifiOff size={14} className="text-brand-gold-500" />
          )}
          <span className="hidden text-[var(--text-muted)] md:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </span>

        <button
          onClick={toggleTheme}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-brand-pink-50 dark:hover:bg-white/5"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <button
          onClick={toggleNotifications}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-brand-pink-50 dark:hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

        <button
          onClick={toggleAIPanel}
          className="focus-ring flex h-9 items-center gap-1.5 rounded-full bg-brand-gold-400 px-3 text-xs font-semibold text-brand-black-900 hover:bg-brand-gold-500"
        >
          <Sparkles size={15} />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        <div className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-brand-pink-100 text-sm font-semibold text-brand-pink-700 sm:flex">
          {(user?.name ?? 'FM').slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
