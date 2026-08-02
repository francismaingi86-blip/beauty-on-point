import { z } from 'zod'

export const productSchema = z
  .object({
    barcode: z.string().trim().optional(),
    sku: z.string().trim().min(1, 'SKU is required'),
    name: z.string().trim().min(1, 'Product name is required'),
    brand: z.string().trim().optional(),
    category: z.string().trim().optional(),
    subcategory: z.string().trim().optional(),
    buyingPrice: z.number().min(0, 'Must be 0 or more'),
    sellingPrice: z.number().min(0, 'Must be 0 or more'),
    wholesalePrice: z.number().min(0).optional(),
    minimumPrice: z.number().min(0).optional(),
    stock: z.number().min(0, 'Must be 0 or more'),
    minimumStock: z.number().min(0, 'Must be 0 or more'),
    maximumStock: z.number().min(0).optional(),
    expiryDate: z.string().optional(),
    batchNumber: z.string().trim().optional(),
    supplierId: z.string().optional(),
    imageUrl: z.string().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.sellingPrice >= data.buyingPrice, {
    message: 'Selling price should be at or above buying price',
    path: ['sellingPrice'],
  })

export type ProductFormValues = z.infer<typeof productSchema>
