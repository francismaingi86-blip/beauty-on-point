import type { Product } from '@/lib/db'
import type { RawImportRow } from './parseImportFile'

export interface ImportRowToAdd {
  rowNumber: number
  name: string
  sku: string
  barcode?: string
  category?: string
  buyingPrice: number
  sellingPrice: number
  stock: number
  minimumStock: number
}

export interface ImportRowSkipped {
  rowNumber: number
  name: string
  reason: string
  matchedProductName?: string
}

export interface ImportAnalysis {
  toAdd: ImportRowToAdd[]
  toSkip: ImportRowSkipped[]
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function generateSku(name: string, usedSkus: Set<string>): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20) || 'ITEM'
  let sku = base
  let suffix = 1
  while (usedSkus.has(sku)) {
    sku = `${base}-${suffix}`
    suffix++
  }
  return sku
}

/**
 * Compares the uploaded rows against what's already in the catalog and
 * splits them into "genuinely new — safe to add" and "already exists —
 * will be skipped, untouched". A product counts as existing if its SKU
 * matches (preferred, exact) or — when no SKU is given, either in the
 * sheet or on the existing product — its name matches exactly. This
 * function never modifies anything itself; it only decides what *would*
 * be added, for the person to review before anything is written.
 */
export function analyzeImport(rows: RawImportRow[], existingProducts: Product[]): ImportAnalysis {
  const existingBySku = new Map(existingProducts.filter((p) => p.sku).map((p) => [normalize(p.sku), p]))
  const existingByName = new Map(existingProducts.map((p) => [normalize(p.name), p]))
  const usedSkus = new Set(existingProducts.map((p) => normalize(p.sku)))

  const toAdd: ImportRowToAdd[] = []
  const toSkip: ImportRowSkipped[] = []
  const seenInThisImport = new Set<string>() // guards against duplicate rows within the same file

  for (const row of rows) {
    const name = row.name?.trim()
    if (!name) {
      toSkip.push({ rowNumber: row.rowNumber, name: '(blank)', reason: 'No product name in this row' })
      continue
    }

    const skuKey = row.sku ? normalize(row.sku) : undefined
    const nameKey = normalize(name)

    const existingMatch = (skuKey && existingBySku.get(skuKey)) || existingByName.get(nameKey)
    if (existingMatch) {
      toSkip.push({
        rowNumber: row.rowNumber,
        name,
        reason: skuKey && existingBySku.get(skuKey) ? 'SKU already exists' : 'Product name already exists',
        matchedProductName: existingMatch.name,
      })
      continue
    }

    const dedupeKey = skuKey ?? nameKey
    if (seenInThisImport.has(dedupeKey)) {
      toSkip.push({ rowNumber: row.rowNumber, name, reason: 'Duplicate row within this file' })
      continue
    }
    seenInThisImport.add(dedupeKey)

    const sku = row.sku?.trim() || generateSku(name, usedSkus)
    usedSkus.add(normalize(sku))

    toAdd.push({
      rowNumber: row.rowNumber,
      name,
      sku,
      barcode: row.barcode,
      category: row.category,
      buyingPrice: row.buyingPrice ?? 0,
      sellingPrice: row.sellingPrice ?? row.buyingPrice ?? 0,
      stock: row.stock ?? 0,
      minimumStock: row.minimumStock ?? 0,
    })
  }

  return { toAdd, toSkip }
}
