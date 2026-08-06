import { useState } from 'react'
import { Plus, Trash2, Pencil, Truck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatKes } from '@/lib/utils'
import type { Supplier } from '@/lib/db'
import { useSuppliers, useSaveSupplier, useDeleteSupplier } from './hooks/useSuppliers'
import { SupplierForm } from './components/SupplierForm'
import type { SupplierFormValues } from './api/suppliers-api'

export function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const saveSupplier = useSaveSupplier()
  const deleteSupplier = useDeleteSupplier()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier)
    setDialogOpen(true)
  }

  function handleSubmit(values: SupplierFormValues) {
    saveSupplier.mutate({ values, id: editing?.id }, { onSuccess: () => setDialogOpen(false) })
  }

  function handleDelete(supplier: Supplier) {
    if (confirm(`Remove "${supplier.name}"?`)) deleteSupplier.mutate(supplier.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Suppliers</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {suppliers.length} supplier{suppliers.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add supplier
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : suppliers.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Truck size={22} className="text-brand-pink-400" />
          <p className="font-medium">No suppliers yet</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">Add a supplier to start tracking purchases and balances.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border-subtle)] p-0">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {[s.phone, s.email].filter(Boolean).join(' · ') || 'No contact info'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Outstanding</p>
                  <p className="text-sm font-semibold">{formatKes(s.outstandingBalance)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s)} aria-label={`Delete ${s.name}`}>
                  <Trash2 size={15} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit supplier' : 'Add supplier'}>
        <SupplierForm
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSaving={saveSupplier.isPending}
        />
      </Dialog>
    </div>
  )
}

export default SuppliersPage
