import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { RequirePageAccess } from '@/components/layout/RequirePageAccess'
import LoginPage from '@/features/auth/LoginPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import SalesPage from '@/features/sales/SalesPage'
import ProductsPage from '@/features/products/ProductsPage'

// Everything below is used less often than Dashboard/Sales/Products, so it
// loads on demand instead of bloating the very first page load — this
// matters a lot on the mobile data connections this app is mostly used on.
const InventoryPage = lazy(() => import('@/features/inventory/InventoryPage'))
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage'))
const SuppliersPage = lazy(() => import('@/features/suppliers/SuppliersPage'))
const PurchasesPage = lazy(() => import('@/features/purchases/PurchasesPage'))
const ExpensesPage = lazy(() => import('@/features/expenses/ExpensesPage'))
const CreditNotesPage = lazy(() => import('@/features/credit-notes/CreditNotesPage'))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))
const AiInsightsPage = lazy(() => import('@/features/ai-insights/AiInsightsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const StaffPage = lazy(() => import('@/features/staff/StaffPage'))

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Sparkles size={22} className="animate-pulse text-brand-pink-400" />
    </div>
  )
}

function lazyPage(node: React.ReactNode) {
  return <Suspense fallback={<PageLoading />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <RequirePageAccess page="dashboard">
                <DashboardPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'sales',
            element: (
              <RequirePageAccess page="sales">
                <SalesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'products',
            element: (
              <RequirePageAccess page="products">
                <ProductsPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'inventory',
            element: lazyPage(
              <RequirePageAccess page="inventory">
                <InventoryPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'customers',
            element: lazyPage(
              <RequirePageAccess page="customers">
                <CustomersPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'suppliers',
            element: lazyPage(
              <RequirePageAccess page="suppliers">
                <SuppliersPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'purchases',
            element: lazyPage(
              <RequirePageAccess page="purchases">
                <PurchasesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'expenses',
            element: lazyPage(
              <RequirePageAccess page="expenses">
                <ExpensesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'credit-notes',
            element: lazyPage(
              <RequirePageAccess page="credit-notes">
                <CreditNotesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'reports',
            element: lazyPage(
              <RequirePageAccess page="reports">
                <ReportsPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'ai-insights',
            element: lazyPage(
              <RequirePageAccess page="ai-insights">
                <AiInsightsPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'settings',
            element: lazyPage(
              <RequirePageAccess page="settings">
                <SettingsPage />
              </RequirePageAccess>
            ),
          },
          // Staff keeps its own internal admin-only gate (it needs to show
          // a specific "Administrators only" message rather than the
          // generic one), so it isn't wrapped here.
          { path: 'staff', element: lazyPage(<StaffPage />) },
        ],
      },
    ],
  },
])
