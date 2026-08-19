import { forwardRef } from 'react'
import type { Product } from '@/lib/db'
import { formatKes } from '@/lib/utils'

interface InventoryReportProps {
  products: Product[]
  businessName: string
  showCostPrices: boolean
}

export const InventoryReport = forwardRef<HTMLDivElement, InventoryReportProps>(
  ({ products, businessName, showCostPrices }, ref) => {
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)
    const totalCostValue = products.reduce((sum, p) => sum + p.stock * p.buyingPrice, 0)
    const totalRetailValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0)

    return (
      <div ref={ref} className="w-full bg-white p-6 text-black">
        <div className="mb-4 text-center">
          <p className="text-lg font-bold">{businessName}</p>
          <p className="text-sm font-semibold">INVENTORY REPORT</p>
          <p className="text-xs text-gray-600">
            Generated {new Date().toLocaleString('en-KE')} · {products.length} products
          </p>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-1.5 pr-2 text-left">Product</th>
              <th className="py-1.5 pr-2 text-left">SKU</th>
              <th className="py-1.5 pr-2 text-left">Category</th>
              <th className="py-1.5 pr-2 text-right">Stock</th>
              {showCostPrices && <th className="py-1.5 pr-2 text-right">Buying</th>}
              <th className="py-1.5 pr-2 text-right">Selling</th>
              {showCostPrices && <th className="py-1.5 text-right">Stock value</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-300">
                <td className="py-1 pr-2">{p.name}</td>
                <td className="py-1 pr-2 text-gray-600">{p.sku}</td>
                <td className="py-1 pr-2 text-gray-600">{p.category ?? '—'}</td>
                <td className="py-1 pr-2 text-right">{p.stock}</td>
                {showCostPrices && <td className="py-1 pr-2 text-right">{formatKes(p.buyingPrice)}</td>}
                <td className="py-1 pr-2 text-right">{formatKes(p.sellingPrice)}</td>
                {showCostPrices && (
                  <td className="py-1 text-right">{formatKes(p.stock * p.buyingPrice)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end border-t-2 border-black pt-2 text-xs">
          <div className="space-y-1 text-right">
            <p>
              Total units in stock: <span className="font-semibold">{totalUnits}</span>
            </p>
            {showCostPrices && (
              <p>
                Total stock value (at cost): <span className="font-semibold">{formatKes(totalCostValue)}</span>
              </p>
            )}
            {showCostPrices && (
              <p>
                Total stock value (at retail): <span className="font-semibold">{formatKes(totalRetailValue)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }
)
InventoryReport.displayName = 'InventoryReport'
