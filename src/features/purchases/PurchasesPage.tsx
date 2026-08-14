import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Plus, Trash2, ClipboardList, PackageCheck, Truck, Printer, Undo2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatKes } from '@/lib/utils'
import type { Purchase } from '@/lib/db'
import { usePurchases, useSavePurchase, useMarkPurchaseOrdered, useMarkPurchaseReceived, useDeletePurchase } from './hooks/usePurchases'
import { usePurchaseReturns, useCreatePurchaseReturn } from './hooks/usePurchaseReturns'
import { PurchaseForm } from './components/PurchaseForm'
import { PurchaseReturnForm } from './components/PurchaseReturnForm'
import { GoodsReceivedNote } from './components/GoodsReceivedNote'
import type { PurchaseFormValues } from './api/purchases-api'
import type { CreatePurchaseReturnInput } from './api/purchase-returns-api'
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useSettings } from '@/features/settings/hooks/useSettings'

const STATUS_BADGE: Record<Purchase['status'], 'neutral' | 'gold' | 'success' | 'danger'> = {
  draft: 'neutral',
  ordered: 'gold',
  received: 'success',
  cancelled: 'danger',
}

export function PurchasesPage() {
  const { data: purchases = [], isLoading } = usePurchases()
  const { data: purchaseReturns = [] } = usePurchaseReturns()
  const { data: suppliers = [] } = useSuppliers()
  const { data: products = [] } = useProducts()
  const { data: settings } = useSettings()
  const savePurchase = useSavePurchase()
  const markOrdered = useMarkPurchaseOrdered()
  const markReceived = useMarkPurchaseReceived()
  const deletePurchase = useDeletePurchase()
  const createReturn = useCreatePurchaseReturn()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [grnPurchase, setGrnPurchase] = useState<Purchase | null>(null)

  const grnRef = useRef<HTMLDivElement>(null)
  const printGrn = useReactToPrint({ contentRef: grnRef })

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function handleSubmit(values: PurchaseFormValues) {
    savePurchase.mutate({ values, id: editing?.id }, { onSuccess: () => setDialogOpen(false) })
  }

  function handleReceive(purchase: Purchase) {
    if (confirm(`Mark this purchase as received? This will add ${purchase.items.reduce((s, i) => s + i.quantity, 0)} units into stock.`)) {
      markReceived.mutate(purchase.id)
    }
  }

  function handleDelete(purchase: Purchase) {
    if (confirm('Delete this purchase order?')) deletePurchase.mutate(purchase.id)
  }

  function handleReturnSubmit(input: CreatePurchaseReturnInput) {
    createReturn.mutate(input, { onSuccess: () => setReturnDialogOpen(false) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Purchases</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {purchases.length} purchase order{purchases.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setReturnDialogOpen(true)}>
            <Undo2 size={16} /> Return to supplier
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} /> New purchase
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : purchases.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <ClipboardList size={22} className="text-brand-pink-400" />
          <p className="font-medium">No purchase orders yet</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            Create a purchase to order stock from a supplier. Marking it received automatically adds the quantities into your inventory.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border-subtle)] p-0">
          {purchases.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[var(--text-muted)]" />
                  <p className="truncate text-sm font-medium">{p.supplierName ?? 'No supplier'}</p>
                  <Badge variant={STATUS_BADGE[p.status]} className="capitalize">
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {p.items.length} item{p.items.length === 1 ? '' : 's'} · {new Date(p.createdAt).toLocaleDateString('en-KE')}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold">{formatKes(p.total)}</p>
                {p.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => markOrdered.mutate(p.id)} disabled={markOrdered.isPending}>
                    Mark ordered
                  </Button>
                )}
                {(p.status === 'draft' || p.status === 'ordered') && (
                  <Button size="sm" onClick={() => handleReceive(p)} disabled={markReceived.isPending}>
                    <PackageCheck size={14} /> Receive
                  </Button>
                )}
                {p.status === 'received' && (
                  <Button variant="outline" size="sm" onClick={() => setGrnPurchase(p)}>
                    <Printer size={14} /> GRN
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} aria-label="Delete purchase">
                  <Trash2 size={15} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {purchaseReturns.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold">Returns to suppliers</h2>
          <Card className="divide-y divide-[var(--border-subtle)] p-0">
            {purchaseReturns.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.supplierName ?? 'No supplier'}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {r.items.length} item{r.items.length === 1 ? '' : 's'} · {new Date(r.createdAt).toLocaleDateString('en-KE')}
                    {r.staffName && ` · ${r.staffName}`}
                  </p>
                  {r.reason && <p className="mt-1 text-xs italic text-[var(--text-muted)]">"{r.reason}"</p>}
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatKes(r.total)}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="New purchase">
        <PurchaseForm
          suppliers={suppliers}
          products={products}
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSaving={savePurchase.isPending}
        />
      </Dialog>

      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} title="Return to supplier">
        <PurchaseReturnForm
          suppliers={suppliers}
          products={products}
          onSubmit={handleReturnSubmit}
          onCancel={() => setReturnDialogOpen(false)}
          isSaving={createReturn.isPending}
        />
      </Dialog>

      {grnPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-surface max-h-[85vh] w-full max-w-sm overflow-y-auto p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Goods Received Note</h2>
              <button onClick={() => setGrnPurchase(null)} className="focus-ring rounded-full p-1.5 hover:bg-brand-pink-50 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            <GoodsReceivedNote ref={grnRef} purchase={grnPurchase} businessName={settings?.businessName ?? 'Beauty on Point'} />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setGrnPurchase(null)}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => printGrn()}>
                <Printer size={15} /> Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasesPage
