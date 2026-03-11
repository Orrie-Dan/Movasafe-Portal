# Movasafe AML/CFT Compliance System
## Complete Design & Implementation Guide

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Classification:** Internal – Compliance & Technology  
**Applicable System:** Movasafe Mobile Wallet (MoveRwanda)

---

## Table of Contents

1. [Part 1 — AML/CFT Policy Document](#part-1--amlcft-policy-document)
2. [Part 2 — Backend AML Architecture](#part-2--backend-aml-architecture)
3. [Part 3 — Monitoring Rules](#part-3--monitoring-rules)
4. [Part 4 — Admin Portal Features](#part-4--admin-portal-features)
5. [Part 5 — Standard Operating Procedures](#part-5--standard-operating-procedures)

---

# PART 1 — AML/CFT POLICY DOCUMENT

## 1.1 Purpose & Scope

This Anti-Money Laundering and Countering the Financing of Terrorism (AML/CFT) Policy establishes the framework for Movasafe to prevent, detect, and report money laundering and terrorist financing activities in connection with its mobile wallet services. The Policy applies to all products and services offered by Movasafe, including:

- **In-scope:** Mobile wallet deposits (MTN MoMo Collections API), wallet balances, peer-to-peer (P2P) transfers, vendor payments with escrow, withdrawals to MoMo, and any related financial services.
- **Out-of-scope:** The mobile application user interface is excluded from AML logic; all AML controls are implemented exclusively in backend services and the admin portal.

This Policy is designed to comply with the laws of the Republic of Rwanda and applicable international standards, including the Financial Action Task Force (FATF) Recommendations.

---

## 1.2 Rwanda Legal Framework

Movasafe operates under the following Rwandan legal and regulatory instruments:

| Instrument | Relevance |
|------------|-----------|
| **Law No. 51/2018** | Prevention and Suppression of Money Laundering and Financing of Terrorism |
| **BNR Regulation 04/2020** | AML/CFT requirements for financial institutions and payment service providers |
| **BNR Guidelines** | Know Your Customer (KYC) and Customer Due Diligence (CDD) for mobile money |
| **National Risk Assessment (NRA)** | Rwanda’s assessment of ML/TF risks |
| **FATF Recommendations** | International standards for AML/CFT |

Movasafe shall maintain compliance with all applicable provisions and shall update this Policy when regulations change.

---

## 1.3 Roles & Responsibilities

| Role | Responsibility |
|------|----------------|
| **Board of Directors** | Ultimate accountability for AML/CFT; approve Policy and risk appetite |
| **MLRO (Money Laundering Reporting Officer)** | Receive internal STRs; file STRs with FIC; oversee compliance programme |
| **Compliance Officer** | Implement Policy; design and maintain controls; train staff |
| **Operations / Backend Team** | Implement and maintain AML systems; ensure data integrity |
| **Admin Portal Staff** | Review flagged transactions; freeze/unfreeze accounts; support STR process |
| **Internal Audit** | Independent testing of AML controls |

---

## 1.4 Risk-Based Approach

Movasafe adopts a risk-based approach (RBA) to AML/CFT:

- **Customer risk:** Assessed at onboarding and periodically (e.g. KYC status, nationality, occupation, PEP status).
- **Product risk:** Higher risk for P2P transfers, escrow, and MoMo deposits/withdrawals due to velocity and anonymity.
- **Channel risk:** Mobile-only channel; risk mitigated by KYC (Persona) and transaction monitoring.
- **Geographic risk:** Rwanda-focused; cross-border flows (if any) require enhanced monitoring.

Risk levels: **Low**, **Medium**, **High**. Higher risk triggers Enhanced Due Diligence (EDD) and closer monitoring.

---

## 1.5 KYC / CDD / EDD Procedures

### Standard CDD (at onboarding)

- Identity verification via Persona (document + biometric).
- Collection of: full name, national ID, phone number, email, address (province, district, sector).
- Verification of phone number (OTP) and email.
- Contract acceptance (wallet terms).
- Transaction PIN setup.

### Enhanced Due Diligence (EDD)

Required when:

- Customer is a Politically Exposed Person (PEP) or close associate.
- High-risk jurisdiction.
- Unusual or complex transaction patterns.
- Customer risk score exceeds threshold.

EDD includes: source of funds/wealth, purpose of account, senior management approval, and ongoing monitoring.

### Ongoing Monitoring

- Periodic review of KYC data (at least annually for high-risk; biennially for others).
- Transaction monitoring (see Part 3).
- Re-verification when material changes occur.

---

## 1.6 Deposit Monitoring (MoMo)

- **Deposits** via MTN MoMo Collections API are monitored for:
  - Daily deposit limits.
  - Velocity (multiple deposits in short time).
  - Structuring (many small deposits to avoid thresholds).
  - Unusual amounts or timing.
- **Webhook handling:** MoMo webhook callbacks are processed by the backend; each deposit triggers AML checks before crediting the wallet.
- **Audit trail:** All deposit events and AML decisions are logged.

---

## 1.7 Withdrawal Monitoring

- **Withdrawals** to MoMo are monitored for:
  - Daily withdrawal limits.
  - Velocity (rapid withdrawals).
  - Round-tripping (deposit followed quickly by withdrawal).
  - Mismatch with stated purpose or profile.
- **Pre-withdrawal checks:** KYC status, risk score, wallet freeze status, and transaction limits are validated before processing.

---

## 1.8 Transaction Monitoring

- **P2P transfers** and **vendor payments** are monitored for:
  - Pattern analysis (e.g. layering, splitting).
  - High-value transactions.
  - Unusual counterparties or networks.
- **Escrow** transactions are monitored for abuse (e.g. fake escrow to facilitate fraud).
- Monitoring runs in real-time (at transaction time) and in batch (scheduled jobs).

---

## 1.9 Suspicious Activity Reporting

- **Internal reporting:** Staff must report suspicious activity to the MLRO without delay.
- **STR filing:** The MLRO assesses internal reports and files Suspicious Transaction Reports (STRs) with the Financial Intelligence Centre (FIC) when required.
- **No tipping-off:** Staff must not inform the customer or third parties that an STR has been or may be filed.
- **Documentation:** All decisions (file / not file) and supporting evidence are documented.

---

## 1.10 STR Reporting Workflow

1. Detection (automated rule or manual observation).
2. Alert creation and assignment to compliance officer.
3. Investigation (case file, evidence, timeline).
4. MLRO review and decision (file STR / close / escalate).
5. STR submission to FIC (if applicable).
6. Record retention and audit trail.

---

## 1.11 Account Freezing Procedures

- **Grounds:** Court order, FIC request, internal policy (e.g. confirmed fraud, STR filed).
- **Process:** Admin initiates freeze via backend; wallet status set to FROZEN; all debits blocked.
- **Audit:** Freeze reason, timestamp, and operator are stored in audit log.
- **Unfreeze:** Requires authorization and documented reason.

---

## 1.12 Record Keeping

- **Retention:** Minimum 5 years from end of business relationship or transaction.

- **Records to retain:**
  - KYC/CDD/EDD documentation.
  - Transaction records (amount, date, parties, reference).
  - STRs and related internal reports.
  - Freeze/unfreeze actions.
  - Training records.
  - Policy versions and audit logs.

- **Format:** Electronic records acceptable; must be retrievable and tamper-evident.

---

## 1.13 Staff Training

- **Training:** All relevant staff receive AML/CFT training upon hire and annually thereafter.
- **Content:** Legal obligations, red flags, internal procedures, STR process, record keeping.
- **Assessment:** Training completion and comprehension are assessed and documented.
- **Updates:** Training is updated when policy or regulations change.

---

## 1.14 Internal Audit

- **Frequency:** At least annually; more often if risk is elevated.
- **Scope:** Policy compliance, system effectiveness, STR quality, record keeping.
- **Reporting:** Findings reported to Board and senior management; corrective actions tracked.

---

## 1.15 Governance

- **Policy owner:** Compliance Officer.
- **Approval:** Board of Directors.
- **Review:** Annual review; ad-hoc when regulations or risk profile change.
- **Distribution:** Policy available to all staff; training ensures awareness.

---

## 1.16 Policy Review Schedule

| Trigger | Action |
|---------|--------|
| Annual | Full policy review |
| Regulatory change | Update policy and procedures |
| Material incident | Review and update as needed |
| New product/feature | Risk assessment and policy update |

---

# PART 2 — BACKEND AML ARCHITECTURE

## 2.1 System Context

Movasafe operates a Spring Boot microservices backend:

- **API Gateway** (port 8088): routing, JWT validation.
- **authentication-service** (8081): users, KYC (Persona), roles.
- **transaction-service** (8087): wallets, transactions, escrow, ledger.
- **audit-service** (8085): central audit log (Kafka consumer).
- **notification-service**: SMS (Africa’s Talking).

AML logic is implemented exclusively in backend services and admin portal. The mobile app is UI-only.

---

## 2.2 Proposed AML Service Modules

### Option A: Dedicated AML Service (Recommended)

Create a new `aml-service` module:

```
movasafe-backend-service/
├── aml-service/                    # NEW
│   ├── src/main/java/com/movasafe/aml/
│   │   ├── AmlServiceApplication.java
│   │   ├── config/
│   │   ├── controller/
│   │   ├── service/
│   │   │   ├── RiskScoringService.java
│   │   │   ├── TransactionMonitoringService.java
│   │   │   ├── AlertService.java
│   │   │   └── FreezeService.java
│   │   ├── repository/
│   │   ├── consumer/               # Kafka consumers
│   │   └── model/
│   └── schema.sql
```

### Option B: AML Logic Within Existing Services

- **transaction-service:** AML checks at deposit, withdrawal, P2P transfer.
- **authentication-service:** KYC status and risk flags for users.
- **audit-service:** AML event logging.

**Recommendation:** Hybrid. Start with AML logic in transaction-service and authentication-service; add aml-service when rules and volume grow.

---

## 2.3 Database Tables

### Core AML Tables

```sql
-- User risk scores (in authentication-service or aml-service)
CREATE TABLE aml_user_risk_score (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL,  -- LOW, MEDIUM, HIGH
    factors JSONB,                    -- contributing factors
    calculated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- AML transaction alerts
CREATE TABLE aml_transaction_alert (
    id UUID PRIMARY KEY,
    transaction_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rule_id VARCHAR(100) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,  -- LOW, MEDIUM, HIGH, CRITICAL
    action_taken VARCHAR(50),         -- BLOCKED, FLAGGED, MANUAL_REVIEW
    details JSONB,
    status VARCHAR(50) NOT NULL,      -- OPEN, UNDER_REVIEW, CLOSED, STR_FILED
    assigned_to UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    closed_by UUID,
    closure_reason TEXT
);

-- AML case (for investigation)
CREATE TABLE aml_case (
    id UUID PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    alert_ids UUID[],
    status VARCHAR(50) NOT NULL,      -- OPEN, UNDER_REVIEW, CLOSED, STR_FILED
    assigned_to UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    str_filed_at TIMESTAMP,
    str_reference VARCHAR(100)
);

-- Wallet freeze log
CREATE TABLE aml_wallet_freeze_log (
    id UUID PRIMARY KEY,
    wallet_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,      -- FREEZE, UNFREEZE
    reason TEXT NOT NULL,
    initiated_by UUID NOT NULL,
    initiated_at TIMESTAMP DEFAULT NOW(),
    duration_hours INT DEFAULT 0,
    reference_id VARCHAR(100)         -- FIC/court reference if applicable
);

-- AML rule configuration
CREATE TABLE aml_rule_config (
    id UUID PRIMARY KEY,
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,      -- BLOCK, FLAG, MANUAL_REVIEW
    threshold_json JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.4 Logs Schema

### AML Audit Log (extends audit-service)

```json
{
  "id": "uuid",
  "action": "AML_ALERT_CREATED",
  "entity": "AML_ALERT",
  "entityId": "alert-uuid",
  "actorId": "system|user-uuid",
  "actorType": "SYSTEM|USER|ADMIN",
  "details": {
    "ruleId": "DAILY_DEPOSIT_LIMIT",
    "transactionId": "txn-uuid",
    "userId": "user-uuid",
    "riskScore": 75,
    "actionTaken": "FLAGGED"
  },
  "sourceService": "transaction-service",
  "createdAt": "2026-02-11T14:47:10.385522"
}
```

---

## 2.5 Risk Scoring Engine

**Inputs:**

- KYC status (verified / not verified)
- Transaction history (volume, velocity, patterns)
- Wallet age
- Freeze history
- Alert history
- Geographic/occupation (if available)

**Output:** 0–100 risk score; LOW (0–39), MEDIUM (40–69), HIGH (70–100).

**Algorithm (simplified):**

```
base_score = 0
if !kyc_verified: base_score += 30
if velocity_anomaly: base_score += 25
if structuring_detected: base_score += 40
if previous_freeze: base_score += 20
if high_value_tx: base_score += 15
... (configurable weights)
```

---

## 2.6 Transaction Monitoring Engine

**Flow:**

```
Transaction Request (deposit/withdrawal/P2P)
    → Pre-Transaction AML Checks
        → KYC status
        → Wallet freeze status
        → Daily limit check
        → Velocity check
    → If BLOCK: reject request
    → If PASS: process transaction
    → Post-Transaction
        → Run batch rules (e.g. structuring)
        → Update risk score
        → Create alert if rule triggered
```

---

## 2.7 Alerts System

- **Storage:** `aml_transaction_alert` table.
- **Kafka:** Publish `aml-alert-created` for downstream (e.g. notification, dashboard).
- **Admin portal:** Consume alerts from API; display in compliance dashboard.

---

## 2.8 Webhook Handling for MoMo

**Deposit webhook flow:**

```
MTN MoMo → POST /api/webhooks/momo/collection
    → Validate signature
    → Parse payload (amount, reference, status)
    → AML pre-deposit checks:
        - Daily deposit limit
        - Velocity (deposits in last hour)
        - Structuring (many small deposits)
    → If BLOCK: return error; do not credit wallet
    → If PASS: credit wallet; log transaction
    → Post-deposit: run batch rules; create alert if needed
```

---

## 2.9 Freeze/Unfreeze Logic

**Freeze:**

- `POST /api/admin/wallets/{walletId}/freeze`
- Body: `{ reason, durationHours }`
- Backend: set wallet status to FROZEN; block all debits
- Log in `aml_wallet_freeze_log` and audit service

**Unfreeze:**

- `POST /api/admin/wallets/{walletId}/unfreeze`
- Body: `{ reason }`
- Backend: set wallet status to ACTIVE
- Log in `aml_wallet_freeze_log` and audit service

---

## 2.10 Audit Trail Design

| Event | Logged To | Fields |
|-------|-----------|--------|
| AML rule triggered | audit-service + aml_transaction_alert | rule_id, tx_id, user_id, risk_level, action |
| Wallet freeze | aml_wallet_freeze_log + audit-service | wallet_id, reason, operator, timestamp |
| STR filed | aml_case + audit-service | case_id, str_reference, MLRO |
| Risk score update | aml_user_risk_score | user_id, score, factors |

---

## 2.11 Check Timing Summary

| Check | When |
|-------|------|
| KYC status | Before first deposit; before high-value transaction |
| Wallet freeze | Before every debit |
| Daily deposit limit | At deposit (MoMo webhook) |
| Daily withdrawal limit | At withdrawal |
| Velocity (deposits) | At deposit |
| Velocity (withdrawals) | At withdrawal |
| Structuring | Batch (e.g. hourly) |
| High-value | Real-time |
| Round-tripping | Batch (e.g. daily) |
| Risk score | Continuous (on transaction + scheduled) |

---

# PART 3 — MONITORING RULES

## 3.1 Rule Definitions

### R1: Daily Deposit Limit

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Daily Deposit Limit Exceeded |
| **Logic** | Sum of MoMo deposits in last 24h > threshold |
| **Threshold** | 2,000,000 RWF (configurable) |
| **Risk Level** | MEDIUM |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | At deposit (real-time) |

---

### R2: Daily Withdrawal Limit

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Daily Withdrawal Limit Exceeded |
| **Logic** | Sum of MoMo withdrawals in last 24h > threshold |
| **Threshold** | 1,500,000 RWF (configurable) |
| **Risk Level** | MEDIUM |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | At withdrawal (real-time) |

---

### R3: Deposit Velocity

| Attribute | Value |
|-----------|-------|
| **Rule Name** | High Deposit Velocity |
| **Logic** | ≥ 5 deposits in 1 hour |
| **Threshold** | 5 deposits / 60 minutes |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | At deposit (real-time) |

---

### R4: Withdrawal Velocity

| Attribute | Value |
|-----------|-------|
| **Rule Name** | High Withdrawal Velocity |
| **Logic** | ≥ 5 withdrawals in 1 hour |
| **Threshold** | 5 withdrawals / 60 minutes |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | At withdrawal (real-time) |

---

### R5: Multiple Accounts Same ID

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Multiple Wallets Same National ID |
| **Logic** | Count of wallets linked to same national ID > 1 |
| **Threshold** | 2+ wallets |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | Batch (daily) |

---

### R6: Rapid Deposit + Withdrawal (Round-Tripping)

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Round-Tripping |
| **Logic** | Deposit within 24h followed by withdrawal of ≥ 80% within 48h |
| **Threshold** | 80% of deposit withdrawn within 48h |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | Batch (daily) |

---

### R7: Structuring (Many Small Deposits)

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Structuring – Multiple Small Deposits |
| **Logic** | ≥ 5 deposits in 24h, each < 200,000 RWF, total > 500,000 RWF |
| **Threshold** | 5 deposits, each < 200,000, total > 500,000 |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | Batch (hourly) |

---

### R8: Unusual Amount

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Unusual Transaction Amount |
| **Logic** | Single transaction > 1,000,000 RWF |
| **Threshold** | 1,000,000 RWF |
| **Risk Level** | MEDIUM |
| **Action** | FLAG |
| **When** | Real-time |

---

### R9: Unverified KYC High Value

| Attribute | Value |
|-----------|-------|
| **Rule Name** | High Value Without KYC |
| **Logic** | Transaction > 500,000 RWF and user KYC not verified |
| **Threshold** | 500,000 RWF |
| **Risk Level** | CRITICAL |
| **Action** | BLOCK |
| **When** | Real-time |

---

### R10: High-Risk User Score

| Attribute | Value |
|-----------|-------|
| **Rule Name** | High Risk User Transaction |
| **Logic** | User risk score ≥ 70 and any transaction |
| **Threshold** | 70 |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | Real-time |

---

### R11: P2P Velocity

| Attribute | Value |
|-----------|-------|
| **Rule Name** | P2P Transfer Velocity |
| **Logic** | ≥ 10 P2P transfers in 24h (same user) |
| **Threshold** | 10 transfers / 24h |
| **Risk Level** | MEDIUM |
| **Action** | FLAG |
| **When** | Real-time |

---

### R12: New Wallet High Activity

| Attribute | Value |
|-----------|-------|
| **Rule Name** | New Wallet High Activity |
| **Logic** | Wallet age < 7 days and total volume > 1,000,000 RWF |
| **Threshold** | 7 days, 1,000,000 RWF |
| **Risk Level** | HIGH |
| **Action** | FLAG + MANUAL_REVIEW |
| **When** | Batch (daily) |

---

### R13: Geographic Anomaly (Future)

| Attribute | Value |
|-----------|-------|
| **Rule Name** | Unusual Transaction Location |
| **Logic** | Transaction from IP/country inconsistent with user profile |
| **Threshold** | Configurable |
| **Risk Level** | MEDIUM |
| **Action** | FLAG |
| **When** | Real-time (when geo data available) |

---

# PART 4 — ADMIN PORTAL FEATURES

## 4.1 Compliance Dashboard Overview

**Route:** `/admin/compliance` or `/admin/aml-compliance`

**Sections:**

1. **Summary Cards:** Total alerts (open), high-risk users, frozen wallets, STRs filed (this month).
2. **Flagged Transactions List:** Table of alerts with filters.
3. **Suspicious Users List:** Users with risk score ≥ 70 or multiple alerts.
4. **Quick Actions:** Freeze, Unfreeze, Assign to case.

---

## 4.2 Flagged Transactions List

| Column | Description |
|--------|-------------|
| Date/Time | Alert creation time |
| Transaction ID | Link to transaction detail |
| User | Name, phone, user ID |
| Rule | Rule that triggered |
| Risk Level | LOW / MEDIUM / HIGH / CRITICAL |
| Amount | Transaction amount |
| Action | View, Assign, Dismiss |
| Status | OPEN / UNDER_REVIEW / CLOSED |

**Filters:** Date range, risk level, rule, status, user.

**Actions:** View details, Assign to case, Add note, Close (with reason).

---

## 4.3 Suspicious Users List

| Column | Description |
|--------|-------------|
| User | Name, phone, user ID |
| Risk Score | 0–100 |
| Risk Level | LOW / MEDIUM / HIGH |
| KYC Status | Verified / Not Verified |
| Alert Count | Open alerts |
| Wallet Status | Active / Frozen |
| Last Activity | Last transaction date |

**Actions:** View profile, Freeze wallet, View transactions, Create case.

---

## 4.4 Freeze/Unfreeze Button

- **Location:** User detail, wallet detail, or alert detail.
- **Freeze:** Modal: reason (required), duration (optional).
- **Unfreeze:** Modal: reason (required).
- **Backend:** Calls existing `POST /api/admin/wallets/{id}/freeze` and `unfreeze`.

---

## 4.5 KYC Review Panel

**Route:** `/admin/compliance/kyc-review`

- **List:** Users with KYC pending, failed, or expired.
- **Detail:** Persona verification result, documents, mismatch flags.
- **Actions:** Approve, Reject, Request re-verification.

**Data source:** authentication-service (Persona, KYC status).

---

## 4.6 Transaction History Viewer

**Route:** `/admin/compliance/transactions/{userId}` or `/admin/transactions`

- **Filters:** User, date range, type (deposit, withdrawal, P2P), status.
- **Columns:** Date, type, amount, counterparty, status, reference.
- **Actions:** View full detail, Export.

---

## 4.7 STR Report Generator

**Route:** `/admin/compliance/str`

- **Form:** Case selection, date range, narrative, attachments.
- **Output:** PDF/CSV for FIC submission.
- **Content:** User details, transaction summary, timeline, rationale.
- **Audit:** Log STR generation and submission.

---

## 4.8 Export to CSV/PDF

- **Flagged transactions:** Export filtered list.
- **User list:** Export suspicious users.
- **Case file:** Export case with transactions and notes.
- **Audit logs:** Export AML audit logs (date range).

---

## 4.9 Audit Logs

**Route:** `/admin/audit-logs` (existing)

- **Filters:** Resource = `aml`, action type.
- **Display:** AML events (alerts, freezes, STRs, risk score updates).

---

## 4.10 Risk Score Display

- **Location:** User detail, wallet detail, compliance dashboard.
- **Display:** Score 0–100, risk level (LOW/MEDIUM/HIGH), last updated.
- **Drill-down:** Contributing factors (e.g. velocity, structuring).

---

## 4.11 Limit Configuration Settings

**Route:** `/admin/settings` (extend) or `/admin/compliance/settings`

- **Configurable:** Daily deposit limit, daily withdrawal limit, rule thresholds.
- **Storage:** `aml_rule_config` or system settings.
- **Permissions:** Compliance Officer or Admin only.

---

## 4.12 Case Management System

**Route:** `/admin/compliance/cases`

- **Case:** Group of related alerts; assigned investigator; status.
- **Fields:** Case number, user, alerts, status, timeline, notes.
- **Workflow:** Create → Assign → Investigate → Close / File STR.
- **Audit:** All actions logged.

---

# PART 5 — STANDARD OPERATING PROCEDURES

## 5.1 How to Review a Suspicious Deposit

1. **Receive alert** from dashboard or queue.
2. **Open transaction detail** – view amount, date, source (MoMo), user.
3. **Open user profile** – KYC status, risk score, transaction history.
4. **Check rules** – which rule triggered and why.
5. **Assess** – Is there a reasonable explanation? (e.g. salary, refund.)
6. **Document** – Add note in case/alert with reasoning.
7. **Decide:**
   - **No concern:** Close alert with reason; no STR.
   - **Suspicious:** Escalate to MLRO; create/update case.
   - **Immediate risk:** Consider freeze; escalate to MLRO.

---

## 5.2 How to Freeze a Wallet

1. **Verify authority** – Ensure you have permission to freeze.
2. **Confirm identity** – Wallet ID, user ID, user name.
3. **Document reason** – e.g. STR filed, court order, internal policy.
4. **Navigate** to admin portal → Wallet or User → Freeze.
5. **Enter reason** (required) and optional duration.
6. **Submit** – Backend sets status to FROZEN.
7. **Verify** – Confirm wallet shows FROZEN; all debits blocked.
8. **Log** – Ensure freeze is recorded in audit log.

---

## 5.3 How to Unfreeze a Wallet

1. **Verify authority** – Ensure you have permission to unfreeze.
2. **Confirm grounds** – e.g. investigation closed, no STR, court order lifted.
3. **Document reason** (required).
4. **Navigate** to admin portal → Wallet or User → Unfreeze.
5. **Enter reason** and submit.
6. **Verify** – Confirm wallet shows ACTIVE.
7. **Log** – Ensure unfreeze is recorded.

---

## 5.4 How to File an STR

1. **MLRO receives** internal report or escalated case.
2. **Investigate** – Gather evidence, timeline, user data.
3. **Assess** – Decide whether STR is required under Law 51/2018.
4. **Prepare STR** – Use FIC format; include narrative, transactions, parties.
5. **Submit** to FIC via prescribed channel.
6. **Record** – Document STR reference, date, case number.
7. **No tipping-off** – Do not inform customer or third parties.
8. **Follow-up** – Comply with FIC requests; maintain records.

---

## 5.5 How to Escalate a Case

1. **Identify** case that requires escalation (e.g. high risk, MLRO input).
2. **Assign** to MLRO or senior compliance officer.
3. **Provide** summary, evidence, timeline.
4. **MLRO reviews** and decides: file STR, close, or further investigation.
5. **Document** – Escalation and decision recorded in case file.

---

## 5.6 How to Respond to Regulator Request

1. **Receive** request from FIC or BNR (e.g. information request).
2. **Acknowledge** – Confirm receipt and timeline.
3. **Escalate** to MLRO and legal if needed.
4. **Gather** requested information (e.g. transactions, KYC).
5. **Review** – Ensure accuracy and completeness.
6. **Submit** – Via prescribed channel; retain copy.
7. **Document** – Record request, response, and date.

---

## 5.7 How to Handle a MoMo Deposit Webhook (Technical)

1. **Receive** webhook at `POST /api/webhooks/momo/collection`.
2. **Validate** signature and payload.
3. **Run AML checks** – Daily limit, velocity, structuring.
4. **If BLOCK:** Return error; do not credit wallet; log.
5. **If PASS:** Credit wallet; log transaction.
6. **Post-process:** Run batch rules; create alert if triggered.
7. **Audit** – All steps logged.

---

## 5.8 How to Close an Alert Without STR

1. **Review** alert and evidence.
2. **Confirm** no reasonable grounds for STR.
3. **Add note** – e.g. "Legitimate business activity; salary deposit."
4. **Close** alert with status CLOSED.
5. **Select** closure reason (e.g. no_suspicion, duplicate, false_positive).
6. **Submit** – Alert closed; audit trail updated.

---

## Appendix A – Acronyms

| Term | Meaning |
|------|---------|
| AML | Anti-Money Laundering |
| CFT | Countering the Financing of Terrorism |
| CDD | Customer Due Diligence |
| EDD | Enhanced Due Diligence |
| FIC | Financial Intelligence Centre (Rwanda) |
| BNR | National Bank of Rwanda |
| KYC | Know Your Customer |
| MLRO | Money Laundering Reporting Officer |
| PEP | Politically Exposed Person |
| STR | Suspicious Transaction Report |
| FATF | Financial Action Task Force |

---

## Appendix B – Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 2026 | Compliance / Technology | Initial draft |

---

*This document is confidential and intended for internal use by Movasafe. It should be reviewed by legal and compliance before implementation and regulatory submission.*
