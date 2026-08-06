import { useState } from 'react'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import type { Supplier } from '@/lib/db'
import type { SupplierFormValues } from '../api/suppliers-api'

interface SupplierFormProps {
  initialValues?: Supplier
  onSubmit: (values: SupplierFormValues) => void
  onCancel: () => void
  isSaving?: boolean
}

export function SupplierForm({ initialValues, onSubmit, onCancel, isSaving }: SupplierFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [address, setAddress] = useState(initialValues?.address ?? '')
  const [kraPin, setKraPin] = useState(initialValues?.kraPin ?? '')
  const [outstandingBalance, setOutstandingBalance] = useState(initialValues?.outstandingBalance ?? 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, phone, email, address, kraPin, outstandingBalance })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Supplier name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="Address">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="KRA PIN">
          <Input value={kraPin} onChange={(e) => setKraPin(e.target.value)} />
        </Field>
        <Field label="Outstanding balance (KES)">
          <Input
            type="number"
            step="0.01"
            value={outstandingBalance}
            onChange={(e) => setOutstandingBalance(Number(e.target.value) || 0)}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save supplier'}
        </Button>
      </div>
    </form>
  )
}
