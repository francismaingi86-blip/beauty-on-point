import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormValues } from '../types/product-schema'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { BarcodeScannerButton } from './BarcodeScannerButton'
import { ImageUploadField } from './ImageUploadField'
import type { Product } from '@/lib/db'

interface ProductFormProps {
  initialValues?: Product
  onSubmit: (values: ProductFormValues, id: string) => void
  onCancel: () => void
  isSaving?: boolean
}

export function ProductForm({ initialValues, onSubmit, onCancel, isSaving }: ProductFormProps) {
  const [productId] = useState(() => initialValues?.id ?? crypto.randomUUID())
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues
      ? {
          barcode: initialValues.barcode,
          sku: initialValues.sku,
          name: initialValues.name,
          brand: initialValues.brand,
          category: initialValues.category,
          subcategory: initialValues.subcategory,
          buyingPrice: initialValues.buyingPrice,
          sellingPrice: initialValues.sellingPrice,
          wholesalePrice: initialValues.wholesalePrice,
          minimumPrice: initialValues.minimumPrice,
          stock: initialValues.stock,
          minimumStock: initialValues.minimumStock,
          maximumStock: initialValues.maximumStock,
          expiryDate: initialValues.expiryDate,
          batchNumber: initialValues.batchNumber,
          imageUrl: initialValues.imageUrl,
          notes: initialValues.notes,
        }
      : { stock: 0, minimumStock: 0, buyingPrice: 0, sellingPrice: 0 },
  })

  const barcode = watch('barcode')
  const imageUrl = watch('imageUrl')

  function submit(values: ProductFormValues) {
    onSubmit(values, productId)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <ImageUploadField
        productId={productId}
        value={imageUrl}
        onChange={(url) => setValue('imageUrl', url)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Product name" required error={errors.name?.message} className="col-span-2">
          <Input {...register('name')} placeholder="Matte Lip Kit — Rose Nude" />
        </Field>

        <Field label="SKU" required error={errors.sku?.message}>
          <Input {...register('sku')} placeholder="LIP-0142" />
        </Field>

        <Field label="Barcode" error={errors.barcode?.message}>
          <div className="flex gap-2">
            <Input {...register('barcode')} placeholder="Scan or type" value={barcode ?? ''} onChange={(e) => setValue('barcode', e.target.value)} />
            <BarcodeScannerButton onScan={(code) => setValue('barcode', code)} />
          </div>
        </Field>

        <Field label="Brand" error={errors.brand?.message}>
          <Input {...register('brand')} />
        </Field>

        <Field label="Category" error={errors.category?.message}>
          <Input {...register('category')} placeholder="Lips, Skincare, Makeup…" />
        </Field>

        <Field label="Buying price (KES)" required error={errors.buyingPrice?.message}>
          <Input type="number" step="0.01" {...register('buyingPrice', { valueAsNumber: true })} />
        </Field>

        <Field label="Selling price (KES)" required error={errors.sellingPrice?.message}>
          <Input type="number" step="0.01" {...register('sellingPrice', { valueAsNumber: true })} />
        </Field>

        <Field label="Wholesale price (KES)" error={errors.wholesalePrice?.message}>
          <Input type="number" step="0.01" {...register('wholesalePrice', { valueAsNumber: true })} />
        </Field>

        <Field label="Minimum price (KES)" error={errors.minimumPrice?.message}>
          <Input type="number" step="0.01" {...register('minimumPrice', { valueAsNumber: true })} />
        </Field>

        <Field label="Current stock" required error={errors.stock?.message}>
          <Input type="number" step="1" {...register('stock', { valueAsNumber: true })} />
        </Field>

        <Field label="Minimum stock" required error={errors.minimumStock?.message}>
          <Input type="number" step="1" {...register('minimumStock', { valueAsNumber: true })} />
        </Field>

        <Field label="Maximum stock" error={errors.maximumStock?.message}>
          <Input type="number" step="1" {...register('maximumStock', { valueAsNumber: true })} />
        </Field>

        <Field label="Expiry date" error={errors.expiryDate?.message}>
          <Input type="date" {...register('expiryDate')} />
        </Field>

        <Field label="Batch number" error={errors.batchNumber?.message}>
          <Input {...register('batchNumber')} />
        </Field>

        <Field label="Notes" className="col-span-2">
          <Textarea rows={2} {...register('notes')} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save product'}
        </Button>
      </div>
    </form>
  )
}
