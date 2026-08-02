import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Keeps the auth store in sync with Supabase's session, and reports whether
 * the initial session check has finished (so we don't flash the login page
 * while it's still loading).
 */
export function useAuthSession() {
  const setUser = useAuthStore((s) => s.setUser)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session)
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    function applySession(session: { user: { id: string; email?: string } } | null) {
      if (!session) {
        setUser(null)
        return
      }
      setUser({
        id: session.user.id,
        name: session.user.email?.split('@')[0] ?? 'Staff',
        email: session.user.email ?? '',
        role: 'administrator',
      })
    }

    return () => listener.subscription.unsubscribe()
  }, [setUser])

  return { ready }
}
