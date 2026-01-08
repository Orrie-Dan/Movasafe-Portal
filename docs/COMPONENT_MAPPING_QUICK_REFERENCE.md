# Component Mapping - Quick Reference

## Fintech Feature → Existing Component

### Dashboard Overview
- **KPI Cards** → `Card` + `CardHeader` + `CardContent` (from `components/ui/card.tsx`)
- **Trend Charts** → `EnhancedLineChart` (from `components/dashboard/charts/enhanced-line-chart.tsx`)
- **Active Alerts** → `AlertCenter` (from `components/dashboard/alerts/AlertCenter.tsx`)

### Transactions
- **Transaction Table** → `DataTable` (from `components/admin/DataTable.tsx`)
- **Filters** → `Select` + `Input` + `DateRangePicker` (from `components/ui/select.tsx`, `components/ui/input.tsx`, `components/admin/DateRangePicker.tsx`)
- **Action Modals** → `Dialog` + `ConfirmDialog` (from `components/ui/dialog.tsx`, `components/admin/ConfirmDialog.tsx`)
- **Status Badges** → `Badge` + `StatusBadge` (from `components/ui/badge.tsx`, `components/admin/StatusBadge.tsx`)

### Users & Wallets
- **User Table** → `DataTable` (from `components/admin/DataTable.tsx`)
- **KYC Status** → `Badge` (from `components/ui/badge.tsx`)
- **Freeze/Unfreeze Modal** → `Dialog` + `ConfirmDialog` (from `components/ui/dialog.tsx`, `components/admin/ConfirmDialog.tsx`)

### Risk & Fraud
- **Alert List** → `AlertCard` + `AlertCenter` (from `components/dashboard/alerts/AlertCard.tsx`, `components/dashboard/alerts/AlertCenter.tsx`)
- **Risk Indicators** → `RiskIndicators` (from `components/financial/RiskIndicators.tsx`) - **ALREADY EXISTS**
- **High-Risk Table** → `DataTable` (from `components/admin/DataTable.tsx`)

### Compliance & KYC
- **KYC Status Table** → `DataTable` (from `components/admin/DataTable.tsx`)
- **Document Review Modal** → `Dialog` (from `components/ui/dialog.tsx`)
- **Export Button** → `Button` with `Download` icon (from `components/ui/button.tsx`)

### System Health
- **API Uptime Chart** → `EnhancedLineChart` (from `components/dashboard/charts/enhanced-line-chart.tsx`)
- **Error Rate Chart** → `EnhancedLineChart` (from `components/dashboard/charts/enhanced-line-chart.tsx`)
- **Service Status Table** → `Table` (from `components/ui/table.tsx`)

### Support
- **Tickets Table** → `DataTable` (from `components/admin/DataTable.tsx`)
- **SLA Indicators** → `Badge` (from `components/ui/badge.tsx`)
- **Ticket Detail Modal** → `Dialog` (from `components/ui/dialog.tsx`)

### Revenue
- **Revenue Charts** → `EnhancedLineChart` + `Forecasting` (from `components/dashboard/charts/enhanced-line-chart.tsx`, `components/financial/Forecasting.tsx`)
- **Revenue KPIs** → `Card` (from `components/ui/card.tsx`)

### Admin & Security
- **Admin Users Table** → `DataTable` (from `components/admin/DataTable.tsx`)
- **Role Display** → `Badge` (from `components/ui/badge.tsx`)
- **Audit Log Table** → `DataTable` (from `components/admin/DataTable.tsx`)

---

## Key Principle

**Every fintech feature must be built using ONLY the components listed above. No new UI components should be created.**

