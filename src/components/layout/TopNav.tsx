import { Search, Bell, Sparkles, Sun, Moon, Wifi, WifiOff, RefreshCw, CloudCheck, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSyncEngine } from '@/lib/useSyncEngine'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { cn } from '@/lib/utils'

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000 // 2 hours

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return 'not yet'
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export function TopNav() {
  const { theme, toggleTheme } = useThemeStore()
  const { toggleAIPanel, toggleNotifications } = useUIStore()
  const { user } = useAuthStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { pendingCount, syncing, lastSyncedAt, oldestPendingAt, syncNow } = useSyncEngine()
  useRealtimeSync()
  const [statusOpen, setStatusOpen] = useState(false)
  const isStale = oldestPendingAt != null && Date.now() - oldestPendingAt > STALE_THRESHOLD_MS

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
        <div className="relative">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="focus-ring flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium hover:bg-brand-pink-50 dark:hover:bg-white/5"
          >
            {!isOnline ? (
              <WifiOff size={14} className="text-brand-gold-500" />
            ) : isStale ? (
              <AlertTriangle size={14} className="text-red-500" />
            ) : pendingCount > 0 || syncing ? (
              <RefreshCw size={14} className={cn('text-brand-gold-500', syncing && 'animate-spin')} />
            ) : (
              <CloudCheck size={14} className="text-emerald-500" />
            )}
            <span className={cn('hidden md:inline', isStale ? 'text-red-500' : 'text-[var(--text-muted)]')}>
              {!isOnline
                ? 'Offline'
                : isStale
                  ? 'Not synced'
                  : syncing
                    ? 'Syncing…'
                    : pendingCount > 0
                      ? `${pendingCount} pending`
                      : 'Synced'}
            </span>
          </button>

          {statusOpen && (
            <>
              <button
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setStatusOpen(false)}
                aria-label="Close"
              />
              <div className="card-surface absolute right-0 top-11 z-40 w-64 p-4 text-sm shadow-[var(--shadow-glass)]">
                <div className="mb-2 flex items-center gap-2">
                  {isOnline ? (
                    <Wifi size={15} className="text-emerald-500" />
                  ) : (
                    <WifiOff size={15} className="text-brand-gold-500" />
                  )}
                  <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <p className="text-[var(--text-muted)]">
                  {pendingCount > 0
                    ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} saved on this device, waiting to sync.`
                    : "Everything on this device is synced to the cloud."}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Last synced: {timeAgo(lastSyncedAt)}</p>
                {isStale && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Some changes haven't synced in over 2 hours. Please connect to strong internet and keep the app
                      open for a moment, or tap Sync now below.
                    </span>
                  </div>
                )}
                <button
                  onClick={() => syncNow()}
                  disabled={!isOnline || syncing}
                  className="focus-ring mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-pink-500 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  <RefreshCw size={13} className={cn(syncing && 'animate-spin')} />
                  {syncing ? 'Syncing…' : 'Sync now'}
                </button>
                {!isOnline && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Reconnect to the internet to sync — everything you do stays saved on this device meanwhile.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

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
