import type { StaffRole } from '@/stores/useAuthStore'

export type PageKey =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'expenses'
  | 'credit-notes'
  | 'reports'
  | 'ai-insights'
  | 'settings'
  | 'staff'

/**
 * What each role can see and do. Administrators and managers get full
 * operational access (Staff management stays administrator-only).
 * Cashiers are limited to running sales — no visibility into other
 * financial or catalog data. Storekeepers handle stock and purchasing,
 * not money or personnel.
 *
 * This governs navigation and route access in the app. The database's
 * own row-level security is the real enforcement boundary for the most
 * sensitive data (e.g. sales visibility) — this matters for a good
 * experience, but isn't the only thing standing between a role and data
 * it shouldn't reach.
 */
const ROLE_ACCESS: Record<StaffRole, PageKey[]> = {
  administrator: [
    'dashboard',
    'sales',
    'products',
    'inventory',
    'customers',
    'suppliers',
    'purchases',
    'expenses',
    'credit-notes',
    'reports',
    'ai-insights',
    'settings',
    'staff',
  ],
  manager: [
    'dashboard',
    'sales',
    'products',
    'inventory',
    'customers',
    'suppliers',
    'purchases',
    'expenses',
    'credit-notes',
    'reports',
    'ai-insights',
    'settings',
  ],
  cashier: ['dashboard', 'sales', 'reports'],
  storekeeper: ['dashboard', 'products', 'inventory', 'purchases', 'suppliers'],
}

export function canAccessPage(role: StaffRole | undefined, page: PageKey): boolean {
  if (!role) return false
  return ROLE_ACCESS[role].includes(page)
}
