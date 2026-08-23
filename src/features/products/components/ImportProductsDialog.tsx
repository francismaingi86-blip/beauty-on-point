import { useRef, useState } from 'react'
import { Upload, ShieldCheck, Plus, SkipForward, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatKes } from '@/lib/utils'
import { parseImportFile, type RawImportRow } from '../lib/parseImportFile'
import { parsePdfCatalog } from '../lib/parsePdfCatalog'
import { analyzeImport, type ImportRowToAdd, type ImportRowSkipped } from '../lib/analyzeImport'
import { useBulkCreateProducts } from '../hooks/useBulkImport'
import type { Product } from '@/lib/db'

interface ImportProductsDialogProps {
  existingProducts: Product[]
  onDone: () => void
}

interface EditableRow extends ImportRowToAdd {
  included: boolean
}

const SAMPLE_CSV = `Name,SKU,Category,Buying Price,Selling Price,Stock,Minimum Stock
Amara 200ml,AMR-200,Body Care,350,500,10,3
Versman 400ml,VER-400,Body Care,420,600,8,3
`

async function parseAnyFile(file: File): Promise<RawImportRow[]> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  return isPdf ? parsePdfCatalog(file) : parseImportFile(file)
}

export function ImportProductsDialog({ existingProducts, onDone }: ImportProductsDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [fileName, setFileName] = useState('')
  const [editableRows, setEditableRows] = useState<EditableRow[]>([])
  const [skipped, setSkipped] = useState<ImportRowSkipped[]>([])
  const [addedCount, setAddedCount] = useState(0)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bulkCreate = useBulkCreateProducts()

  async function handleFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    setParsing(true)
    try {
      const rows = await parseAnyFile(file)
      if (rows.length === 0) {
        setParseError(
          "Couldn't find any usable rows in that file — check it has clear product rows with a name and prices."
        )
        return
      }
      const analysis = analyzeImport(rows, existingProducts)
      if (analysis.toAdd.length === 0 && analysis.toSkip.length === 0) {
        setParseError("Couldn't recognize any products in that file — it may not match an expected format.")
        return
      }
      setEditableRows(analysis.toAdd.map((row) => ({ ...row, included: true })))
      setSkipped(analysis.toSkip)
      setStep('preview')
    } catch {
      setParseError(
        "Could not read that file. Make sure it's a .csv, .xlsx, or .pdf catalog export."
      )
    } finally {
      setParsing(false)
    }
  }

  function handleDownloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'beauty-on-point-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function updateRowName(rowNumber: number, name: string) {
    setEditableRows((rows) => rows.map((r) => (r.rowNumber === rowNumber ? { ...r, name } : r)))
  }

  function toggleRow(rowNumber: number) {
    setEditableRows((rows) => rows.map((r) => (r.rowNumber === rowNumber ? { ...r, included: !r.included } : r)))
  }

  const includedRows = editableRows.filter((r) => r.included)

  function handleConfirm() {
    if (includedRows.length === 0) return
    bulkCreate.mutate(includedRows, {
      onSuccess: () => {
        setAddedCount(includedRows.length)
        setStep('done')
      },
    })
  }

  if (step === 'done') {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
        <p className="font-medium">
          Added {addedCount} new product{addedCount === 1 ? '' : 's'}
        </p>
        <p className="text-sm text-[var(--text-muted)]">Everything else in your catalog was left exactly as it was.</p>
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>
            Nothing is added yet. Uncheck anything you don't want, fix any name that looks off, then confirm.
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Plus size={15} /> Will add ({includedRows.length} of {editableRows.length})
          </div>
          {editableRows.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing new found in this file.</p>
          ) : (
            <div className="card-surface max-h-72 space-y-1 overflow-y-auto p-2">
              {editableRows.map((row) => (
                <div key={row.rowNumber} className="flex items-center gap-2 rounded-lg p-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={row.included}
                    onChange={() => toggleRow(row.rowNumber)}
                    className="h-4 w-4 shrink-0 accent-brand-pink-500"
                  />
                  <div className="relative flex-1">
                    <input
                      value={row.name}
                      onChange={(e) => updateRowName(row.rowNumber, e.target.value)}
                      disabled={!row.included}
                      className="focus-ring w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] py-1 pl-2 pr-6 text-sm disabled:opacity-40"
                    />
                    <Pencil size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-[var(--text-muted)]">
                    {formatKes(row.sellingPrice)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {skipped.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)]">
              <SkipForward size={15} /> Will skip — already in your catalog ({skipped.length})
            </div>
            <div className="card-surface max-h-32 space-y-1.5 overflow-y-auto p-3">
              {skipped.map((row) => (
                <div key={row.rowNumber} className="flex items-center justify-between text-sm">
                  <span className="truncate text-[var(--text-muted)]">{row.name}</span>
                  <Badge variant="neutral" className="shrink-0">
                    {row.reason}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Back
          </Button>
          <Button onClick={handleConfirm} disabled={includedRows.length === 0 || bulkCreate.isPending}>
            {bulkCreate.isPending ? 'Adding…' : `Add ${includedRows.length} product${includedRows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <span>
          This only ever adds new products. Anything already in your catalog — stock, prices, everything — stays
          exactly as it is.
        </span>
      </div>

      <div>
        <p className="mb-2 text-sm text-[var(--text-muted)]">
          Upload a .csv, .xlsx, or .pdf catalog export. For spreadsheets, use columns for Name, SKU, Category,
          Buying Price, Selling Price, Stock, and Minimum Stock. Not sure of the spreadsheet format?
        </p>
        <button type="button" onClick={handleDownloadSample} className="text-sm font-medium text-brand-pink-600">
          Download an example template
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={parsing}
        className="focus-ring flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-subtle)] py-8 text-center hover:bg-brand-pink-50/50 dark:hover:bg-white/5"
      >
        <Upload size={22} className="text-brand-pink-400" />
        <span className="text-sm font-medium">{parsing ? 'Reading file…' : 'Tap to choose a file'}</span>
        {fileName && !parsing && <span className="text-xs text-[var(--text-muted)]">{fileName}</span>}
      </button>

      {parseError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}
    </div>
  )
}
