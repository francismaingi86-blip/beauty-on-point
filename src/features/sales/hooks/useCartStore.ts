import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SaleItem } from '@/lib/db'

interface CartState {
  items: SaleItem[]
  discount: number
  customerId?: string
  addItem: (item: { productId: string; name: string; unitPrice: number; stock: number }) => void
  incrementItem: (productId: string, delta: number) => void
  removeItem: (productId: string) => void
  setDiscount: (discount: number) => void
  setCustomerId: (customerId: string | undefined) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      customerId: undefined,

      addItem: ({ productId, name, unitPrice, stock }) => {
        const items = get().items
        const existing = items.find((i) => i.productId === productId)
        if (existing) {
          const nextQty = Math.min(existing.quantity + 1, Math.max(stock, existing.quantity + 1))
          set({
            items: items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: nextQty, total: nextQty * i.unitPrice }
                : i
            ),
          })
        } else {
          set({ items: [...items, { productId, name, quantity: 1, unitPrice, total: unitPrice }] })
        }
      },

      incrementItem: (productId, delta) => {
        set({
          items: get()
            .items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(1, i.quantity + delta), total: Math.max(1, i.quantity + delta) * i.unitPrice }
                : i
            )
            .filter((i) => i.quantity > 0),
        })
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },

      setDiscount: (discount) => set({ discount }),
      setCustomerId: (customerId) => set({ customerId }),

      clear: () => set({ items: [], discount: 0, customerId: undefined }),
    }),
    { name: 'bop-cart' }
  )
)
