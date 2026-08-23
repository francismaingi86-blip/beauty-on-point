import { useRef, useState } from 'react'
import { Upload, ShieldCheck, Plus, SkipForward, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatKes } from '@/lib/utils'
import { parseImportFile } from '../lib/parseImportFile'
import { analyzeImport, type ImportAnalysis } from '../lib/analyzeImport'
import { useBulkCreateProducts } from '../hooks/useBulkImport'
import type { Product } from '@/lib/db'

interface ImportProductsDialogProps {
  existingProducts: Product[]
  onDone: () => void
}

const SAMPLE_CSV = `Name,SKU,Category,Buying Price,Selling Price,Stock,Minimum Stock
Amara 200ml,AMR-200,Body Care,350,500,10,3
Versman 400ml,VER-400,Body Care,420,600,8,3
`

export function ImportProductsDialog({ existingProducts, onDone }: ImportProductsDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [fileName, setFileName] = useState('')
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null)
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
      const rows = await parseImportFile(file)
      if (rows.length === 0) {
        setParseError("Couldn't find any rows in that file — check it has a header row and at least one product.")
        return
      }
      setAnalysis(analyzeImport(rows, existingProducts))
      setStep('preview')
    } catch {
      setParseError('Could not read that file. Make sure it\'s a .csv or .xlsx file exported from Excel, Google Sheets, or similar.')
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

  function handleConfirm() {
    if (!analysis) return
    bulkCreate.mutate(analysis.toAdd, { onSuccess: () => setStep('done') })
  }

  if (step === 'done' && analysis) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
        <p className="font-medium">
          Added {analysis.toAdd.length} new product{analysis.toAdd.length === 1 ? '' : 's'}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Everything else in your catalog was left exactly as it was.
        </p>
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    )
  }

  if (step === 'preview' && analysis) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>Nothing is added yet. Review below, then confirm — existing products are never changed.</span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Plus size={15} /> Will add ({analysis.toAdd.length})
          </div>
          {analysis.toAdd.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing new found in this file.</p>
          ) : (
            <div className="card-surface max-h-48 space-y-1.5 overflow-y-auto p-3">
              {analysis.toAdd.map((row) => (
                <div key={row.rowNumber} className="flex items-center justify-between text-sm">
                  <span className="truncate">{row.name}</span>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                    {row.stock} units · {formatKes(row.sellingPrice)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {analysis.toSkip.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)]">
              <SkipForward size={15} /> Will skip — already in your catalog ({analysis.toSkip.length})
            </div>
            <div className="card-surface max-h-32 space-y-1.5 overflow-y-auto p-3">
              {analysis.toSkip.map((row) => (
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
          <Button onClick={handleConfirm} disabled={analysis.toAdd.length === 0 || bulkCreate.isPending}>
            {bulkCreate.isPending ? 'Adding…' : `Add ${analysis.toAdd.length} product${analysis.toAdd.length === 1 ? '' : 's'}`}
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
          Upload a .csv or .xlsx file with columns for Name, SKU, Category, Buying Price, Selling Price, Stock, and
          Minimum Stock. Not sure of the format?
        </p>
        <button type="button" onClick={handleDownloadSample} className="text-sm font-medium text-brand-pink-600">
          Download an example template
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
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
