import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import HomePage from '@/app/page'
import LoginPage from '@/app/login/page'

const NotificationsPage = lazy(() => import('@/app/notifications/page'))
const AdminLayout = lazy(() => import('@/app/admin/layout'))
const AdminDashboard = lazy(() => import('@/app/admin/page'))
const AdminAnalytics = lazy(() => import('@/app/admin/analytics/page'))
const AdminApiKeys = lazy(() => import('@/app/admin/api-keys/page'))
const AdminAudit = lazy(() => import('@/app/admin/audit/page'))
const AdminAuditLogs = lazy(() => import('@/app/admin/audit-logs/page'))
const AdminClients = lazy(() => import('@/app/admin/clients/page'))
const AdminComplianceKyc = lazy(() => import('@/app/admin/compliance-kyc/page'))
const AdminData = lazy(() => import('@/app/admin/data/page'))
const AdminEscrows = lazy(() => import('@/app/admin/escrows/page'))
const AdminFinancial = lazy(() => import('@/app/admin/financial/page'))
const AdminMerchants = lazy(() => import('@/app/admin/merchants/page'))
const AdminNotifications = lazy(() => import('@/app/admin/notifications/page'))
const AdminRefundDisputesEscrow = lazy(() => import('@/app/admin/refund-disputes/escrow/page'))
const AdminRefundDisputesTransactions = lazy(() => import('@/app/admin/refund-disputes/transactions/page'))
const AdminRevenue = lazy(() => import('@/app/admin/revenue/page'))
const AdminRiskFraud = lazy(() => import('@/app/admin/risk-fraud/page'))
const AdminRoles = lazy(() => import('@/app/admin/roles/page'))
const AdminRolesCreate = lazy(() => import('@/app/admin/roles/create/page'))
const AdminSettings = lazy(() => import('@/app/admin/settings/page'))
const AdminSupport = lazy(() => import('@/app/admin/support/page'))
const AdminSystemHealth = lazy(() => import('@/app/admin/system-health/page'))
const AdminTransactions = lazy(() => import('@/app/admin/transactions/page'))
const AdminUsers = lazy(() => import('@/app/admin/users/page'))
const AdminUsersCreate = lazy(() => import('@/app/admin/users/create/page'))
const AdminUserDetail = lazy(() => import('@/app/admin/users/[id]/UserDetailClient'))
const AdminWallets = lazy(() => import('@/app/admin/wallets/page'))
const AdminLoans = lazy(() => import('@/app/admin/loans/page'))

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="api-keys" element={<AdminApiKeys />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="compliance-kyc" element={<AdminComplianceKyc />} />
            <Route path="data" element={<AdminData />} />
            <Route path="escrows" element={<AdminEscrows />} />
            <Route path="financial" element={<AdminFinancial />} />
            <Route path="merchants" element={<AdminMerchants />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="refund-disputes/escrow" element={<AdminRefundDisputesEscrow />} />
            <Route path="refund-disputes/transactions" element={<AdminRefundDisputesTransactions />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="risk-fraud" element={<AdminRiskFraud />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="roles/create" element={<AdminRolesCreate />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="system-health" element={<AdminSystemHealth />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/create" element={<AdminUsersCreate />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="wallets" element={<AdminWallets />} />
            <Route path="loans" element={<AdminLoans />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}
