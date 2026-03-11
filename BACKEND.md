# Movasafe Backend – Full Overview

This document describes the **Movasafe** backend: a Spring Boot / Spring Cloud microservices system for authentication, transactions, escrow, lending, notifications, and audit.

---

## 1. Architecture Overview

- **API Gateway** (Spring Cloud Gateway): single entry point, JWT validation, route to backend services.
- **Discovery Service** (Netflix Eureka): service registration and discovery (optional per environment).
- **Backend services**: each with its own PostgreSQL (or shared DB per env), optional Redis (auth), and Kafka for events.

### High-level flow

- Clients call the **API Gateway** (e.g. port **8088** locally).
- Gateway validates JWT (except excluded paths), then routes by path to the right service.
- Services register with **Eureka** when enabled (dev/prod).
- **Kafka** is used for: audit logs (`auditLog-events`), loan events (`loan-disbursed`, `repayment-made`, `loan-closed`, `loan-defaulted`, `repayment-reminder`).

---

## 2. Services Summary

| Service | Purpose | Default port (local) | Tech |
|--------|---------|------------------------|------|
| **api-gateway** | Routing, JWT auth, CORS | 8088 | Spring Cloud Gateway, WebFlux, JJWT |
| **discovery-service** | Eureka server | 8761 (config) / 5000 | Spring Boot 2.7, Eureka Server |
| **authentication-service** | Users, auth, KYC, vendors, contracts, roles | 8081 | Spring Boot 3.1, JPA, Security, Redis, Kafka, Persona, Mail |
| **transaction-service** | Wallets, escrow, transactions, evidence, debt, admin | 8087 | Spring Boot 3.1, JPA, Kafka, S3, ShedLock |
| **notification-service** | Notifications, SMS (Africa’s Talking), loan events | 8088 (dev) | Spring Boot 3.1, JPA, Kafka, Thymeleaf |
| **audit-service** | Central audit log (consumes Kafka) | 8085 (dev) | Spring Boot 3.1, JPA, Kafka |
| **lending-service** (loan-service) | Loans, credit, offers, repayments | 8090 | Spring Boot 3.1, JPA, Kafka, ShedLock |

---

## 3. API Gateway

- **Application**: `com.movasafe.rw.api_gateway.ApiGatewayApplication`
- **Port**: `8088` (local, `SERVER_PORT`).
- **Config**: `application.yml`, `application-local.yml`, `application-dev.yml`, `application-prod.yml`.

### Behaviour

- Validates JWT on all routes **except** excluded URLs (e.g. `/api/auth/open/**`, `/api/auth/roles/**`, `/swagger-ui.html`, persona webhook, etc.).
- CORS: configurable origins/methods/headers (e.g. `http://localhost:4000`, `https://movasafe.com`).
- Health: `/actuator/health`, readiness/liveness when enabled.

### Routes (local example)

| Path | Target service | URI (local) |
|------|----------------|-------------|
| `/api/auth/**` | authentication-service | http://localhost:8081 |
| `/api/contracts/**` | authentication-service | http://localhost:8081 |
| `/api/notifications/**` | notification-service | lb://movasafe-notification-service |
| `/api/transactions/**` | transaction-service | http://localhost:8085 (local: 8087) |
| `/api/escrows/**` | transaction-service | http://localhost:8085 (local: 8087) |
| `/api/audit-logs/**` | audit-service | lb://movasafe-audit-service |
| `/api/lending/**` | lending-service | http://localhost:8090 |
| `/eureka/**` | Eureka | `${EUREKA_DEFAULT_ZONE}` |

Dev/prod use hostnames (e.g. `http://movasafe-authentication-service:8081`) and may use different ports per profile.  
**Note**: Routes for `/api/evidence/**`, `/api/admin/**`, `/api/debt/**` are not defined in gateway snippets above; if needed, they can be added (e.g. to transaction-service) or served under existing `/api/transactions/**` if the app is structured that way.

---

## 4. Discovery Service

- **Application**: `com.movasafe.discovery_service.DiscoveryServiceApplication`
- **Port**: `5000` (or `SERVER_PORT`), Eureka dashboard often at `8761` depending on config.
- **Role**: Eureka server for service registration/discovery; gateway and other services can use `lb://<service-name>` when Eureka is enabled.

---

## 5. Authentication Service

- **Application**: `com.movasafe.rw.AuthenticationServiceApplication`
- **Port**: `8081` (local), `5000` (default in base config).
- **DB**: PostgreSQL (JPA, `ddl-auto: update`).
- **Extra**: Redis (session/cache), Kafka (producer, e.g. audit), Persona (KYC), Mail, Thymeleaf, Caffeine cache, OpenAPI/Swagger.

### Main controllers and paths

| Path | Controller | Purpose |
|------|------------|---------|
| `/api/auth/open/**` | AuthenticationController | Register, sign-in, OTP, confirm account, reset password |
| `/api/auth/users/**` | UserController | User management |
| `/api/auth/users/preferences` | UserPreferencesController | User preferences |
| `/api/auth/users/beneficiaries` | BeneficiaryController | Beneficiaries |
| `/api/auth/kyc/**` | KycController | KYC |
| `/api/auth/roles` | RoleController | Roles |
| `/api/auth/permissions` | PermissionController | Permissions |
| `/api/auth/services` | ServiceCategoryController | Service categories |
| `/api/auth/vendors` | VendorDirectoryController | Vendor directory |
| `/api/auth/webhooks/**` | PersonaWebhookController | Persona webhooks |
| `/api/contracts/**` | UserContractController, VendorContractController, ContractAdminController | User/vendor/admin contracts |
| `/api/admin/contracts` | ContractAdminController | Admin contracts |
| Health | HealthController | Health check |

---

## 6. Transaction Service

- **Application**: `com.movasafe.transaction_service.TransactionServiceApplication`
- **Port**: `8087` (local), `5000` (default in base config).
- **DB**: PostgreSQL; ledger as source of truth, `Transaction` as projection (see `docs/TRANSACTION_SERVICE_LEDGER_ARCHITECTURE.md`).
- **Extra**: Kafka (producer/consumer), AWS S3 (evidence presigned URLs), ShedLock (scheduled jobs), Caffeine cache, OpenAPI.

### Main controllers and paths

| Path | Controller | Purpose |
|------|------------|---------|
| `/api/transactions/**` | TransactionController | Transactions |
| `/api/transactions/wallets` | WalletController | Wallets |
| `/api/transactions/users/payment-preferences` | PaymentPreferencesController | Payment preferences |
| `/api/transactions/internal/**` | InternalLoanController | Internal loan disbursement/repayment (internal API key) |
| `/api/escrows/**` | EscrowController | Escrow |
| `/api/evidence/**` | EvidenceController | Evidence (e.g. S3 presigned URLs) |
| `/api/admin` | AdminController | Admin |
| `/api/admin/system-settings` | SystemSettingsController | System settings |
| `/api/admin/restrictions/rules` | DebtRestrictionRuleController | Debt restriction rules |
| `/api` (debt) | DebtController | Debt |
| Health | HealthController | Health |

### Important concepts

- **Ledger**: `ledger_batches` and `ledger_entries` are the single source of truth for money movement.
- **Wallet balance**: Cache derived from ledger; business rules must use ledger-based balance (e.g. `LedgerService.getBalance`) where correctness is required.
- **Transaction table**: Projection for UI/reporting; can be rebuilt from ledger.
- **Internal API**: Loan service calls transaction-service for disbursement/repayment via internal API key (`movasafe.internalApiKey`).

---

## 7. Notification Service

- **Application**: `com.movasafe.notification_service.NotificationServiceApplication`
- **Port**: `5000` (base), `8088` (dev gateway reference).
- **DB**: PostgreSQL (if used for notification persistence).
- **Extra**: Kafka (consumer for loan events), Africa’s Talking (SMS), Thymeleaf, OpenAPI.

### Main controllers and paths

| Path | Controller | Purpose |
|------|------------|---------|
| `/api/notifications/**` | NotificationController, MessageNotificationController | Notifications (e.g. send forgot-password) |

### Kafka consumers

- `loan-disbursed`, `repayment-made`, `loan-closed`, `loan-defaulted`, `repayment-reminder` (group: `notification-service-group`).

---

## 8. Audit Service

- **Application**: `com.movasafe.audit_service.AuditServiceApplication`
- **Port**: `8085` (dev gateway), `5000` (base).
- **DB**: PostgreSQL (audit log storage).
- **Extra**: Kafka consumer, JWT, OpenAPI.

### Main controllers and paths

| Path | Controller | Purpose |
|------|------------|---------|
| `/api/audit-logs/**` | AuditLogController | Query/export audit logs |

### Kafka consumer

- Topic: `auditLog-events` (group: `auditLog-service-group`). Other services (e.g. authentication, transaction) produce audit events to this topic.

---

## 9. Lending Service (Loan Service)

- **Application**: `com.movasafe.loan_service.LoanServiceApplication`
- **Artifact**: `loan-service`; folder: `lending-service`.
- **Port**: `8090`.
- **DB**: PostgreSQL (Flyway/schema scripts in `schema.sql`).
- **Extra**: Kafka (loan events when enabled), ShedLock (scheduled jobs), OpenAPI; calls transaction-service (internal API) and auth for user resolution.

### Main controllers and paths

| Path | Controller | Purpose |
|------|------------|---------|
| `/api/lending/**` | LoanController, CreditController | Loans, credit |
| `/api/lending/admin` | LoanAdminController | Admin lending |
| Root | RootController | Simple root/health-style |

### Loan Kafka events (when `movasafe.kafka.loan-events-enabled` is true)

- Published for: loan disbursed, repayment, loan closed, defaulted, reminders; consumed by notification-service (and optionally others).

---

## 10. Technology Stack (summary)

- **Java**: 17 (22 for some modules).
- **Spring Boot**: 3.1.x (gateway, auth, transaction, notification, audit, lending); 2.7.x (discovery).
- **Spring Cloud**: 2022.0.x (Eureka client, Config, Gateway where used).
- **Data**: PostgreSQL, JPA/Hibernate; Redis (authentication-service).
- **Messaging**: Apache Kafka (audit, loan events).
- **Auth**: JWT (JJWT), Spring Security; internal API key for service-to-service (e.g. lending → transaction).
- **Docs**: SpringDoc OpenAPI (Swagger) in auth, transaction, notification, audit, lending.
- **Infra**: AWS S3 (transaction-service evidence), Africa’s Talking (notification-service), Persona (authentication-service KYC).

---

## 11. Configuration and environment

- **Profiles**: `local`, `dev`, `prod` (per service).
- **Secrets**: JWT secret (`MOVASAFE_JWT_SECRET`), DB credentials, Redis, Kafka, Persona, Africa’s Talking, AWS, internal API key – set via env or profile-specific YAML.
- **Gateway excluded URLs**: Listed in `api-gateway` `application.yml` (e.g. open auth, Swagger, persona webhook); no JWT required for these paths.
- **Ports (local reference)**: Gateway 8088, Auth 8081, Transaction 8087, Lending 8090, Notification 8088, Audit 8085, Discovery 5000/8761.

---

## 12. Existing documentation

- `docs/TRANSACTION_SERVICE_LEDGER_ARCHITECTURE.md` – Ledger vs projection, balances, loan traceability.
- `docs/REGISTRATION_FLOW.md` – Registration flow.
- `docs/MOBILE_KYC_VENDOR_SERVICES.md` – Mobile KYC and vendor services.

---

## 13. Repository layout (high level)

```
movasafe-backend-service/
├── api-gateway/
├── discovery-service/
├── authentication-service/
├── transaction-service/
├── notification-service/
├── audit-service/
├── lending-service/
└── docs/
    ├── BACKEND.md
    ├── TRANSACTION_SERVICE_LEDGER_ARCHITECTURE.md
    ├── REGISTRATION_FLOW.md
    └── MOBILE_KYC_VENDOR_SERVICES.md
```

Each service is a separate Maven module (parent not necessarily in repo root); run each via its `*Application` main class or `spring-boot:run` in its directory.
