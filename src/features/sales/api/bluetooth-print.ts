import type { Sale } from '@/lib/db'
import { formatKes } from '@/lib/utils'

// ESC/POS control bytes — the near-universal command language thermal
// receipt printers understand, regardless of brand.
const ESC = 0x1b
const GS = 0x1d

const INIT = [ESC, 0x40]
const ALIGN_CENTER = [ESC, 0x61, 0x01]
const ALIGN_LEFT = [ESC, 0x61, 0x00]
const BOLD_ON = [ESC, 0x45, 0x01]
const BOLD_OFF = [ESC, 0x45, 0x00]
const DOUBLE_HEIGHT_ON = [GS, 0x21, 0x01]
const DOUBLE_HEIGHT_OFF = [GS, 0x21, 0x00]
const FEED_AND_CUT = [0x0a, 0x0a, 0x0a, GS, 0x56, 0x01]

function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text))
}

function line(text = ''): number[] {
  return [...textToBytes(text), 0x0a]
}

function twoColumnLine(left: string, right: string, width = 32): number[] {
  const space = Math.max(width - left.length - right.length, 1)
  return line(left + ' '.repeat(space) + right)
}

/** Builds the raw ESC/POS byte sequence for a receipt (typically 32/42/48 char paper widths). */
export function buildEscPosReceipt(
  sale: Sale,
  business: { name: string; address?: string; phone?: string; footer?: string },
  charWidth = 32
): Uint8Array {
  const bytes: number[] = [...INIT, ...ALIGN_CENTER, ...BOLD_ON, ...DOUBLE_HEIGHT_ON]

  bytes.push(...line(business.name))
  bytes.push(...DOUBLE_HEIGHT_OFF, ...BOLD_OFF)
  if (business.address) bytes.push(...line(business.address))
  if (business.phone) bytes.push(...line(business.phone))
  bytes.push(...line('-'.repeat(charWidth)))

  bytes.push(...ALIGN_LEFT)
  bytes.push(...line(new Date(sale.createdAt).toLocaleString('en-KE')))
  bytes.push(...line(`Receipt #${sale.id.slice(0, 8).toUpperCase()}`))
  bytes.push(...line('-'.repeat(charWidth)))

  for (const item of sale.items) {
    bytes.push(...line(`${item.name} x${item.quantity}`))
    bytes.push(...twoColumnLine('', formatKes(item.total), charWidth))
  }
  bytes.push(...line('-'.repeat(charWidth)))

  bytes.push(...twoColumnLine('Subtotal', formatKes(sale.subtotal), charWidth))
  if (sale.discount > 0) {
    bytes.push(...twoColumnLine('Discount', `-${formatKes(sale.discount)}`, charWidth))
  }
  bytes.push(...BOLD_ON)
  bytes.push(...twoColumnLine('TOTAL', formatKes(sale.total), charWidth))
  bytes.push(...BOLD_OFF)
  bytes.push(...twoColumnLine('Payment', sale.paymentMethod.toUpperCase(), charWidth))

  if (business.footer) {
    bytes.push(...line(''), ...ALIGN_CENTER, ...line(business.footer))
  }

  bytes.push(...FEED_AND_CUT)
  return new Uint8Array(bytes)
}

// Common GATT service/characteristic UUIDs used by cheap BLE thermal
// printers (many use a generic UART-style serial passthrough module).
// This is best-effort: only printers that expose Bluetooth Low Energy
// (not "Classic" Bluetooth / SPP) can be reached from a web page at all.
const CANDIDATE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
]

export function isBluetoothPrintSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

/** Connects to a nearby BLE printer and streams the receipt bytes to it. */
export async function printViaBluetooth(bytes: Uint8Array): Promise<void> {
  if (!isBluetoothPrintSupported()) {
    throw new Error('This browser does not support Bluetooth printing (try Chrome on Android).')
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: CANDIDATE_SERVICES,
  })

  const server = await device.gatt?.connect()
  if (!server) throw new Error('Could not connect to the printer.')

  let writable: BluetoothRemoteGATTCharacteristic | null = null
  for (const serviceUuid of CANDIDATE_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid)
      const characteristics = await service.getCharacteristics()
      writable = characteristics.find((c) => c.properties.write || c.properties.writeWithoutResponse) ?? null
      if (writable) break
    } catch {
      // This service isn't present on this device — try the next candidate.
      continue
    }
  }

  if (!writable) {
    throw new Error(
      "Connected, but couldn't find a printable service on this device. It may use Classic Bluetooth instead of Bluetooth Low Energy — try the regular Print button with a RawBT-style print service instead."
    )
  }

  // BLE writes are capped by the connection's MTU (commonly ~20 bytes of
  // usable payload) — send in small chunks with brief pauses so the
  // printer's buffer doesn't overrun.
  const chunkSize = 20
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    if (writable.properties.writeWithoutResponse) {
      await writable.writeValueWithoutResponse(chunk)
    } else {
      await writable.writeValue(chunk)
    }
    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  await server.disconnect()
}
