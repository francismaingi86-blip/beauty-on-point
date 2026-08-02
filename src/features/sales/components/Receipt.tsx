import { forwardRef } from 'react'
import type { Sale } from '@/lib/db'
import { formatKes } from '@/lib/utils'

interface ReceiptProps {
  sale: Sale
  businessName: string
  address?: string
  phone?: string
  footer?: string
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, businessName, address, phone, footer }, ref) => {
    return (
      <div ref={ref} className="mx-auto w-[280px] bg-white p-4 font-mono text-xs text-black">
        <div className="mb-2 text-center">
          <p className="text-sm font-bold">{businessName}</p>
          {address && <p>{address}</p>}
          {phone && <p>{phone}</p>}
        </div>
        <div className="border-t border-dashed border-black py-1">
          <p>{new Date(sale.createdAt).toLocaleString('en-KE')}</p>
          <p>Receipt #{sale.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="border-t border-dashed border-black py-1">
          {sale.items.map((item) => (
            <div key={item.productId} className="flex justify-between">
              <span className="truncate pr-2">
                {item.name} x{item.quantity}
              </span>
              <span>{formatKes(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-black py-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatKes(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatKes(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{formatKes(sale.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment</span>
            <span className="capitalize">{sale.paymentMethod}</span>
          </div>
        </div>
        {footer && <p className="border-t border-dashed border-black pt-1 text-center">{footer}</p>}
      </div>
    )
  }
)
Receipt.displayName = 'Receipt'
