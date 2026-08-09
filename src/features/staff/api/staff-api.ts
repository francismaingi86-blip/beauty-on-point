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
  if (!navigator.onLine) {
    throw new Error("You're offline — staff accounts need an internet connection to view.")
  }
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
  if (!navigator.onLine) {
    throw new Error("You're offline — adding staff needs an internet connection.")
  }

  const { data, error } = await supabase.functions.invoke('create-staff', { body: input })

  if (error) {
    // supabase-js wraps non-2xx responses in a generic error message like
    // "Edge Function returned a non-2xx status code" — the actual reason
    // (e.g. "email already registered") is in the response body itself.
    let message = error.message
    const context = (error as { context?: Response }).context
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json()
        if (body?.error) message = body.error
      } catch {
        // couldn't parse the body — fall back to the generic message
      }
    }
    throw new Error(message)
  }

  if (data?.error) throw new Error(data.error)
}

export async function updateStaffRole(id: string, role: StaffRole): Promise<void> {
  if (!navigator.onLine) {
    throw new Error("You're offline — this needs an internet connection.")
  }
  const { error } = await supabase.from('staff').update({ role }).eq('id', id)
  if (error) throw error
}

export async function updateStaffName(id: string, name: string): Promise<void> {
  if (!navigator.onLine) {
    throw new Error("You're offline — this needs an internet connection.")
  }
  const { error } = await supabase.from('staff').update({ name }).eq('id', id)
  if (error) throw error
}

export async function removeStaff(id: string): Promise<void> {
  if (!navigator.onLine) {
    throw new Error("You're offline — this needs an internet connection.")
  }
  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) throw error
}
