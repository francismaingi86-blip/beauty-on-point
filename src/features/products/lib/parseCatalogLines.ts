import type { RawImportRow } from './parseImportFile'

// Recognizes a data line like "pcs 40 70" — the real minimum shape this
// catalog format extracts as (measurement + buying + selling price) —
// while still tolerating extra trailing numbers/dates if a particular
// export includes them (e.g. "pcs 40 70 0 08/11/2025 8:41 pm"). Also
// tolerant of an inline description before it on the same line, e.g.
// "99J LONG AVIS pcs 57 80".
const DATA_LINE =
  /^(.*?)\s*\b([A-Za-z]+)\s+([\d.]+)\s+([\d.]+)\s*(?:([\d.]+)\s*)?(?:\d{1,2}\/\d{1,2}\/\d{4}.*)?$/i

// Repeating page headers, report metadata, and title lines — recognized
// by structural signature (column-header keywords, "Key : Value" style
// lines, or generic report-title words) rather than any exact wording,
// so this keeps working even if a business's export phrases these
// slightly differently.
function isNoiseLine(line: string): boolean {
  const lower = line.toLowerCase()
  if (lower.includes('description') && lower.includes('measurement') && lower.includes('price')) return true
  if (/\s:\s/.test(line) && line.length < 60) return true
  if (/\b(catalog|report|price list|stock list)\b/i.test(line) && !/\d/.test(line)) return true
  return false
}

// A short, all-caps, digit-free standalone SINGLE WORD is almost
// certainly a section label like "BRAIDS" or "CLEANSER" — restricted to
// exactly one word deliberately: real product names in these catalogs,
// even when wrapped onto their own first line (e.g. "AFRO BABY" before
// "EXTENSION"), consistently span two or more words. Loosening this to
// "a few words" was tried and wrongly ate into real product names.
function looksLikeCategoryLabel(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (/\d/.test(trimmed)) return false
  if (/[()/]/.test(trimmed)) return false
  if (trimmed !== trimmed.toUpperCase()) return false
  if (/\s/.test(trimmed)) return false
  return trimmed.length <= 20
}

export type PdfCatalogRow = RawImportRow

export function parseCatalogLines(rawLines: string[]): PdfCatalogRow[] {
  const lines = rawLines.map((l) => l.trim()).filter(Boolean).filter((l) => !isNoiseLine(l))

  const rows: PdfCatalogRow[] = []
  let pending: string[] = []
  let currentCategory: string | undefined
  let rowNumber = 1

  function flushPendingAsCategory() {
    if (pending.length === 0) return
    const first = pending[0]
    if (looksLikeCategoryLabel(first)) {
      currentCategory = first
    }
    pending = []
  }

  for (const line of lines) {
    const match = line.match(DATA_LINE)
    if (!match) {
      pending.push(line)
      continue
    }

    const [, inlineDescription, measurement, buying, retail, wholesale] = match
    void measurement // unit (pcs, kg, etc.) — not part of our product schema, intentionally unused

    let description: string
    if (inlineDescription.trim()) {
      // This line carried its own description — anything still pending
      // from before is orphaned text, most likely a category label.
      flushPendingAsCategory()
      description = inlineDescription.trim()
    } else if (pending.length >= 2 && looksLikeCategoryLabel(pending[0])) {
      currentCategory = pending[0]
      description = pending.slice(1).join(' ').trim()
      pending = []
    } else {
      description = pending.join(' ').trim()
      pending = []
    }

    if (description) {
      const buyingPrice = Number(buying)
      const sellingPrice = Number(retail)
      const wholesalePrice = Number(wholesale)
      rows.push({
        rowNumber: rowNumber++,
        name: description,
        category: currentCategory,
        buyingPrice: Number.isFinite(buyingPrice) ? buyingPrice : undefined,
        sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : undefined,
        wholesalePrice: wholesalePrice > 0 ? wholesalePrice : undefined,
      })
    }
  }

  return rows
}
