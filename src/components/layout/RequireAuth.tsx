import { Navigate, Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { useAuthStore } from '@/stores/useAuthStore'

export function RequireAuth() {
  const { ready } = useAuthSession()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)]">
        <Sparkles size={24} className="animate-pulse text-brand-pink-400" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
