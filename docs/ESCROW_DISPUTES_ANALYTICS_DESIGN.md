# Escrow Disputes Analytics Dashboard - Professional Design

## Executive Summary

This document details the analytics, charts, KPIs, and data tables for the Escrow Disputes Admin Page, strictly based on the two-endpoint API model:
- `POST /api/admin/escrows/refund/{id}` - Direct refund (ACTIVE escrows)
- `POST /api/admin/escrows/resolve-dispute/{id}` - Dispute resolution (DISPUTED escrows)

---

## Section 1: KPI Metrics

### 1.1 Pending Disputes (Real-time Metric)
**Formula:** `COUNT(escrows WHERE status = 'DISPUTED')`
- **Label:** "Pending Disputes"
- **Value:** Number
- **Purpose:** Shows admin queue size, supports SLA tracking
- **Decision Support:** Urgency of case backlog
- **UI:** Large number with icon

### 1.2 Total Disputes Resolved (Lifetime)
**Formula:** `COUNT(escrows WHERE status = 'RELEASED' OR status = 'REFUNDED' AND resolution.disputeResolvedAt IS NOT NULL)`
- **Label:** "Total Resolved"
- **Value:** Number
- **Purpose:** Historical dispute volume
- **Decision Support:** Operational metrics, trend analysis
- **UI:** Card with secondary metric

### 1.3 Client Win Rate (%)
**Formula:** `(COUNT(escrows WHERE action = 'REFUND') / COUNT(escrows WHERE action = 'RELEASE' OR action = 'REFUND')) * 100`
- **Label:** "Client Win Rate"
- **Value:** Percentage (0-100%)
- **Purpose:** Fairness metric - shows if system favors clients
- **Decision Support:** Detects bias, supports compliance audits
- **UI:** Percentage with trend indicator (↑↓)
- **Target Range:** 40-60% (indicates balanced decisions)

### 1.4 Vendor Win Rate (%)
**Formula:** `(COUNT(escrows WHERE action = 'RELEASE') / COUNT(escrows WHERE action = 'RELEASE' OR action = 'REFUND')) * 100`
- **Label:** "Vendor Win Rate"
- **Value:** Percentage (0-100%)
- **Purpose:** Fairness metric - shows if system favors vendors
- **Decision Support:** Detects bias, supports compliance audits
- **UI:** Percentage with trend indicator (↑↓)
- **Target Range:** 40-60% (indicates balanced decisions)

### 1.5 Average Resolution Time (Days)
**Formula:** `AVG(disputeResolvedAt - createdAt) / 86400 seconds` 
- **Label:** "Avg Resolution Time"
- **Value:** Number (days)
- **Purpose:** SLA compliance, efficiency metric
- **Decision Support:** Identifies bottlenecks, speeds up backlog
- **UI:** Card with SLA indicator (color: green <3 days, yellow 3-7 days, red >7 days)

### 1.6 Median Resolution Time (Days)
**Formula:** `MEDIAN(disputeResolvedAt - createdAt) / 86400 seconds`
- **Label:** "Median Resolution Time"
- **Value:** Number (days)
- **Purpose:** Outlier-resistant efficiency metric
- **Decision Support:** Represents typical admin performance
- **UI:** Secondary metric next to average

### 1.7 Direct Refunds (Active Escrows)
**Formula:** `COUNT(escrows WHERE status = 'REFUNDED' AND resolution.action != 'REFUND')`
- **Label:** "Direct Refunds"
- **Value:** Number
- **Purpose:** Tracks non-dispute refunds (cancellations, service issues)
- **Decision Support:** Operational metric distinct from dispute resolution
- **UI:** Card with icon

### 1.8 Total Dispute Value at Risk (Currency)
**Formula:** `SUM(amount WHERE status = 'DISPUTED')`
- **Label:** "Value at Risk"
- **Value:** Currency formatted (RWF)
- **Purpose:** Financial impact of pending disputes
- **Decision Support:** Priority management for high-value cases
- **UI:** Large currency value with warning indicator if >threshold

### 1.9 Monthly Resolution Rate (%)
**Formula:** `(COUNT(resolved THIS_MONTH) / COUNT(disputed THIS_MONTH)) * 100`
- **Label:** "MTD Resolution Rate"
- **Value:** Percentage
- **Purpose:** Monthly SLA tracking
- **Decision Support:** Monthly performance benchmarking
- **UI:** Percentage with comparison to previous month

### 1.10 Admin Fairness Index (0-1)
**Formula:** `1 - ABS(client_win_rate - vendor_win_rate) / 100` 
- **Label:** "Fairness Index"
- **Value:** 0-1 (1 = perfectly balanced)
- **Purpose:** Detects systematic bias in admin decisions
- **Decision Support:** Quality assurance, prevents vendor/client favoritism
- **UI:** Score with color gradient (red <0.6, yellow 0.6-0.8, green >0.8)

---

## Section 2: Charts

### 2.1 Dispute Resolution Outcomes (Pie Chart)
**Data:** Count by action type
```
Labels: ["RELEASE (Vendor Wins)", "REFUND (Client Wins)"]
Values: [count_release, count_refund]
```
**Purpose:** At-a-glance view of decision balance
**Supports:** Fairness audits, bias detection
**Time Period:** Selectable (Last 30/90/365 days, YTD, All)
**UI:** 
- Pie chart with legend
- Percentage labels
- Color: RELEASE = green, REFUND = orange

### 2.2 Dispute Trends Over Time (Line Chart)
**Data:** Monthly dispute volumes
```
X-axis: Month (Jan, Feb, Mar...)
Y-axis: Count
Lines: 
  - "New Disputes" (status = DISPUTED, createdAt)
  - "Resolved Disputes" (disputeResolvedAt)
  - "Pending Disputes" (status = DISPUTED)
```
**Purpose:** Identify seasonal patterns, backlog growth/reduction
**Supports:** Capacity planning, trend analysis
**Time Period:** Last 12 months
**UI:**
- Dual-axis line chart
- Stack area optional
- Color: New = blue, Resolved = green, Pending = red

### 2.3 Resolution Time Distribution (Histogram)
**Data:** Binned resolution times
```
X-axis: Resolution time (days): [0-1, 1-3, 3-7, 7-14, 14+]
Y-axis: Count of disputes
```
**Purpose:** Identify if admins resolve quickly or let cases age
**Supports:** Performance analysis, SLA compliance
**UI:**
- Column chart
- Color gradient: green (fast) → yellow → red (slow)
- Overlay: Target SLA line (e.g., 5-day benchmark)

### 2.4 Admin Performance (Stacked Bar Chart)
**Data:** Per-admin metrics
```
X-axis: Admin name (disputeResolvedBy)
Y-axis: Count
Stacks:
  - RELEASE decisions (vendor wins)
  - REFUND decisions (client wins)
  - Total resolved
```
**Purpose:** Individual admin accountability, fairness per admin
**Supports:** Performance reviews, bias identification
**Time Period:** Last 30 days
**UI:**
- Horizontal stacked bar chart
- Hover tooltip: "Admin X: 15 RELEASE, 12 REFUND (Total: 27)"

### 2.5 Top Disputed Vendors (Horizontal Bar)
**Data:** By vendor, sorted
```
X-axis: Count of disputes involving vendor
Y-axis: Vendor name
Colored bars: Win rate (% of RELEASE decisions)
```
**Purpose:** Identify problematic vendors with high dispute rates
**Supports:** Vendor quality assessment, SLA enforcement
**Limit:** Top 10 vendors
**UI:**
- Horizontal bar chart
- Color: Green (high win rate) → Red (low win rate)
- Tooltip: "Vendor: 45 disputes, 60% vendor wins"

### 2.6 Top Disputed Clients (Horizontal Bar)
**Data:** By client, sorted
```
X-axis: Count of disputes initiated by client
Y-axis: Client name
Colored bars: Win rate (% of REFUND decisions)
```
**Purpose:** Identify dispute-prone clients, frivolous claims
**Supports:** Client behavior analysis, chargeback prevention
**Limit:** Top 10 clients
**UI:**
- Horizontal bar chart
- Color: Green (legitimate wins) → Red (rarely wins)
- Tooltip: "Client: 23 disputes, 35% client wins"

### 2.7 Monthly Dispute Volume (Column Chart)
**Data:** Disputes created/resolved monthly
```
X-axis: Month
Y-axis: Count
Bars: Total disputes created that month
Overlay line: Cumulative resolved
```
**Purpose:** Visual trend of workload
**Supports:** Staffing decisions, capacity planning
**Time Period:** Last 12 months
**UI:**
- Column + line combo chart
- Secondary Y-axis for cumulative

### 2.8 Resolution Action Bias by Admin (Scatter)
**Data:** Per-admin decision patterns
```
X-axis: % REFUND decisions (client wins)
Y-axis: Admin name
```
**Purpose:** Detects if admin systematically favors one party
**Supports:** Compliance audits, fairness checks
**UI:**
- Scatter plot or bubble chart
- Center line at 50% = neutral
- Color zones: Green (balanced), Yellow (slight bias), Red (strong bias)
- Tooltip: "Admin X: 45% refunds, 55% releases (balanced)"

---

## Section 3: Tables

### 3.1 Pending Disputes Table (Active Disputes)
**Data Source:** `escrows WHERE status = 'DISPUTED'`

**Columns:**
| Column | Type | Source | Purpose | Sortable | Filterable |
|--------|------|--------|---------|----------|-----------|
| Dispute ID | String (truncated) | escrowId | Identification | ✓ | ✓ |
| Client | String | clientName | Party identification | ✓ | ✓ |
| Vendor | String | vendorName | Party identification | ✓ | ✓ |
| Amount | Currency | amount | Financial impact | ✓ | ✓ |
| Status | Badge | status (DISPUTED) | Current state | ✓ | ✓ |
| Created | Date | createdAt | Age of dispute | ✓ | Date range |
| Days Pending | Number | NOW() - createdAt | SLA tracking | ✓ | ✓ |
| SLA Status | Badge | Color-coded | Urgency | ✓ | Green/Yellow/Red |
| Notes | Text (truncated) | disputeReason | Quick context | ✗ | Full text search |
| Actions | Buttons | - | Resolve / View | ✗ | ✗ |

**Row Actions:**
- **View Details** → Opens modal with full context
- **Resolve Dispute** → Dialog: Choose RELEASE/REFUND, enter notes, submit
- **Priority Flag** → Mark as high-priority

**Sorting Defaults:** Days Pending DESC (oldest first)

**Pagination:** 25 rows/page

### 3.2 Resolved Disputes Table (Audit Trail)
**Data Source:** `escrows WHERE status = 'RELEASED' OR 'REFUNDED' AND resolution.disputeResolvedAt IS NOT NULL`

**Columns:**
| Column | Type | Source | Purpose | Sortable | Filterable |
|--------|------|--------|---------|----------|-----------|
| Dispute ID | String | escrowId | Identification | ✓ | ✓ |
| Client | String | clientName | Party | ✓ | ✓ |
| Vendor | String | vendorName | Party | ✓ | ✓ |
| Amount | Currency | amount | Transaction value | ✓ | ✓ |
| Action | Badge | resolution.action (RELEASE/REFUND) | Outcome | ✓ | RELEASE/REFUND |
| Winner | Text | "Vendor" or "Client" | Outcome clarity | ✓ | ✓ |
| Resolved By | String | disputeResolvedBy | Accountability | ✓ | ✓ |
| Resolved Date | DateTime | disputeResolvedAt | Audit timestamp | ✓ | Date range |
| Resolution Time | Number (days) | disputeResolvedAt - createdAt | SLA metric | ✓ | ✓ |
| Notes | Text (truncated) | disputeResolution | Decision rationale | ✗ | Full text search |
| Status | Badge | Final status (RELEASED/REFUNDED) | Final state | ✓ | ✓ |
| Export | Button | - | Download receipt | ✗ | ✗ |

**Row Actions:**
- **View Full Details** → Modal with complete audit trail
- **Download Certificate** → PDF of resolution
- **Flag for Audit** → Mark for compliance review

**Sorting Defaults:** Resolved Date DESC (newest first)

**Pagination:** 25 rows/page

### 3.3 Direct Refunds Table (Non-Dispute Refunds)
**Data Source:** `escrows WHERE status = 'REFUNDED' AND createdAt - updatedAt via /refund endpoint`

**Columns:**
| Column | Type | Source | Purpose | Sortable | Filterable |
|--------|------|--------|---------|----------|-----------|
| Refund ID | String | escrowId | Identification | ✓ | ✓ |
| Client | String | clientName | Recipient | ✓ | ✓ |
| Vendor | String | vendorName | Original recipient | ✓ | ✓ |
| Amount | Currency | amount | Refund amount | ✓ | ✓ |
| Reason | Text | refundReason (optional) | Justification | ✓ | Text search |
| Processed By | String | admin user (implied) | Accountability | ✓ | ✓ |
| Processed Date | DateTime | updatedAt | Timestamp | ✓ | Date range |
| Type | Badge | "Direct Refund" | Distinction from disputes | ✓ | ✓ |
| Status | Badge | REFUNDED | Final state | ✓ | ✓ |
| Actions | Buttons | - | View / Export | ✗ | ✗ |

**Purpose:** Track non-disputed refunds separately to distinguish from dispute resolution

**Sorting Defaults:** Processed Date DESC

**Pagination:** 25 rows/page

### 3.4 Admin Activity Table (Audit & Performance)
**Data Source:** `escrows WHERE disputeResolvedBy IS NOT NULL` grouped by admin

**Columns:**
| Column | Type | Source | Purpose | Sortable | Filterable |
|--------|------|--------|---------|----------|-----------|
| Admin | String | disputeResolvedBy | User identification | ✓ | ✓ |
| Total Resolved | Number | COUNT | Volume metric | ✓ | ✓ |
| Client Wins | Number | COUNT(action='REFUND') | Performance metric | ✓ | ✓ |
| Vendor Wins | Number | COUNT(action='RELEASE') | Performance metric | ✓ | ✓ |
| Win Ratio | Percentage | (RELEASE/total)*100 | Fairness metric | ✓ | ✓ |
| Avg Resolution Time | Number (days) | AVG(resolution time) | Speed metric | ✓ | ✓ |
| Fastest Resolution | Number (days) | MIN(resolution time) | Benchmark | ✓ | ✓ |
| Slowest Resolution | Number (days) | MAX(resolution time) | Benchmark | ✓ | ✓ |
| Cases in Progress | Number | COUNT(status=DISPUTED AND assigned_to) | Workload | ✓ | ✓ |
| Last Active | DateTime | MAX(disputeResolvedAt) | Activity tracking | ✓ | ✓ |

**Purpose:** Admin accountability, performance review, bias detection

**Sorting Defaults:** Total Resolved DESC

**Row Actions:**
- **View Cases** → Filter resolved disputes by this admin
- **Performance Report** → Detailed analytics for admin
- **Audit Trail** → All actions by this admin

---

## Section 4: Filters & Controls

### 4.1 Global Filters (Header)
```
Date Range: 
  - Preset: Last 7 days, Last 30 days, Last 90 days, YTD, All
  - Custom: From/To date picker

Status Filter:
  - Pending Disputes (DISPUTED)
  - Resolved (RELEASE + REFUND)
  - All

Action Filter:
  - RELEASE (Vendor Wins)
  - REFUND (Client Wins)
  - All

Admin Filter:
  - Dropdown of all admins who've resolved disputes
  - Multi-select

Amount Range:
  - Min/Max input
  - Presets: <10K, 10-100K, 100K+

Search:
  - By Dispute ID
  - By Client Name
  - By Vendor Name
  - By Admin Name
```

### 4.2 Table-Specific Filters
**Pending Disputes Table:**
- SLA Status: Green / Yellow / Red
- Priority: High / Normal
- Days Pending: <1, 1-3, 3-7, 7+

**Resolved Disputes Table:**
- Resolution Time: <3 days, 3-7 days, 7+ days
- Fairness Flag: Yes / No

---

## Section 5: Advanced Insights (Optional)

### 5.1 Dispute Fairness Audit
**Metric:** Flag disputes where admin decision contradicts expected outcome
```
Logic:
- If client_win_rate > 70%: "Bias toward clients"
- If vendor_win_rate > 70%: "Bias toward vendors"
- If resolution_time > 14 days: "SLA breach"
```
**Display:** Alert card with count and link to flagged cases

### 5.2 Vendor Quality Index
**Metric:** Ratio of disputes to transactions
```
formula: (disputes_count / transactions_count) * 100
```
**Display:** Table sorted by dispute ratio, highlight problem vendors

### 5.3 Client Chargeback Risk
**Metric:** Clients with high refund request rates
```
formula: (refund_requests_count / total_purchases) * 100
```
**Display:** Table of at-risk clients, color-coded by risk level

### 5.4 Admin SLA Compliance
**Metric:** % of disputes resolved within SLA (e.g., 5 days)
```
formula: (count where resolution_time <= 5) / total * 100
```
**Display:** Progress bar per admin, company average

---

## Section 6: Export & Reporting

### 6.1 CSV Export
- All tables support column-specific export
- Filters applied to export
- Include: Dispute ID, parties, amounts, decisions, timestamps, admin, notes

### 6.2 PDF Report
- Executive summary (KPIs)
- Charts (pie, trends, histogram)
- Tables (pending, resolved sample)
- Timestamp, generated by, filters applied

### 6.3 Scheduled Reports
- Daily: Pending disputes summary
- Weekly: Fairness audit
- Monthly: Admin performance review

---

## Section 7: Data Validation Rules

**Consistency Checks:**
1. `disputeResolvedBy` MUST be non-null for RESOLVED disputes
2. `disputeResolution` notes MUST be 10-2000 characters
3. `action` MUST be either RELEASE or REFUND
4. `disputeResolvedAt` MUST be ISO 8601 timestamp
5. `resolution_time` MUST be > 0

**Audit Trail:**
- All changes immutable
- Admin identity recorded
- Timestamp recorded
- Notes recorded

---

## Section 8: UI Layout (Wireframe)

```
┌─────────────────────────────────────────────────────┐
│ [Filters & Controls] [Export] [Refresh]             │
└─────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Pending  │ Resolved │ Client % │ Vendor % │
│   45     │  1,230   │  48%↓    │  52%↑    │
└──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Value @  │ Avg Time │ Fairness │ Direct   │
│ Risk     │ 4.2 days │ 0.87 ✓   │ Refunds  │
│ 2.3M RWF │          │ (balanced)│   89     │
└──────────┴──────────┴──────────┴──────────┘

[Tabs: Overview | Analytics | Audit Trail]

┌─────────────────────────────────────────────────────┐
│ Dispute Resolution Outcomes   │ Trends Over Time   │
│ (Pie)                         │ (Line)             │
│                               │                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Resolution Time Distribution  │ Admin Performance  │
│ (Histogram)                   │ (Stacked Bar)      │
│                               │                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Pending Disputes Table (Sortable, Paginated)        │
│ [ID] [Client] [Vendor] [Amount] [Days] [Status] ... │
│ ...                                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Resolved Disputes Table (Audit Trail)               │
│ [ID] [Parties] [Amount] [Action] [Admin] [Date] ... │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

- [ ] KPI cards with real-time data fetching
- [ ] Dispute resolution outcome pie chart
- [ ] Trends line chart with 12-month history
- [ ] Resolution time histogram
- [ ] Admin performance stacked bar chart
- [ ] Top vendors horizontal bar
- [ ] Top clients horizontal bar
- [ ] Pending disputes table with actions
- [ ] Resolved disputes table (audit trail)
- [ ] Direct refunds table
- [ ] Admin activity table
- [ ] Global filters (date, status, action, admin, amount, search)
- [ ] CSV/PDF export functionality
- [ ] Fairness audit detection
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance optimization (lazy load, pagination)
- [ ] Accessibility (WCAG 2.1 AA)

