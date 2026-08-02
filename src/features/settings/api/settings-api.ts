import { supabase } from '@/lib/supabase'

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

export async function getSettings(): Promise<AppSettings> {
  if (!navigator.onLine) return DEFAULT_SETTINGS
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
  if (error || !data) return DEFAULT_SETTINGS
  return {
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
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await supabase
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
}
