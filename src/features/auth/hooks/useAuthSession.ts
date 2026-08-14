import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
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
 * Offline handling: `supabase.auth.getSession()` reads the session that
 * was persisted locally on a previous successful login — it needs no
 * network at all. So once someone has logged in here before, this app
 * stays fully usable offline going forward, using the last-known name and
 * role cached in `authCache`. A brand new device genuinely does need
 * network for its very first login (there's no way around verifying a
 * password against nothing), but every login after that doesn't.
 *
 * Every network step here is also timeout-protected and wrapped so a
 * slow or failed lookup can NEVER leave the person stuck on the login
 * screen — worst case they get signed in with the most restricted role
 * (cashier) and an admin can correct it under Staff. Real data access is
 * still governed by the database's own role check (current_staff_role()),
 * not this client-side guess, so failing open here doesn't weaken security.
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

      const emailFallbackName = session.user.email?.split('@')[0] ?? 'Staff'

      // Offline: skip the network entirely and trust the local cache from
      // this user's last successful online login.
      if (!navigator.onLine) {
        const cached = await db.authCache.get('singleton')
        if (cached && cached.userId === session.user.id) {
          setUser({ id: cached.userId, name: cached.name, email: cached.email, role: cached.role as StaffRole })
        } else {
          // Signed in with Supabase but never resolved a role on this
          // device before (e.g. very first offline open right after
          // install) — still let them in rather than stranding them.
          setUser({ id: session.user.id, name: emailFallbackName, email: session.user.email ?? '', role: 'cashier' })
        }
        return
      }

      const fallbackUser = {
        id: session.user.id,
        name: emailFallbackName,
        email: session.user.email ?? '',
        role: 'cashier' as StaffRole,
      }

      try {
        const { data: staffRow } = await withTimeout(
          Promise.resolve(supabase.from('staff').select('*').eq('id', session.user.id).maybeSingle()),
          10000
        )

        if (staffRow) {
          const resolved = {
            id: staffRow.id,
            name: staffRow.name,
            email: staffRow.email,
            role: staffRow.role as StaffRole,
          }
          setUser(resolved)
          void db.authCache.put({
            id: 'singleton',
            userId: resolved.id,
            name: resolved.name,
            email: resolved.email,
            role: resolved.role,
            cachedAt: Date.now(),
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
            void db.authCache.put({
              id: 'singleton',
              userId: inserted.id,
              name: inserted.name,
              email: inserted.email,
              role: inserted.role,
              cachedAt: Date.now(),
            })
            return
          }
        }

        // Authenticated, but no staff row and not eligible to bootstrap —
        // treat as the most restricted role until an admin sorts it out.
        setUser(fallbackUser)
      } catch {
        // The staff lookup itself failed or timed out (online, but the
        // request didn't complete). Fall back to any cached identity from
        // a previous successful login before guessing cashier.
        const cached = await db.authCache.get('singleton')
        if (cached && cached.userId === session.user.id) {
          setUser({ id: cached.userId, name: cached.name, email: cached.email, role: cached.role as StaffRole })
        } else {
          setUser(fallbackUser)
        }
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
