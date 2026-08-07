import { db } from './db'
import { supabase } from './supabase'

/**
 * Call this after any operation that can reduce a product's stock (a sale,
 * a purchase return, a stock take). If the product has a queued "next
 * price" and its stock has reached zero, the queued price becomes the
 * active price and the queue is cleared.
 */
export async function applyPendingPriceIfDepleted(productId: string): Promise<void> {
  const product = await db.products.get(productId)
  if (!product) return
  if (product.stock > 0) return
  if (product.pendingBuyingPrice == null && product.pendingSellingPrice == null) return

  const updates = {
    buyingPrice: product.pendingBuyingPrice ?? product.buyingPrice,
    sellingPrice: product.pendingSellingPrice ?? product.sellingPrice,
    pendingBuyingPrice: undefined,
    pendingSellingPrice: undefined,
    updatedAt: Date.now(),
    synced: false,
  }

  await db.products.update(productId, updates)

  if (navigator.onLine) {
    const { error } = await supabase
      .from('products')
      .update({
        buying_price: updates.buyingPrice,
        selling_price: updates.sellingPrice,
        pending_buying_price: null,
        pending_selling_price: null,
      })
      .eq('id', productId)
    if (!error) await db.products.update(productId, { synced: true })
  }
}
