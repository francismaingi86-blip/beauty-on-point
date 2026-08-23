import * as pdfjsLib from 'pdfjs-dist'
// Vite bundles the worker file as a real asset and gives us its final URL —
// required for pdf.js to run at all in the browser.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseCatalogLines, type PdfCatalogRow } from './parseCatalogLines'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

interface PdfTextItem {
  str: string
  transform: number[]
  hasEOL?: boolean
}

/**
 * Reconstructs reading-order lines from PDF.js's flat list of text
 * fragments. PDF text extraction doesn't give you "lines" directly — it
 * gives you positioned fragments — so fragments are grouped by their
 * vertical position on the page, and joined left-to-right within each
 * group. This is what lets a wrapped product name (spread across two
 * fragments the PDF author's software placed as two visual lines)
 * reconstruct as two clean text lines here.
 */
async function extractLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const lines: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const items = content.items as PdfTextItem[]

    let currentLine: string[] = []
    let currentY: number | null = null

    for (const item of items) {
      const y = item.transform[5]
      if (currentY !== null && Math.abs(y - currentY) > 2) {
        if (currentLine.length > 0) lines.push(currentLine.join(' '))
        currentLine = []
      }
      currentY = y
      if (item.str.trim()) currentLine.push(item.str)
      if (item.hasEOL) {
        if (currentLine.length > 0) lines.push(currentLine.join(' '))
        currentLine = []
        currentY = null
      }
    }
    if (currentLine.length > 0) lines.push(currentLine.join(' '))
  }

  return lines
}

export async function parsePdfCatalog(file: File): Promise<PdfCatalogRow[]> {
  const lines = await extractLines(file)
  return parseCatalogLines(lines)
}
