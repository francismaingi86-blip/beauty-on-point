import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Pencil, Trash2, CloudOff } from 'lucide-react'
import type { Product } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { FreshnessBar } from '@/components/shared/FreshnessBar'
import { formatKes } from '@/lib/utils'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

const columnHelper = createColumnHelper<Product>()

const columns = [
  columnHelper.display({
    id: 'image',
    header: '',
    cell: ({ row }) => {
      const p = row.original
      return (
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-brand-black-50 dark:bg-white/5">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-[var(--text-muted)]">—</span>
          )}
        </div>
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
    cell: (info) => formatKes(info.getValue()),
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
]

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
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
  )
}
