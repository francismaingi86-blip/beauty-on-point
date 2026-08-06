import { forwardRef } from 'react'
import type { Purchase } from '@/lib/db'
import { formatKes } from '@/lib/utils'

interface GoodsReceivedNoteProps {
  purchase: Purchase
  businessName: string
}

export const GoodsReceivedNote = forwardRef<HTMLDivElement, GoodsReceivedNoteProps>(
  ({ purchase, businessName }, ref) => {
    return (
      <div ref={ref} className="mx-auto w-[320px] bg-white p-5 text-xs text-black">
        <div className="mb-3 text-center">
          <p className="text-sm font-bold">{businessName}</p>
          <p className="mt-1 font-semibold">GOODS RECEIVED NOTE</p>
        </div>

        <div className="mb-2 space-y-0.5 border-t border-dashed border-black py-2">
          <p>GRN #: {purchase.id.slice(0, 8).toUpperCase()}</p>
          <p>Supplier: {purchase.supplierName ?? 'N/A'}</p>
          <p>Date received: {purchase.receivedAt ? new Date(purchase.receivedAt).toLocaleString('en-KE') : '—'}</p>
        </div>

        <table className="w-full border-t border-dashed border-black py-2 text-left">
          <thead>
            <tr>
              <th className="py-1">Item</th>
              <th className="py-1 text-right">Qty</th>
              <th className="py-1 text-right">Unit cost</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item) => (
              <tr key={item.productId}>
                <td className="py-0.5 pr-1">{item.name}</td>
                <td className="py-0.5 text-right">{item.quantity}</td>
                <td className="py-0.5 text-right">{formatKes(item.unitCost)}</td>
                <td className="py-0.5 text-right">{formatKes(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black py-2 text-right text-sm font-bold">
          Total: {formatKes(purchase.total)}
        </div>

        {purchase.notes && <p className="border-t border-dashed border-black pt-2">Notes: {purchase.notes}</p>}

        <div className="mt-6 grid grid-cols-2 gap-6 text-center text-[10px]">
          <div>
            <div className="border-t border-black pt-1">Received by</div>
          </div>
          <div>
            <div className="border-t border-black pt-1">Supplier signature</div>
          </div>
        </div>
      </div>
    )
  }
)
GoodsReceivedNote.displayName = 'GoodsReceivedNote'
