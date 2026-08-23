import * as XLSX from 'xlsx'

export interface RawImportRow {
  name?: string
  sku?: string
  barcode?: string
  category?: string
  buyingPrice?: number
  sellingPrice?: number
  stock?: number
  minimumStock?: number
  rowNumber: number
}

// Accepts a few common ways people label these columns, matched
// case-insensitively with spaces/underscores ignored.
const HEADER_ALIASES: Record<string, keyof Omit<RawImportRow, 'rowNumber'>> = {
  name: 'name',
  productname: 'name',
  product: 'name',
  sku: 'sku',
  code: 'sku',
  barcode: 'barcode',
  category: 'category',
  buyingprice: 'buyingPrice',
  buying: 'buyingPrice',
  cost: 'buyingPrice',
  costprice: 'buyingPrice',
  sellingprice: 'sellingPrice',
  selling: 'sellingPrice',
  price: 'sellingPrice',
  stock: 'stock',
  quantity: 'stock',
  qty: 'stock',
  minimumstock: 'minimumStock',
  minstock: 'minimumStock',
  reorderlevel: 'minimumStock',
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_-]+/g, '')
}

function toNumber(value: unknown): number | undefined {
  if (value === '' || value == null) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export async function parseImportFile(file: File): Promise<RawImportRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })

  return rawRows.map((raw, index) => {
    const row: RawImportRow = { rowNumber: index + 2 } // +2: header row + 1-indexed
    for (const [header, value] of Object.entries(raw)) {
      const key = HEADER_ALIASES[normalizeHeader(header)]
      if (!key) continue
      if (key === 'buyingPrice' || key === 'sellingPrice' || key === 'stock' || key === 'minimumStock') {
        row[key] = toNumber(value)
      } else {
        const str = String(value).trim()
        if (str) row[key] = str
      }
    }
    return row
  })
}
