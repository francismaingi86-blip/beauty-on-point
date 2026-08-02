import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { useSettings, useSaveSettings } from './hooks/useSettings'
import type { AppSettings } from './api/settings-api'

export function SettingsPage() {
  const { data, isLoading } = useSettings()
  const saveSettings = useSaveSettings()
  const [form, setForm] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
    setSaved(false)
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
