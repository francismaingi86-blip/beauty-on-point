import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { RequirePageAccess } from '@/components/layout/RequirePageAccess'
import LoginPage from '@/features/auth/LoginPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import SalesPage from '@/features/sales/SalesPage'
import ProductsPage from '@/features/products/ProductsPage'
import InventoryPage from '@/features/inventory/InventoryPage'
import CustomersPage from '@/features/customers/CustomersPage'
import SuppliersPage from '@/features/suppliers/SuppliersPage'
import PurchasesPage from '@/features/purchases/PurchasesPage'
import ExpensesPage from '@/features/expenses/ExpensesPage'
import CreditNotesPage from '@/features/credit-notes/CreditNotesPage'
import ReportsPage from '@/features/reports/ReportsPage'
import AiInsightsPage from '@/features/ai-insights/AiInsightsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import StaffPage from '@/features/staff/StaffPage'

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
            element: (
              <RequirePageAccess page="inventory">
                <InventoryPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'customers',
            element: (
              <RequirePageAccess page="customers">
                <CustomersPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'suppliers',
            element: (
              <RequirePageAccess page="suppliers">
                <SuppliersPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'purchases',
            element: (
              <RequirePageAccess page="purchases">
                <PurchasesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'expenses',
            element: (
              <RequirePageAccess page="expenses">
                <ExpensesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'credit-notes',
            element: (
              <RequirePageAccess page="credit-notes">
                <CreditNotesPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'reports',
            element: (
              <RequirePageAccess page="reports">
                <ReportsPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'ai-insights',
            element: (
              <RequirePageAccess page="ai-insights">
                <AiInsightsPage />
              </RequirePageAccess>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequirePageAccess page="settings">
                <SettingsPage />
              </RequirePageAccess>
            ),
          },
          // Staff keeps its own internal admin-only gate (it needs to show
          // a specific "Administrators only" message rather than the
          // generic one), so it isn't wrapped here.
          { path: 'staff', element: <StaffPage /> },
        ],
      },
    ],
  },
])
