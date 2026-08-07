import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore, type StaffRole } from '@/stores/useAuthStore'
import { withTimeout } from '@/lib/withTimeout'

/**
 * Keeps the auth store in sync with Supabase's session AND the staff
 * table's role for that user. Reports whether the initial check has
 * finished (so we don't flash the login page while it's still loading).
 *
 * The very first person to log in — before any `staff` row exists — is
 * automatically promoted to administrator (see the bootstrap RLS policy
 * in supabase/schema.sql). Every login after that must be created by an
 * admin via the create-staff edge function.
 *
 * Every step here is timeout-protected and wrapped so a slow or failed
 * lookup can NEVER leave the person stuck on the login screen — worst
 * case they get signed in with the most restricted role (cashier) and an
 * admin can correct it under Staff. Real data access is still governed
 * by the database's own role check (current_staff_role()), not this
 * client-side guess, so failing open here doesn't weaken security.
 */
export function useAuthSession() {
  const setUser = useAuthStore((s) => s.setUser)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function applySession(session: Session | null) {
      if (!session) {
        setUser(null)
        return
      }

      const fallbackUser = {
        id: session.user.id,
        name: session.user.email?.split('@')[0] ?? 'Staff',
        email: session.user.email ?? '',
        role: 'cashier' as StaffRole,
      }

      try {
        const { data: staffRow } = await withTimeout(
          Promise.resolve(supabase.from('staff').select('*').eq('id', session.user.id).maybeSingle()),
          10000
        )

        if (staffRow) {
          setUser({
            id: staffRow.id,
            name: staffRow.name,
            email: staffRow.email,
            role: staffRow.role as StaffRole,
          })
          return
        }

        // No row yet — bootstrap as administrator only if no staff exist at all.
        const { count } = await withTimeout(
          Promise.resolve(supabase.from('staff').select('*', { count: 'exact', head: true })),
          10000
        )

        if (!count) {
          const name = session.user.email?.split('@')[0] ?? 'Admin'
          const { data: inserted } = await withTimeout(
            Promise.resolve(
              supabase
                .from('staff')
                .insert({ id: session.user.id, name, email: session.user.email, role: 'administrator' })
                .select()
                .single()
            ),
            10000
          )

          if (inserted) {
            setUser({ id: inserted.id, name: inserted.name, email: inserted.email, role: inserted.role })
            return
          }
        }

        // Authenticated, but no staff row and not eligible to bootstrap —
        // treat as the most restricted role until an admin sorts it out.
        setUser(fallbackUser)
      } catch {
        // The staff lookup itself failed or timed out. The person is
        // still genuinely signed in with Supabase — let them into the
        // app rather than stranding them on the login screen with no
        // explanation. Their real permissions are still enforced by the
        // database regardless of what role we guess here.
        setUser(fallbackUser)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session).finally(() => setReady(true))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true })
        return
      }
      applySession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, navigate])

  return { ready }
}
