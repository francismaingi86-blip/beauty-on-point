import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X, Camera, ImageIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useSettings, useSaveSettings } from './hooks/useSettings'
import { validateLogoFile, uploadLogo } from './api/upload-logo'
import type { AppSettings } from './api/settings-api'

export function SettingsPage() {
  const { data, isLoading } = useSettings()
  const saveSettings = useSaveSettings()
  const [form, setForm] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoCameraInputRef = useRef<HTMLInputElement>(null)
  const logoGalleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
    setSaved(false)
  }

  async function handleLogoFile(file: File | undefined) {
    if (!file) return
    const validationError = validateLogoFile(file)
    if (validationError) {
      setLogoError(validationError)
      return
    }
    if (!navigator.onLine) {
      setLogoError("You're offline — connect to the internet to upload a logo.")
      return
    }
    setLogoError(null)
    setLogoUploading(true)
    try {
      const url = await uploadLogo(file)
      update('logoUrl', url)
    } catch {
      setLogoError('Upload failed. Check your connection and try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    saveSettings.mutate(form, { onSuccess: () => setSaved(true) })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Company details that appear on receipts and around the app.
        </p>
      </div>

      {isLoading || !form ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Business information</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <span className="mb-1 block text-sm font-medium">Company logo</span>
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-brand-black-50 dark:bg-white/5">
                  {logoUploading ? (
                    <Loader2 size={20} className="animate-spin text-brand-pink-400" />
                  ) : form.logoUrl ? (
                    <img src={form.logoUrl} alt="Company logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImagePlus size={20} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleLogoFile(e.target.files?.[0])}
                  />
                  <input
                    ref={logoGalleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoFile(e.target.files?.[0])}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoCameraInputRef.current?.click()}
                      disabled={logoUploading}
                    >
                      <Camera size={14} /> Take photo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => logoGalleryInputRef.current?.click()}
                      disabled={logoUploading}
                    >
                      <ImageIcon size={14} /> Gallery
                    </Button>
                  </div>
                  {form.logoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => update('logoUrl', undefined)}>
                      <X size={14} /> Remove
                    </Button>
                  )}
                </div>
              </div>
              {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
            </div>

            <Field label="Business name" required className="col-span-2">
              <Input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} required />
            </Field>
            <Field label="Address" className="col-span-2">
              <Input value={form.address ?? ''} onChange={(e) => update('address', e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp ?? ''} onChange={(e) => update('whatsapp', e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ''} onChange={(e) => update('email', e.target.value)} />
            </Field>
            <Field label="Currency">
              <Input value={form.currency} onChange={(e) => update('currency', e.target.value)} />
            </Field>
            <Field label="Receipt header note" className="col-span-2">
              <Textarea rows={2} value={form.receiptHeader ?? ''} onChange={(e) => update('receiptHeader', e.target.value)} />
            </Field>
            <Field label="Receipt footer note" className="col-span-2">
              <Textarea
                rows={2}
                value={form.receiptFooter ?? ''}
                onChange={(e) => update('receiptFooter', e.target.value)}
                placeholder="Thank you for shopping with us!"
              />
            </Field>

            <div className="col-span-2 flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saveSettings.isPending}>
                {saveSettings.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              {saved && <span className="text-sm text-emerald-600">Saved</span>}
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

export default SettingsPage
