import { ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/useAuthStore'
import { canAccessPage, type PageKey } from '@/lib/permissions'

interface RequirePageAccessProps {
  page: PageKey
  children: React.ReactNode
}

export function RequirePageAccess({ page, children }: RequirePageAccessProps) {
  const role = useAuthStore((s) => s.user?.role)

  if (!canAccessPage(role, page)) {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <ShieldAlert size={22} className="text-brand-gold-500" />
          <p className="font-medium">You don't have access to this page</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            Ask an administrator if you need this — they can update your role under Staff.
          </p>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
