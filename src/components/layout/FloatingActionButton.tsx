import { useState } from 'react'
import { Plus, ScanBarcode, UserPlus, ReceiptText, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const ACTIONS = [
  { label: 'New Sale', icon: ScanBarcode, to: '/sales' },
  { label: 'Add Product', icon: Plus, to: '/products' },
  { label: 'Add Customer', icon: UserPlus, to: '/customers' },
  { label: 'Record Expense', icon: ReceiptText, to: '/expenses' },
]

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
      {open &&
        ACTIONS.map(({ label, icon: Icon, to }) => (
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
