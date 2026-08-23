import { db, type Product } from '@/lib/db'
import { safeBulkPut } from '@/lib/safeBulkPut'
import { supabase } from '@/lib/supabase'
import { toTitleCase } from '@/lib/utils'
import type { ProductFormValues } from '../types/product-schema'
import type { ImportRowToAdd } from '../lib/analyzeImport'

type SupabaseProductRow = {
  id: string
  barcode: string | null
  sku: string
  name: string
  brand: string | null
  category: string | null
  subcategory: string | null
  buying_price: number
  selling_price: number
  pending_buying_price: number | null
  pending_selling_price: number | null
  wholesale_price: number | null
  minimum_price: number | null
  stock: number
  minimum_stock: number
  maximum_stock: number | null
  expiry_date: string | null
  batch_number: string | null
  supplier_id: string | null
  image_url: string | null
  notes: string | null
  updated_at: string
}

function toSupabaseRow(product: Product): Omit<SupabaseProductRow, 'updated_at'> {
  return {
    id: product.id,
    barcode: product.barcode ?? null,
    sku: product.sku,
    name: product.name,
    brand: product.brand ?? null,
    category: product.category ?? null,
    subcategory: product.subcategory ?? null,
    buying_price: product.buyingPrice,
    selling_price: product.sellingPrice,
    pending_buying_price: product.pendingBuyingPrice ?? null,
    pending_selling_price: product.pendingSellingPrice ?? null,
    wholesale_price: product.wholesalePrice ?? null,
    minimum_price: product.minimumPrice ?? null,
    stock: product.stock,
    minimum_stock: product.minimumStock,
    maximum_stock: product.maximumStock ?? null,
    expiry_date: product.expiryDate ?? null,
    batch_number: product.batchNumber ?? null,
    supplier_id: product.supplierId ?? null,
    image_url: product.imageUrl ?? null,
    notes: product.notes ?? null,
  }
}

function fromSupabaseRow(row: SupabaseProductRow): Product {
  return {
    id: row.id,
    barcode: row.barcode ?? undefined,
    sku: row.sku,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    subcategory: row.subcategory ?? undefined,
    buyingPrice: row.buying_price,
    sellingPrice: row.selling_price,
    pendingBuyingPrice: row.pending_buying_price ?? undefined,
    pendingSellingPrice: row.pending_selling_price ?? undefined,
    wholesalePrice: row.wholesale_price ?? undefined,
    minimumPrice: row.minimum_price ?? undefined,
    stock: row.stock,
    minimumStock: row.minimum_stock,
    maximumStock: row.maximum_stock ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    batchNumber: row.batch_number ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

/** All products, newest first. Always reads from the local Dexie cache. */
export async function listProducts(): Promise<Product[]> {
  const all = await db.products.toArray()
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

/** Create or update a product locally, then try to push it to Supabase. */
export async function saveProduct(
  values: ProductFormValues,
  existingId?: string
): Promise<Product> {
  const existing = existingId ? await db.products.get(existingId) : undefined

  const product: Product = {
    id: existingId ?? crypto.randomUUID(),
    barcode: values.barcode || undefined,
    sku: values.sku,
    name: values.name.trim().toUpperCase(),
    brand: values.brand ? toTitleCase(values.brand) : undefined,
    category: values.category ? toTitleCase(values.category) : undefined,
    subcategory: values.subcategory ? toTitleCase(values.subcategory) : undefined,
    buyingPrice: values.buyingPrice,
    sellingPrice: values.sellingPrice,
    // Editing the product form doesn't touch a queued next price — that's
    // only set by receiving a purchase, and cleared automatically once
    // stock hits zero.
    pendingBuyingPrice: existing?.pendingBuyingPrice,
    pendingSellingPrice: existing?.pendingSellingPrice,
    wholesalePrice: values.wholesalePrice,
    minimumPrice: values.minimumPrice,
    stock: values.stock,
    minimumStock: values.minimumStock,
    maximumStock: values.maximumStock,
    expiryDate: values.expiryDate || undefined,
    batchNumber: values.batchNumber || undefined,
    supplierId: values.supplierId || undefined,
    imageUrl: values.imageUrl || undefined,
    notes: values.notes || undefined,
    updatedAt: Date.now(),
    synced: false,
  }

  await db.products.put(product)
  void pushProduct(product)
  return product
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id)
  if (navigator.onLine) {
    await supabase.from('products').delete().eq('id', id)
  }
}

/** Push a single product to Supabase and mark it synced on success. */
async function pushProduct(product: Product): Promise<void> {
  if (!navigator.onLine) return
  const { error } = await supabase.from('products').upsert(toSupabaseRow(product))
  if (!error) {
    await db.products.update(product.id, { synced: true })
  }
}

/**
 * Pushes a set of products in real network batches (one request per ~200
 * rows) rather than one request per product. Firing a request per item
 * is fine for a handful of records but overwhelms mobile connections —
 * and leaves some stuck failing forever — once there are dozens or more,
 * which is exactly what a big catalog import or a long stretch offline
 * can produce. A chunk that fails just stays unsynced and retries on the
 * next sync pass; nothing is lost.
 */
async function pushProductsBatch(products: Product[]): Promise<void> {
  if (products.length === 0 || !navigator.onLine) return
  const BATCH_SIZE = 200
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('products').upsert(batch.map(toSupabaseRow))
    if (!error) {
      await db.products.bulkUpdate(batch.map((p) => ({ key: p.id, changes: { synced: true } })))
    }
  }
}

/** Push every unsynced local product — call this on reconnect. */
export async function syncPendingProducts(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.products.filter((p) => !p.synced).toArray()
  await pushProductsBatch(pending)
}

/** Pull the latest products from Supabase into the local cache. */
export async function refreshProductsFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('products').select('*')
  if (error || !data) return
  const mapped = (data as SupabaseProductRow[]).map(fromSupabaseRow)
  await safeBulkPut(db.products, mapped)
}

/**
 * Creates brand-new products from a bulk import. This ONLY inserts rows
 * that analyzeImport already determined don't exist yet — it never
 * updates or touches any existing product's data, stock, or price.
 */
export async function bulkCreateProducts(rows: ImportRowToAdd[]): Promise<Product[]> {
  const now = Date.now()
  const created: Product[] = rows.map((row) => ({
    id: crypto.randomUUID(),
    barcode: row.barcode || undefined,
    sku: row.sku,
    name: toTitleCase(row.name).toUpperCase(),
    category: row.category ? toTitleCase(row.category) : undefined,
    buyingPrice: row.buyingPrice,
    sellingPrice: row.sellingPrice,
    wholesalePrice: row.wholesalePrice,
    stock: row.stock,
    minimumStock: row.minimumStock,
    updatedAt: now,
    synced: false,
  }))

  await db.products.bulkPut(created)
  await pushProductsBatch(created)
  return created
}
