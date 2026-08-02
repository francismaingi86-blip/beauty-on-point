import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ProductForm } from './components/ProductForm'
import { ProductTable } from './components/ProductTable'
import { useProducts, useSaveProduct, useDeleteProduct } from './hooks/useProducts'
import type { Product } from '@/lib/db'
import type { ProductFormValues } from './types/product-schema'

export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts()
  const saveProduct = useSaveProduct()
  const deleteProduct = useDeleteProduct()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    )
  }, [products, search])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setDialogOpen(true)
  }

  function handleSubmit(values: ProductFormValues, id: string) {
    saveProduct.mutate(
      { values, id },
      { onSuccess: () => setDialogOpen(false) }
    )
  }

  function handleDelete(product: Product) {
    if (confirm(`Remove "${product.name}"? This can't be undone.`)) {
      deleteProduct.mutate(product.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {products.length} product{products.length === 1 ? '' : 's'} in your catalog
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, barcode, category…"
          className="focus-ring w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] py-2 pl-9 pr-4 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading products…</p>
      ) : (
        <ProductTable products={filtered} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit product' : 'Add product'}
      >
        <ProductForm
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          isSaving={saveProduct.isPending}
        />
      </Dialog>
    </div>
  )
}

export default ProductsPage
