import { useState } from 'react'
import { Plus, Trash2, Pencil, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatKes } from '@/lib/utils'
import type { Customer } from '@/lib/db'
import { useCustomers, useSaveCustomer, useDeleteCustomer } from './hooks/useCustomers'
import { CustomerForm } from './components/CustomerForm'
import type { CustomerFormValues } from './api/customers-api'

export function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers()
  const saveCustomer = useSaveCustomer()
  const deleteCustomer = useDeleteCustomer()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditing(customer)
    setDialogOpen(true)
  }

  function handleSubmit(values: CustomerFormValues) {
    saveCustomer.mutate({ values, id: editing?.id }, { onSuccess: () => setDialogOpen(false) })
  }

  function handleDelete(customer: Customer) {
    if (confirm(`Remove "${customer.name}"?`)) deleteCustomer.mutate(customer.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {customers.length} customer{customers.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add customer
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : customers.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Users size={22} className="text-brand-pink-400" />
          <p className="font-medium">No customers yet</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">Add a customer to track credit and loyalty.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border-subtle)] p-0">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact info'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-[var(--text-muted)]">Balance / Limit</p>
                  <p className="text-sm font-semibold">
                    {formatKes(c.currentBalance)} / {formatKes(c.creditLimit)}
                  </p>
                </div>
                {c.loyaltyPoints > 0 && (
                  <Badge variant="gold" className="hidden sm:inline-flex">
                    {c.loyaltyPoints} pts
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}>
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} aria-label={`Delete ${c.name}`}>
                  <Trash2 size={15} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit customer' : 'Add customer'}>
        <CustomerForm
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSaving={saveCustomer.isPending}
        />
      </Dialog>
    </div>
  )
}

export default CustomersPage
