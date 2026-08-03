import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
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
          { index: true, element: <DashboardPage /> },
          { path: 'sales', element: <SalesPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'suppliers', element: <SuppliersPage /> },
          { path: 'purchases', element: <PurchasesPage /> },
          { path: 'expenses', element: <ExpensesPage /> },
          { path: 'credit-notes', element: <CreditNotesPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'ai-insights', element: <AiInsightsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'staff', element: <StaffPage /> },
        ],
      },
    ],
  },
])
