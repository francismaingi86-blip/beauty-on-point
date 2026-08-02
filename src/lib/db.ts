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

class AppDatabase extends Dexie {
  products!: Table<Product, string>
  customers!: Table<Customer, string>
  suppliers!: Table<Supplier, string>
  sales!: Table<Sale, string>
  expenses!: Table<Expense, string>

  constructor() {
    super('beauty-on-point-db')
    this.version(1).stores({
      products: 'id, barcode, sku, name, category, synced, updatedAt',
      customers: 'id, name, phone, synced, updatedAt',
      suppliers: 'id, name, synced, updatedAt',
      sales: 'id, customerId, status, createdAt, synced, updatedAt',
      expenses: 'id, category, incurredAt, synced, updatedAt',
    })
  }
}

export const db = new AppDatabase()
