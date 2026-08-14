import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { withTimeout } from '@/lib/withTimeout'
import { useAuthStore } from '@/stores/useAuthStore'

function friendlyError(message: string): string {
  if (message === 'Failed to fetch') {
    return "Can't reach the server — check your internet connection and try again."
  }
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  return message
}

export function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // The single source of truth for "should I leave this page" — fires the
  // instant the auth store reflects a real session, regardless of which
  // code path set it (sign-in here, a restored session, anything future).
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Handles a PWA reopening directly on /login even though this device
  // already has a valid persisted session (e.g. reopened offline right on
  // this screen). getSession() reads local storage only — no network
  // needed — so this works offline too; RequireAuth picks up the rest.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
  }, [navigate])

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!navigator.onLine) {
      setError(
        "You're offline. If you've logged in on this device before, reopen the app and it should let you straight in — a brand new login always needs internet the first time."
      )
      setLoading(false)
      return
    }

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000
      )
      if (error) {
        setError(friendlyError(error.message))
      } else {
        // Navigate immediately on success — nothing is listening for auth
        // state changes while we're still sitting on /login, so we can't
        // rely on that alone. Once we land on "/", RequireAuth mounts and
        // picks up the now-persisted session normally.
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    setResetError(null)
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        15000
      )
      if (error) {
        setResetError(friendlyError(error.message))
      } else {
        setResetSent(true)
      }
    } catch (err) {
      setResetError(friendlyError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'))
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4">
      <div className="card-surface w-full max-w-sm p-6 shadow-[var(--shadow-glass)]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink-100">
            <Sparkles size={22} className="text-brand-pink-600" />
          </div>
          <h1 className="font-display text-xl font-semibold">
            Beauty <span className="text-brand-pink-500">on Point</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {mode === 'signin' ? 'Sign in to your shop dashboard' : 'Reset your password'}
          </p>
        </div>

        {mode === 'signin' ? (
          <>
            <form onSubmit={handleSignIn} className="space-y-4">
              <Field label="Email" required>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode('forgot')
                setResetEmail(email)
                setResetSent(false)
                setResetError(null)
              }}
              className="focus-ring mt-4 block w-full text-center text-sm font-medium text-brand-pink-600"
            >
              Forgot your password?
            </button>

            <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
              No account yet? Ask an administrator to add you under Staff.
            </p>
          </>
        ) : (
          <>
            {resetSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm">
                  If an account exists for <span className="font-medium">{resetEmail}</span>, a reset link has
                  been sent. Check your email, open the link, and you'll be able to set a new password right
                  there.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setMode('signin')}>
                  <ArrowLeft size={15} /> Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Field label="Email" required>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </Field>

                {resetError && <p className="text-sm text-red-600">{resetError}</p>}

                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="focus-ring flex w-full items-center justify-center gap-1.5 text-sm font-medium text-[var(--text-muted)]"
                >
                  <ArrowLeft size={14} /> Back to sign in
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default LoginPage
