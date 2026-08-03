import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SaleItem } from '@/lib/db'

interface CartState {
  items: SaleItem[]
  discount: number
  customerId?: string
  /** Returns false if the item is already at (or above) available stock. */
  addItem: (item: { productId: string; name: string; unitPrice: number; stock: number }) => boolean
  /** Returns false if incrementing would exceed maxStock. */
  incrementItem: (productId: string, delta: number, maxStock?: number) => boolean
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
          if (existing.quantity >= stock) return false
          const nextQty = existing.quantity + 1
          set({
            items: items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: nextQty, total: nextQty * i.unitPrice }
                : i
            ),
          })
          return true
        }

        if (stock <= 0) return false
        set({ items: [...items, { productId, name, quantity: 1, unitPrice, total: unitPrice }] })
        return true
      },

      incrementItem: (productId, delta, maxStock) => {
        const items = get().items
        const existing = items.find((i) => i.productId === productId)
        if (!existing) return false

        const proposedQty = existing.quantity + delta
        if (delta > 0 && maxStock !== undefined && proposedQty > maxStock) {
          return false
        }

        const nextQty = Math.max(1, proposedQty)
        set({
          items: items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: nextQty, total: nextQty * i.unitPrice }
              : i
          ),
        })
        return true
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
