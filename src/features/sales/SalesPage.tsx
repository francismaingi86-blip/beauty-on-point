import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Search, Minus, Plus, Trash2, PauseCircle, Printer, Bluetooth, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SmartImage } from '@/components/shared/SmartImage'
import { formatKes } from '@/lib/utils'
import { useProducts } from '@/features/products/hooks/useProducts'
import { BarcodeScannerButton } from '@/features/products/components/BarcodeScannerButton'
import { useCartStore } from './hooks/useCartStore'
import { useCompleteSale, useHeldSales, useHoldSale, useDeleteHeldSale } from './hooks/useSales'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { Receipt } from './components/Receipt'
import { buildEscPosReceipt, printViaBluetooth, isBluetoothPrintSupported } from './api/bluetooth-print'
import type { Sale } from '@/lib/db'

const PAYMENT_METHODS: { value: Sale['paymentMethod']; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit', label: 'Credit' },
]

export function SalesPage() {
  const { data: products = [] } = useProducts()
  const { data: settings } = useSettings()
  const { items, discount, addItem, incrementItem, removeItem, setDiscount, clear } = useCartStore()
  const completeSale = useCompleteSale()
  const holdSale = useHoldSale()
  const deleteHeldSale = useDeleteHeldSale()
  const { data: heldSales = [] } = useHeldSales()

  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash')
  const [showHeld, setShowHeld] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [btPrinting, setBtPrinting] = useState(false)
  const bluetoothSupported = useMemo(() => isBluetoothPrintSupported(), [])

  const receiptRef = useRef<HTMLDivElement>(null)
  const printReceipt = useReactToPrint({ contentRef: receiptRef })

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products.slice(0, 12)
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      )
      .slice(0, 12)
  }, [products, search])

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const total = Math.max(subtotal - discount, 0)

  function handleAdd(product: (typeof products)[number]) {
    if (product.stock <= 0) return
    const added = addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.sellingPrice,
      unitCost: product.buyingPrice,
      stock: product.stock,
    })
    if (!added) {
      alert(`Only ${product.stock} in stock — you already have that many in the cart.`)
    }
  }

  function handleBarcodeScan(code: string) {
    const product = products.find((p) => p.barcode === code)
    if (product) {
      handleAdd(product)
    } else {
      alert(`No product found with barcode ${code}`)
    }
  }

  function handleHold() {
    if (items.length === 0) return
    holdSale.mutate({ items, discount })
    clear()
  }

  function handleResume(sale: Sale) {
    clear()
    for (const item of sale.items) {
      addItem({ productId: item.productId, name: item.name, unitPrice: item.unitPrice, unitCost: item.unitCost, stock: item.quantity })
      // bump quantity up to the held amount
      if (item.quantity > 1) {
        useCartStore.getState().incrementItem(item.productId, item.quantity - 1)
      }
    }
    setDiscount(sale.discount)
    deleteHeldSale.mutate(sale.id)
    setShowHeld(false)
  }

  function handleCompleteSale() {
    if (items.length === 0) return
    completeSale.mutate(
      { items, discount, paymentMethod },
      {
        onSuccess: (sale) => {
          setCompletedSale(sale)
          clear()
          setPaymentMethod('cash')
        },
      }
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h1 className="font-display text-2xl font-semibold">Sales</h1>
          <Button variant="outline" size="sm" onClick={() => setShowHeld(true)}>
            <PauseCircle size={15} /> Held sales ({heldSales.length})
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, SKU, or barcode…"
              className="focus-ring w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] py-2 pl-9 pr-4 text-sm"
            />
          </div>
          <BarcodeScannerButton onScan={handleBarcodeScan} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAdd(product)}
              disabled={product.stock <= 0}
              className="card-surface flex flex-col items-start gap-1 p-3 text-left transition-colors hover:bg-brand-pink-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
            >
              <div className="mb-1 flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-brand-black-50 dark:bg-white/5">
                {product.imageUrl ? (
                  <SmartImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">No photo</span>
                )}
              </div>
              <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
              <p className="text-sm font-semibold text-brand-pink-600">{formatKes(product.sellingPrice)}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {product.stock <= 0 ? 'Out of stock' : `${product.stock} in stock`}
              </p>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-[var(--text-muted)]">
              No products match your search.
            </p>
          )}
        </div>
      </div>

      <Card className="flex h-fit flex-col gap-4 lg:sticky lg:top-20">
        <h2 className="font-display text-lg font-semibold">Current sale</h2>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Tap a product to add it here.</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatKes(item.unitPrice)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => incrementItem(item.productId, -1)}>
                    <Minus size={12} />
                  </Button>
                  <span className="w-5 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const product = products.find((p) => p.id === item.productId)
                      const ok = incrementItem(item.productId, 1, product?.stock)
                      if (!ok) alert(`Only ${product?.stock ?? 0} in stock.`)
                    }}
                  >
                    <Plus size={12} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.productId)}>
                    <Trash2 size={13} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span>{formatKes(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-muted)]">Discount (KES)</span>
            <input
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="focus-ring w-24 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-right text-sm"
            />
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-brand-pink-600">{formatKes(total)}</span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Payment method</p>
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPaymentMethod(m.value)}
                className={`focus-ring rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                  paymentMethod === m.value
                    ? 'border-brand-pink-500 bg-brand-pink-500 text-white'
                    : 'border-[var(--border-subtle)] hover:bg-brand-pink-50 dark:hover:bg-white/5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleHold} disabled={items.length === 0}>
            <PauseCircle size={15} /> Hold
          </Button>
          <Button className="flex-1" onClick={handleCompleteSale} disabled={items.length === 0 || completeSale.isPending}>
            {completeSale.isPending ? 'Processing…' : 'Complete sale'}
          </Button>
        </div>
      </Card>

      {/* Held sales panel */}
      {showHeld && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button className="absolute inset-0 bg-black/20" onClick={() => setShowHeld(false)} aria-label="Close" />
          <div className="relative flex h-full w-full max-w-sm flex-col bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <h2 className="font-display text-lg font-semibold">Held sales</h2>
              <button onClick={() => setShowHeld(false)} className="focus-ring rounded-full p-1.5 hover:bg-brand-pink-50 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {heldSales.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No held sales right now.</p>
              )}
              {heldSales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => handleResume(sale)}
                  className="card-surface w-full p-3 text-left hover:bg-brand-pink-50 dark:hover:bg-white/5"
                >
                  <p className="text-sm font-semibold">{formatKes(sale.total)} · {sale.items.length} item(s)</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(sale.createdAt).toLocaleString('en-KE')}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Post-sale receipt */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-surface max-h-[85vh] w-full max-w-sm overflow-y-auto p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Sale complete</h2>
              <button onClick={() => setCompletedSale(null)} className="focus-ring rounded-full p-1.5 hover:bg-brand-pink-50 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            <Receipt
              ref={receiptRef}
              sale={completedSale}
              businessName={settings?.businessName ?? 'Beauty on Point'}
              address={settings?.address}
              phone={settings?.phone}
              footer={settings?.receiptFooter}
            />
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCompletedSale(null)}>
                  Close
                </Button>
                <Button className="flex-1" onClick={() => printReceipt()}>
                  <Printer size={15} /> Print
                </Button>
              </div>
              {bluetoothSupported && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={btPrinting}
                  onClick={async () => {
                    setBtPrinting(true)
                    try {
                      const bytes = buildEscPosReceipt(completedSale, {
                        name: settings?.businessName ?? 'Beauty on Point',
                        address: settings?.address,
                        phone: settings?.phone,
                        footer: settings?.receiptFooter,
                      })
                      await printViaBluetooth(bytes)
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Bluetooth printing failed.')
                    } finally {
                      setBtPrinting(false)
                    }
                  }}
                >
                  <Bluetooth size={15} /> {btPrinting ? 'Connecting…' : 'Print via Bluetooth'}
                </Button>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
              Tip: if you use a Bluetooth receipt printer through an app like RawBT, the regular
              "Print" button above works too, and is often more reliable.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesPage
