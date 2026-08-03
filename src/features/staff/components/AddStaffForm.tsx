import { useState } from 'react'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import type { StaffRole } from '@/stores/useAuthStore'
import { useCreateStaff } from '../hooks/useStaff'

const ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: 'administrator', label: 'Administrator', description: 'Full access to everything, including Staff' },
  { value: 'manager', label: 'Manager', description: 'Runs day-to-day operations' },
  { value: 'cashier', label: 'Cashier', description: 'Sales and checkout' },
  { value: 'storekeeper', label: 'Storekeeper', description: 'Products and inventory' },
]

interface AddStaffFormProps {
  onDone: () => void
}

export function AddStaffForm({ onDone }: AddStaffFormProps) {
  const createStaff = useCreateStaff()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<StaffRole>('cashier')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    createStaff.mutate(
      { name, email, password, role },
      {
        onSuccess: () => onDone(),
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not create staff account'),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email" required>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Temporary password" required>
        <Input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Role</span>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`focus-ring rounded-xl border p-3 text-left transition-colors ${
                role === r.value
                  ? 'border-brand-pink-500 bg-brand-pink-50 dark:bg-brand-pink-500/10'
                  : 'border-[var(--border-subtle)] hover:bg-brand-pink-50/50 dark:hover:bg-white/5'
              }`}
            >
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{r.description}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createStaff.isPending}>
          {createStaff.isPending ? 'Creating…' : 'Create login'}
        </Button>
      </div>
    </form>
  )
}
