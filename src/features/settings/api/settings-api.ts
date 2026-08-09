import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'

export interface AppSettings {
  businessName: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  currency: string
  receiptHeader?: string
  receiptFooter?: string
  logoUrl?: string
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Beauty on Point',
  currency: 'KES',
}

async function readCache(): Promise<AppSettings | null> {
  const cached = await db.appSettings.get('singleton')
  if (!cached) return null
  const { id: _id, updatedAt: _updatedAt, ...settings } = cached
  return settings
}

async function writeCache(settings: AppSettings): Promise<void> {
  await db.appSettings.put({ id: 'singleton', ...settings, updatedAt: Date.now() })
}

/**
 * Always tries the server first (settings can be edited from another
 * device), but falls back to the last-known-good local cache if offline
 * — rather than silently resetting to generic defaults, which would be
 * confusing on a receipt or anywhere else the business name shows up.
 */
export async function getSettings(): Promise<AppSettings> {
  if (navigator.onLine) {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (!error && data) {
      const settings: AppSettings = {
        businessName: data.business_name,
        address: data.address ?? undefined,
        phone: data.phone ?? undefined,
        whatsapp: data.whatsapp ?? undefined,
        email: data.email ?? undefined,
        currency: data.currency,
        receiptHeader: data.receipt_header ?? undefined,
        receiptFooter: data.receipt_footer ?? undefined,
        logoUrl: data.logo_url ?? undefined,
      }
      void writeCache(settings)
      return settings
    }
  }

  const cached = await readCache()
  return cached ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  // Cache immediately so the rest of the app (receipts, etc.) reflects the
  // change right away even if the network write below is slow or offline.
  await writeCache(settings)

  if (!navigator.onLine) {
    throw new Error("You're offline — settings will need to be saved again once you're back online.")
  }

  const { error } = await supabase
    .from('app_settings')
    .update({
      business_name: settings.businessName,
      address: settings.address,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      currency: settings.currency,
      receipt_header: settings.receiptHeader,
      receipt_footer: settings.receiptFooter,
      logo_url: settings.logoUrl,
    })
    .eq('id', 1)

  if (error) throw error
}
