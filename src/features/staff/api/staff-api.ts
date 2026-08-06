import { supabase } from '@/lib/supabase'
import type { StaffRole } from '@/stores/useAuthStore'

export interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  createdAt: string
}

export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }))
}

export interface CreateStaffInput {
  name: string
  email: string
  password: string
  role: StaffRole
}

/** Calls the create-staff edge function — the only way a new login gets created. */
export async function createStaff(input: CreateStaffInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-staff', { body: input })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
}

export async function updateStaffRole(id: string, role: StaffRole): Promise<void> {
  const { error } = await supabase.from('staff').update({ role }).eq('id', id)
  if (error) throw error
}

export async function updateStaffName(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('staff').update({ name }).eq('id', id)
  if (error) throw error
}

export async function removeStaff(id: string): Promise<void> {
  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) throw error
}
