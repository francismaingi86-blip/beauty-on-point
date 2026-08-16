import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { runFullSync, countPendingSync, getOldestPendingTimestamp } from '@/lib/syncEngine'

const PERIODIC_INTERVAL_MS = 60_000

// Every query key any page reads from — invalidated after each sync so
// pages pick up whatever just changed without each running its own sync.
const ALL_QUERY_KEYS = [
  ['products'],
  ['sales'],
  ['held-sales'],
  ['customers'],
  ['suppliers'],
  ['expenses'],
  ['purchases'],
  ['purchase-returns'],
  ['credit-notes'],
  ['stock-takes'],
]

/**
 * Runs a full sync on every trigger that reliably indicates "we might be
 * able to reach the server now": coming back online, the app regaining
 * focus (mobile browsers don't always fire 'online' promptly), and a
 * periodic fallback in case both of those are missed. Also makes a
 * best-effort sync attempt right as the app is being closed or hidden, so
 * a change made moments before closing has a chance to go out rather than
 * waiting for the next time the app happens to be opened.
 *
 * This is the ONLY place sync runs — individual pages don't sync on their
 * own anymore, they just read from the local cache and get refreshed by
 * the invalidation below once this finishes.
 */
export function useSyncEngine() {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [oldestPendingAt, setOldestPendingAt] = useState<number | null>(null)
  const syncingRef = useRef(false)
  const queryClient = useQueryClient()

  const refreshCount = useCallback(async () => {
    const [count, oldest] = await Promise.all([countPendingSync(), getOldestPendingTimestamp()])
    setPendingCount(count)
    setOldestPendingAt(oldest)
  }, [])

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return
    syncingRef.current = true
    setSyncing(true)
    try {
      await runFullSync()
      setLastSyncedAt(Date.now())
      ALL_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
    } finally {
      syncingRef.current = false
      setSyncing(false)
      void refreshCount()
    }
  }, [refreshCount, queryClient])

  useEffect(() => {
    void refreshCount()
    void sync()

    const onOnline = () => void sync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    // Best-effort: try to flush pending changes right as the app is
    // hidden (backgrounded or closed) rather than only when it reopens.
    // This can't be guaranteed to finish — the browser may kill the page
    // before an in-flight request completes — but it meaningfully
    // improves the odds for anything not already mid-sync.
    const onHide = () => {
      if (document.visibilityState === 'hidden') void sync()
    }
    const interval = setInterval(() => void sync(), PERIODIC_INTERVAL_MS)

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)

    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { pendingCount, syncing, lastSyncedAt, oldestPendingAt, syncNow: sync }
}
