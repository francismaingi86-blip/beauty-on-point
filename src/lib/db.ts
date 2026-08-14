import Dexie, { type Table } from 'dexie'

/**
 * Offline-first local database (IndexedDB via Dexie).
 * Every table mirrors a Supabase table and carries a `synced` flag plus
 * `updatedAt` so the sync engine can reconcile local edits made while offline.
 */

export interface Product {
  id: string
  barcode?: string
  sku: string
  name: string
  brand?: string
  category?: string
  subcategory?: string
  buyingPrice: number
  sellingPrice: number
  /** Queued price that takes effect automatically once stock hits zero —
   * used when new stock arrives at a different cost while old stock remains. */
  pendingBuyingPrice?: number
  pendingSellingPrice?: number
  wholesalePrice?: number
  minimumPrice?: number
  stock: number
  minimumStock: number
  maximumStock?: number
  expiryDate?: string
  batchNumber?: string
  supplierId?: string
  imageUrl?: string
  notes?: string
  updatedAt: number
  synced: boolean
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  creditLimit: number
  currentBalance: number
  loyaltyPoints: number
  updatedAt: number
  synced: boolean
}

export interface Supplier {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  kraPin?: string
  outstandingBalance: number
  updatedAt: number
  synced: boolean
}

export interface Sale {
  id: string
  customerId?: string
  staffId?: string
  staffName?: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'bank' | 'credit' | 'split'
  status: 'held' | 'completed' | 'returned'
  createdAt: number
  updatedAt: number
  synced: boolean
}

export interface SaleItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  unitCost: number
  total: number
}

export interface Expense {
  id: string
  category: string
  amount: number
  note?: string
  receiptUrl?: string
  incurredAt: number
  updatedAt: number
  synced: boolean
}

export interface PurchaseItem {
  productId: string
  name: string
  quantity: number
  unitCost: number
  total: number
}

export interface Purchase {
  id: string
  supplierId?: string
  supplierName?: string
  items: PurchaseItem[]
  total: number
  status: 'draft' | 'ordered' | 'received' | 'cancelled'
  notes?: string
  orderedAt?: number
  receivedAt?: number
  createdAt: number
  updatedAt: number
  synced: boolean
}

export interface StockTakeItem {
  productId: string
  name: string
  systemStock: number
  countedStock: number
  variance: number
}

export interface StockTake {
  id: string
  items: StockTakeItem[]
  status: 'draft' | 'completed'
  notes?: string
  staffId?: string
  staffName?: string
  createdAt: number
  updatedAt: number
  synced: boolean
}

export interface CreditNoteItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface CreditNote {
  id: string
  customerId?: string
  customerName?: string
  saleId?: string
  items: CreditNoteItem[]
  total: number
  reason?: string
  staffId?: string
  staffName?: string
  createdAt: number
  updatedAt: number
  synced: boolean
}

export interface PurchaseReturnItem {
  productId: string
  name: string
  quantity: number
  unitCost: number
  total: number
}

export interface PurchaseReturn {
  id: string
  supplierId?: string
  supplierName?: string
  purchaseId?: string
  items: PurchaseReturnItem[]
  total: number
  reason?: string
  staffId?: string
  staffName?: string
  createdAt: number
  updatedAt: number
  synced: boolean
}

export interface CachedAppSettings {
  id: 'singleton'
  businessName: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  currency: string
  receiptHeader?: string
  receiptFooter?: string
  logoUrl?: string
  updatedAt: number
}

export interface CachedAuthIdentity {
  id: 'singleton'
  userId: string
  name: string
  email: string
  role: string
  cachedAt: number
}

class AppDatabase extends Dexie {
  products!: Table<Product, string>
  customers!: Table<Customer, string>
  suppliers!: Table<Supplier, string>
  sales!: Table<Sale, string>
  expenses!: Table<Expense, string>
  purchases!: Table<Purchase, string>
  stockTakes!: Table<StockTake, string>
  creditNotes!: Table<CreditNote, string>
  purchaseReturns!: Table<PurchaseReturn, string>
  appSettings!: Table<CachedAppSettings, string>
  authCache!: Table<CachedAuthIdentity, string>

  constructor() {
    super('beauty-on-point-db')
    this.version(1).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
    })
    this.version(2).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
      purchases: 'id, supplierId, status, createdAt, synced, updatedAt',
    })
    this.version(3).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
      purchases: 'id, supplierId, status, createdAt, synced, updatedAt',
      stockTakes: 'id, status, createdAt, synced, updatedAt',
    })
    this.version(4).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
      purchases: 'id, supplierId, status, createdAt, synced, updatedAt',
      stockTakes: 'id, status, createdAt, synced, updatedAt',
      creditNotes: 'id, customerId, createdAt, synced, updatedAt',
      purchaseReturns: 'id, supplierId, purchaseId, createdAt, synced, updatedAt',
    })
    this.version(5).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
      purchases: 'id, supplierId, status, createdAt, synced, updatedAt',
      stockTakes: 'id, status, createdAt, synced, updatedAt',
      creditNotes: 'id, customerId, createdAt, synced, updatedAt',
      purchaseReturns: 'id, supplierId, purchaseId, createdAt, synced, updatedAt',
      appSettings: 'id',
    })
    this.version(6).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
      purchases: 'id, supplierId, status, createdAt, synced, updatedAt',
      stockTakes: 'id, status, createdAt, synced, updatedAt',
      creditNotes: 'id, customerId, createdAt, synced, updatedAt',
      purchaseReturns: 'id, supplierId, purchaseId, createdAt, synced, updatedAt',
      appSettings: 'id',
      authCache: 'id',
    })
  }
}

export const db = new AppDatabase()
