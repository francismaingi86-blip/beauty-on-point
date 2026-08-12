import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKes(amount: number) {
  const hasCents = Math.round(amount * 100) % 100 !== 0
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Capitalizes the first letter of each word, leaving the rest of each
 * word untouched — so "matte lip kit" becomes "Matte Lip Kit" but
 * intentional styling like "SPF50" or "iRoll" isn't flattened.
 */
export function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}
