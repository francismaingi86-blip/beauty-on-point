import { useState } from 'react'
import { Plus, ScanBarcode, UserPlus, ReceiptText, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { canAccessPage, type PageKey } from '@/lib/permissions'

const ACTIONS: { label: string; icon: typeof Plus; to: string; page: PageKey }[] = [
  { label: 'New Sale', icon: ScanBarcode, to: '/sales', page: 'sales' },
  { label: 'Add Product', icon: Plus, to: '/products', page: 'products' },
  { label: 'Add Customer', icon: UserPlus, to: '/customers', page: 'customers' },
  { label: 'Record Expense', icon: ReceiptText, to: '/expenses', page: 'expenses' },
]

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const actions = ACTIONS.filter((a) => canAccessPage(role, a.page))

  if (actions.length === 0) return null

  return (
    <div className="fixed bottom-24 right-6 z-30 flex flex-col items-end gap-2 md:bottom-6">
      {open &&
        actions.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => {
              navigate(to)
              setOpen(false)
            }}
            className="focus-ring flex items-center gap-2 rounded-full bg-[var(--surface)] py-2 pl-3 pr-4 text-sm font-medium shadow-[var(--shadow-glass)] hover:bg-brand-pink-50 dark:hover:bg-white/5"
          >
            <Icon size={16} className="text-brand-pink-500" />
            {label}
          </button>
        ))}

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink-500 text-white shadow-[var(--shadow-glow-pink)] transition-transform hover:bg-brand-pink-600',
          open && 'rotate-45'
        )}
        aria-label="Quick actions"
      >
        {open ? <X size={22} /> : <Plus size={22} />}
      </button>
    </div>
  )
}
