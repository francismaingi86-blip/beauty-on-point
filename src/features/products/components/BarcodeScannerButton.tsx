import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { ScanBarcode, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerButtonProps {
  onScan: (barcode: string) => void
}

export function BarcodeScannerButton({ onScan }: BarcodeScannerButtonProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    if (!scanning) return

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    let cancelled = false

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (cancelled) return
        if (result) {
          onScan(result.getText())
          setScanning(false)
        }
        // NotFoundException fires continuously while no barcode is in frame —
        // that's expected, so only surface unexpected errors.
        if (err && err.name !== 'NotFoundException') {
          setError('Could not read the camera feed. Try again or type the barcode.')
        }
      })
      .catch(() => {
        setError('Camera access was denied or unavailable. You can type the barcode instead.')
      })

    return () => {
      cancelled = true
      BrowserMultiFormatReader.releaseAllStreams()
    }
  }, [scanning, onScan])

  return (
    <>
      <Button type="button" variant="outline" size="icon" onClick={() => { setError(null); setScanning(true) }} aria-label="Scan barcode">
        <ScanBarcode size={16} />
      </Button>

      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
          <button
            onClick={() => setScanning(false)}
            className="focus-ring absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-brand-pink-400">
            <video ref={videoRef} className="w-full" muted playsInline />
          </div>
          <p className="mt-4 text-sm text-white/80">Point the camera at a barcode</p>
          {error && <p className="mt-2 max-w-xs text-center text-sm text-brand-gold-300">{error}</p>}
        </div>
      )}
    </>
  )
}
