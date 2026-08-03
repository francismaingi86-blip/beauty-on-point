import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4">
      <div className="card-surface w-full max-w-sm p-6 shadow-[var(--shadow-glass)]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink-100">
            <Sparkles size={22} className="text-brand-pink-600" />
          </div>
          <h1 className="font-display text-xl font-semibold">Set a new password</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="New password" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
