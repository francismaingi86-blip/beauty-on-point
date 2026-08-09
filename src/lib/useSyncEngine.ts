import { useEffect, useState, useCallback, useRef } from 'react'
import { runFullSync, countPendingSync } from '@/lib/syncEngine'

const PERIODIC_INTERVAL_MS = 60_000

/**
 * Runs a full sync on every trigger that reliably indicates "we might be
 * able to reach the server now": coming back online, the app regaining
 * focus (mobile browsers don't always fire 'online' promptly), and a
 * periodic fallback in case both of those are missed. Also tracks how
 * many records are still waiting to sync, for a visible status indicator.
 */
export function useSyncEngine() {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const syncingRef = useRef(false)

  const refreshCount = useCallback(async () => {
    const count = await countPendingSync()
    setPendingCount(count)
  }, [])

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return
    syncingRef.current = true
    setSyncing(true)
    try {
      await runFullSync()
      setLastSyncedAt(Date.now())
    } finally {
      syncingRef.current = false
      setSyncing(false)
      void refreshCount()
    }
  }, [refreshCount])

  useEffect(() => {
    void refreshCount()
    void sync()

    const onOnline = () => void sync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    const interval = setInterval(() => void sync(), PERIODIC_INTERVAL_MS)

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { pendingCount, syncing, lastSyncedAt, syncNow: sync }
}
