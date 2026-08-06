import { useState } from 'react'
import { ClipboardCheck, Boxes } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useStockTakes, useSubmitStockTake } from './hooks/useStockTakes'
import { StockTakeSession } from './components/StockTakeSession'
import type { StockTakeItem } from '@/lib/db'

export function InventoryPage() {
  const { data: products = [] } = useProducts()
  const { data: stockTakes = [], isLoading } = useStockTakes()
  const submitStockTake = useSubmitStockTake()
  const [takingStock, setTakingStock] = useState(false)

  function handleSubmit(counts: Map<string, number>, notes: string) {
    const items: StockTakeItem[] = Array.from(counts.entries()).map(([productId, countedStock]) => {
      const product = products.find((p) => p.id === productId)!
      return {
        productId,
        name: product.name,
        systemStock: product.stock,
        countedStock,
        variance: countedStock - product.stock,
      }
    })
    submitStockTake.mutate({ items, notes }, { onSuccess: () => setTakingStock(false) })
  }

  if (takingStock) {
    return (
      <StockTakeSession
        products={products}
        onSubmit={handleSubmit}
        onCancel={() => setTakingStock(false)}
        isSaving={submitStockTake.isPending}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-[var(--text-muted)]">Stock takes and adjustment history.</p>
        </div>
        <Button onClick={() => setTakingStock(true)}>
          <ClipboardCheck size={16} /> Start stock take
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : stockTakes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Boxes size={22} className="text-brand-pink-400" />
          <p className="font-medium">No stock takes recorded yet</p>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            Start a stock take to count what's physically on the shelf and reconcile it against the system.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--border-subtle)] p-0">
          {stockTakes.map((st) => {
            const varianceItems = st.items.filter((i) => i.variance !== 0)
            return (
              <div key={st.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {st.items.length} item{st.items.length === 1 ? '' : 's'} counted
                      {st.staffName && <span className="text-[var(--text-muted)]"> · {st.staffName}</span>}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(st.createdAt).toLocaleString('en-KE')}</p>
                  </div>
                  {varianceItems.length > 0 ? (
                    <Badge variant="gold">{varianceItems.length} variance{varianceItems.length === 1 ? '' : 's'}</Badge>
                  ) : (
                    <Badge variant="success">All matched</Badge>
                  )}
                </div>
                {varianceItems.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                    {varianceItems.slice(0, 5).map((i) => (
                      <div key={i.productId} className="flex justify-between">
                        <span className="truncate">{i.name}</span>
                        <span className={i.variance > 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {i.variance > 0 ? '+' : ''}
                          {i.variance}
                        </span>
                      </div>
                    ))}
                    {varianceItems.length > 5 && <p>+{varianceItems.length - 5} more</p>}
                  </div>
                )}
                {st.notes && <p className="mt-2 text-xs italic text-[var(--text-muted)]">"{st.notes}"</p>}
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

export default InventoryPage
