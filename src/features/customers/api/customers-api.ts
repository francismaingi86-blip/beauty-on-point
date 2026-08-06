import { db, type Customer } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type SupabaseCustomerRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  credit_limit: number
  current_balance: number
  loyalty_points: number
  updated_at: string
}

function toSupabaseRow(c: Customer): Omit<SupabaseCustomerRow, 'updated_at'> {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    credit_limit: c.creditLimit,
    current_balance: c.currentBalance,
    loyalty_points: c.loyaltyPoints,
  }
}

function fromSupabaseRow(row: SupabaseCustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    creditLimit: row.credit_limit,
    currentBalance: row.current_balance,
    loyaltyPoints: row.loyalty_points,
    updatedAt: new Date(row.updated_at).getTime(),
    synced: true,
  }
}

export async function listCustomers(): Promise<Customer[]> {
  const all = await db.customers.toArray()
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export interface CustomerFormValues {
  name: string
  phone?: string
  email?: string
  address?: string
  creditLimit: number
}

export async function saveCustomer(values: CustomerFormValues, existingId?: string): Promise<Customer> {
  const existing = existingId ? await db.customers.get(existingId) : undefined
  const customer: Customer = {
    id: existingId ?? crypto.randomUUID(),
    name: values.name,
    phone: values.phone || undefined,
    email: values.email || undefined,
    address: values.address || undefined,
    creditLimit: values.creditLimit,
    currentBalance: existing?.currentBalance ?? 0,
    loyaltyPoints: existing?.loyaltyPoints ?? 0,
    updatedAt: Date.now(),
    synced: false,
  }
  await db.customers.put(customer)
  void pushCustomer(customer)
  return customer
}

export async function deleteCustomer(id: string): Promise<void> {
  await db.customers.delete(id)
  if (navigator.onLine) await supabase.from('customers').delete().eq('id', id)
}

async function pushCustomer(customer: Customer): Promise<void> {
  if (!navigator.onLine) return
  const { error } = await supabase.from('customers').upsert(toSupabaseRow(customer))
  if (!error) await db.customers.update(customer.id, { synced: true })
}

export async function syncPendingCustomers(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.customers.filter((c) => !c.synced).toArray()
  await Promise.all(pending.map(pushCustomer))
}

export async function refreshCustomersFromServer(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('customers').select('*')
  if (error || !data) return
  await db.customers.bulkPut((data as SupabaseCustomerRow[]).map(fromSupabaseRow))
}
