import { useState } from 'react'
import { Plus, FileMinus2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatKes } from '@/lib/utils'
import { useCreditNotes, useCreateCreditNote } from './hooks/useCreditNotes'
import { CreditNoteForm } from './components/CreditNoteForm'
import { useCustomers } from '@/features/customers/hooks/useCustomers'
import { useProducts } from '@/features/products/hooks/useProducts'
import type { CreateCreditNoteInput } from './api/credit-notes-api'

export function CreditNotesPage() {
  const { data: creditNotes = [], isLoading } = useCreditNotes()
  const { data: customers = [] } = useCustomers()
  const { data: products = [] } = useProducts()
  const createCreditNote = useCreateCreditNote()
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleSubmit(input: CreateCreditNoteInput) {
    createCreditNote.mutate(input, { onSuccess: () => setDialogOpen(false) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Credit Notes</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {creditNotes.length} credit note{creditNotes.length === 1 ? '' : 's'} issued
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> Issue credit note
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : creditNotes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <FileMinus2 size={22} className="text-brand-pink-400" />
          <p className="font-medium">No credit notes yet</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            Issue one when a customer returns an item — it goes back into stock automatically, and reduces their balance if they're on credit.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border-subtle)] p-0">
          {creditNotes.map((note) => (
            <div key={note.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{note.customerName ?? 'Walk-in customer'}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {note.items.length} item{note.items.length === 1 ? '' : 's'} ·{' '}
                  {new Date(note.createdAt).toLocaleString('en-KE')}
                  {note.staffName && ` · ${note.staffName}`}
                </p>
                {note.reason && <p className="mt-1 text-xs italic text-[var(--text-muted)]">"{note.reason}"</p>}
              </div>
              <p className="shrink-0 text-sm font-semibold">{formatKes(note.total)}</p>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Issue credit note">
        <CreditNoteForm
          customers={customers}
          products={products}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSaving={createCreditNote.isPending}
        />
      </Dialog>
    </div>
  )
}

export default CreditNotesPage
