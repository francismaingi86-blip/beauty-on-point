import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Pencil, Trash2, CloudOff, ZoomIn } from 'lucide-react'
import type { Product } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { FreshnessBar } from '@/components/shared/FreshnessBar'
import { ImageLightbox } from '@/components/shared/ImageLightbox'
import { formatKes } from '@/lib/utils'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

const columnHelper = createColumnHelper<Product>()

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null)

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'image',
        header: '',
        cell: ({ row }) => {
          const p = row.original
          return (
            <button
              type="button"
              onClick={() => p.imageUrl && setLightboxProduct(p)}
              disabled={!p.imageUrl}
              className="focus-ring group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-black-50 dark:bg-white/5"
              aria-label={p.imageUrl ? `View photo of ${p.name}` : undefined}
            >
              {p.imageUrl ? (
                <>
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    <ZoomIn size={18} className="text-white" />
                  </span>
                </>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">No photo</span>
              )}
            </button>
          )
        },
      }),
      columnHelper.accessor('name', {
        header: 'Product',
        cell: (info) => {
          const product = info.row.original
          return (
            <div>
              <p className="font-medium">{info.getValue()}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {product.sku}
                {product.category ? ` · ${product.category}` : ''}
              </p>
            </div>
          )
        },
      }),
      columnHelper.accessor('sellingPrice', {
        header: 'Price',
        cell: (info) => {
          const product = info.row.original
          return (
            <div>
              <p>{formatKes(info.getValue())}</p>
              {product.pendingSellingPrice != null && (
                <p className="text-xs text-brand-gold-600" title="Applies automatically once current stock sells out">
                  Next: {formatKes(product.pendingSellingPrice)}
                </p>
              )}
            </div>
          )
        },
      }),
      columnHelper.display({
        id: 'stock',
        header: 'Stock health',
        cell: ({ row }) => {
          const p = row.original
          return (
            <FreshnessBar
              stock={p.stock}
              minimumStock={p.minimumStock}
              maximumStock={p.maximumStock}
              expiryDate={p.expiryDate}
            />
          )
        },
      }),
      columnHelper.accessor('stock', {
        id: 'stockCount',
        header: 'Qty',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'synced',
        header: '',
        cell: ({ row }) =>
          !row.original.synced ? (
            <span title="Not yet synced to the cloud">
              <CloudOff size={14} className="text-brand-gold-500" />
            </span>
          ) : null,
      }),
    ],
    []
  )

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (products.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center gap-2 py-16 text-center">
        <p className="font-medium">No products yet</p>
        <p className="max-w-xs text-sm text-[var(--text-muted)]">
          Add your first product to start tracking stock and sales.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="card-surface overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border-subtle)]">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium text-[var(--text-muted)]">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-brand-pink-50/50 dark:hover:bg-white/[0.03]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(row.original)}>
                      <Pencil size={15} />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => onDelete(row.original)}>
                      <Trash2 size={15} className="text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lightboxProduct?.imageUrl && (
        <ImageLightbox
          src={lightboxProduct.imageUrl}
          alt={lightboxProduct.name}
          onClose={() => setLightboxProduct(null)}
        />
      )}
    </>
  )
}
