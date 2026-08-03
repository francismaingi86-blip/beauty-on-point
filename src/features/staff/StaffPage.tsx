import { useState } from 'react'
import { Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/useAuthStore'
import { useStaff, useUpdateStaffRole, useRemoveStaff } from './hooks/useStaff'
import { AddStaffForm } from './components/AddStaffForm'
import type { StaffRole } from '@/stores/useAuthStore'

const ROLE_OPTIONS: StaffRole[] = ['administrator', 'manager', 'cashier', 'storekeeper']

const ROLE_BADGE: Record<StaffRole, 'pink' | 'gold' | 'neutral'> = {
  administrator: 'pink',
  manager: 'gold',
  cashier: 'neutral',
  storekeeper: 'neutral',
}

export function StaffPage() {
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'administrator'
  const { data: staff = [], isLoading } = useStaff()
  const updateRole = useUpdateStaffRole()
  const removeStaff = useRemoveStaff()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold">Staff</h1>
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <ShieldAlert size={22} className="text-brand-gold-500" />
          <p className="font-medium">Administrators only</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            Ask an administrator to manage staff accounts and roles.
          </p>
        </Card>
      </div>
    )
  }

  function handleRemove(id: string, name: string) {
    if (id === currentUser?.id) {
      alert("You can't remove your own account.")
      return
    }
    if (confirm(`Remove ${name}'s access? They'll lose their role and be unable to use the app.`)) {
      removeStaff.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Staff</h1>
          <p className="text-sm text-[var(--text-muted)]">Create logins and assign roles.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> Add staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{staff.length} staff account{staff.length === 1 ? '' : 's'}</CardTitle>
        </CardHeader>

        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.name} {member.id === currentUser?.id && <span className="text-[var(--text-muted)]">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{member.email}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => updateRole.mutate({ id: member.id, role: e.target.value as StaffRole })}
                    disabled={member.id === currentUser?.id}
                    className="focus-ring rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-xs capitalize"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Badge variant={ROLE_BADGE[member.role]} className="hidden sm:inline-flex capitalize">
                    {member.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${member.name}`}
                    onClick={() => handleRemove(member.id, member.name)}
                  >
                    <Trash2 size={15} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add staff">
        <AddStaffForm onDone={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  )
}

export default StaffPage
