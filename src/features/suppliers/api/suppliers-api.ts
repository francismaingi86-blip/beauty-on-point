import { db, type Supplier } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type SupabaseSupplierRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  kra_pin: string | null
  outstanding_balance: number
  updated_at: string
}

function toSupabaseRow(s: Supplier): Omit<SupabaseSupplierRow, 'updated_at'> {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone ?? null,
    email: s.email ?? null,
    address: s.address ?? null,
    kra_pin: s.kraPin ?? null,
    outstanding_balance: s.outstandingBalance,
  }
}

function fromSupabaseRow(row: SupabaseSupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    kraPin: row.kra_pin ?? undefined,
    outstandingBalance: row.outstanding_balance,
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

export async function listSuppliers(): Promise<Supplier[]> {
  const all = await db.suppliers.toArray()
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export interface SupplierFormValues {
  name: string
  phone?: string
  email?: string
  address?: string
  kraPin?: string
  outstandingBalance: number
}

export async function saveSupplier(values: SupplierFormValues, existingId?: string): Promise<Supplier> {
  const supplier: Supplier = {
    id: existingId ?? crypto.randomUUID(),
    name: values.name,
    phone: values.phone || undefined,
    email: values.email || undefined,
    address: values.address || undefined,
    kraPin: values.kraPin || undefined,
    outstandingBalance: values.outstandingBalance,
    updatedAt: Date.now(),
    synced: false,
  }
  await db.suppliers.put(supplier)
  void pushSupplier(supplier)
  return supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  await db.suppliers.delete(id)
  if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id)
}

async function pushSupplier(supplier: Supplier): Promise<void> {
  if (!navigator.onLine) return
  const { error } = await supabase.from('suppliers').upsert(toSupabaseRow(supplier))
  if (!error) await db.suppliers.update(supplier.id, { synced: true })
}

export async function syncPendingSuppliers(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.suppliers.filter((s) => !s.synced).toArray()
  await Promise.all(pending.map(pushSupplier))
}

export async function refreshSuppliersFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('suppliers').select('*')
  if (error || !data) return
  await db.suppliers.bulkPut((data as SupabaseSupplierRow[]).map(fromSupabaseRow))
}
