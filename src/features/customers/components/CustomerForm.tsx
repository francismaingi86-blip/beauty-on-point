import { useState } from 'react'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/lib/db'
import type { CustomerFormValues } from '../api/customers-api'

interface CustomerFormProps {
  initialValues?: Customer
  onSubmit: (values: CustomerFormValues) => void
  onCancel: () => void
  isSaving?: boolean
}

export function CustomerForm({ initialValues, onSubmit, onCancel, isSaving }: CustomerFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [address, setAddress] = useState(initialValues?.address ?? '')
  const [creditLimit, setCreditLimit] = useState(initialValues?.creditLimit ?? 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, phone, email, address, creditLimit })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Customer name" required>
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
      <Field label="Credit limit (KES)">
        <Input
          type="number"
          step="0.01"
          value={creditLimit}
          onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save customer'}
        </Button>
      </div>
    </form>
  )
}
