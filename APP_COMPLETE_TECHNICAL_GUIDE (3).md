# MoveRwanda FinTech Mobile App - Complete Technical Guide

**Application Name**: MoveRwanda  
**Version**: 1.0.0  
**Platform**: React Native (Expo)  
**Backend**: AWS Elastic Beanstalk Microservices  
**Last Updated**: February 2026

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [Screen-by-Screen Implementation](#screen-by-screen-implementation)
5. [AWS Backend Integration](#aws-backend-integration)
6. [Data Flow & Services](#data-flow--services)
7. [State Management](#state-management)
8. [Unimplemented Features](#unimplemented-features)
9. [Testing & Deployment](#testing--deployment)

---

## Application Overview

### Purpose
MoveRwanda is a fintech mobile application enabling secure peer-to-peer payments, money transfers, vendor payments, and escrow management in Rwanda. The app provides KYC verification, wallet management, transaction history, and user profile management with strong security practices.

### Key Features
- **User Authentication**: Phone/Email + Password login with OTP verification
- **Wallet Management**: View balance, send/request money, transaction history
- **Transfers**: P2P money transfers with automatic escrow
- **Payments**: Vendor payment processing with escrow protection
- **KYC Verification**: Persona-based identity verification
- **Contract Management**: User/Vendor wallet contract acceptance
- **Transaction Export**: Export transaction history as PDF/Email
- **Notifications**: In-app notification system
- **Settings**: User preferences, PIN/Password management

### Technology Stack
- **Frontend**: React Native + Expo (iOS/Android)
- **State Management**: Redux (store slices) + React Context (auth)
- **HTTP Client**: Axios with custom interceptors
- **Backend Services**: 
  - Auth Service: `https://auth.movasafe.com`
  - Transaction Service: `https://transaction.movasafe.com`
- **Database**: AWS-hosted (backend handled)
- **Identity Verification**: Persona SDK integration

---

## Architecture

### Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   REACT NATIVE MOBILE APP                        │
│                      (Expo Framework)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PRESENTATION LAYER                      │ │
│  │  • Screens (20+ screens across 8 features)                │ │
│  │  • Components (Navigation, UI, Forms, Modals)             │ │
│  │  • Styling (LinearGradient, Colors, Themes)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   STATE MANAGEMENT LAYER                   │ │
│  │  • Redux Store (auth, user, wallet, notifications slices) │ │
│  │  • React Context (AuthContext, ThemeContext)              │ │
│  │  • Local Component State (UI state)                        │ │
│  │  • AsyncStorage (persisted auth tokens)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  BUSINESS LOGIC LAYER                      │ │
│  │  • Services (auth, kyc, wallet, transactions, etc.)       │ │
│  │  • API Client (axios with interceptors)                   │ │
│  │  • Error Handling & Logging                               │ │
│  │  • Data Validation & Transformation                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    HTTP CLIENT LAYER                       │ │
│  │  • Axios Instance with custom interceptors                │ │
│  │  • Request: Token injection, endpoint whitelisting         │ │
│  │  • Response: Error handling, token refresh                 │ │
│  │  • Endpoint routing based on microservice config           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              AWS ELASTIC BEANSTALK MICROSERVICES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │   AUTH SERVICE           │    │  TRANSACTION SERVICE     │  │
│  │ https://auth.movasafe.   │    │ https://transaction.     │  │
│  │      com/api/auth        │    │   movasafe.com/api/      │  │
│  │                          │    │                          │  │
│  │ • Registration           │    │ • Create Transfer        │  │
│  │ • Login/Logout           │    │ • Send Money             │  │
│  │ • KYC Management         │    │ • Create Escrow          │  │
│  │ • Contract Acceptance    │    │ • Vendor Payments        │  │
│  │ • User Profile           │    │ • Transaction History    │  │
│  │ • Password/PIN Reset     │    │ • Transaction Export     │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
│         ↓                                      ↓                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    POSTGRES DATABASE                        │ │
│  │  • Users, Accounts, Transactions, Contracts, KYC Data      │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  PERSONA SDK (3RD PARTY)                   │ │
│  │  • Identity Verification & Document Upload                │ │
│  │  • Biometric Verification                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
mova_safe_v01/
├── App.js                              # Root app component, navigation setup
├── app.json                            # Expo configuration, new projectId
├── eas.json                            # EAS build configuration
├── package.json                        # Dependencies, scripts
├── jest.config.js                      # Jest testing configuration
│
├── config/                             # Configuration files
│   ├── api.config.js                   # API endpoints mapping
│   ├── env.config.js                   # Environment variables
│   ├── microservices.config.js         # AWS service URLs
│   └── Colors.js                       # Theme colors
│
├── context/                            # React Context (global state)
│   ├── AuthContext.js                  # Authentication state + login/logout
│   └── ThemeContext.js                 # UI theme state
│
├── src/
│   ├── features/                       # Feature modules (main business logic)
│   │   ├── auth/                       # Authentication & Registration
│   │   │   ├── screens/                # Auth screens (20 screens)
│   │   │   ├── auth.service.js         # Auth API service
│   │   │   ├── transactionPin.service.js
│   │   │   ├── user-contract.service.js
│   │   │   └── oauth.service.js        # Google/Apple login
│   │   │
│   │   ├── wallet/                     # Wallet & Home screen
│   │   │   ├── screens/                # Wallet screens (6 screens)
│   │   │   ├── wallet.service.js       # Wallet API service
│   │   │   └── index.js                # Feature exports
│   │   │
│   │   ├── transactions/               # Money transfers & escrow
│   │   │   ├── screens/                # Transaction screens (9 screens)
│   │   │   ├── transactions.service.js # Transaction API service
│   │   │   ├── transaction-export.service.js
│   │   │   ├── evidence.service.js
│   │   │   └── index.js
│   │   │
│   │   ├── kyc/                        # KYC verification
│   │   │   ├── screens/                # KYC screens (5 screens)
│   │   │   ├── kyc.service.js          # KYC API service
│   │   │   └── index.js
│   │   │
│   │   ├── profile/                    # User profile management
│   │   │   ├── screens/                # Profile screens (2 screens)
│   │   │   ├── user.service.js         # User profile API service
│   │   │   └── index.js
│   │   │
│   │   ├── settings/                   # App settings
│   │   │   ├── screens/                # Settings screens (3+ screens)
│   │   │   └── index.js
│   │   │
│   │   ├── notifications/              # Push notifications
│   │   │   ├── screens/                # Notifications screen
│   │   │   └── index.js
│   │   │
│   │   └── beneficiaries/              # Saved payment recipients
│   │       ├── screens/
│   │       ├── beneficiaries.service.js
│   │       └── index.js
│   │
│   ├── store/                          # Redux store
│   │   ├── authSlice.js                # Auth state reducer
│   │   ├── notificationSlice.js        # Notifications state
│   │   └── store.js                    # Store configuration
│   │
│   ├── services/                       # Core services
│   │   └── kyc.service.js              # KYC service (alternate)
│   │
│   └── components/                     # Reusable UI components
│       └── ModernSuccessModal.js       # Success modal component
│
├── utils/                              # Utility functions
│   ├── apiClient.js                    # Axios HTTP client with interceptors
│   ├── errorHandler.js                 # Error handling & formatting
│   ├── personaClient.js                # Persona SDK wrapper
│   ├── webhookHandler.js               # Webhook event handling
│   ├── webhookExamples.js              # Webhook examples documentation
│   └── identityMatcher.js              # ID matching utility
│
├── components/                         # Global components
│   └── LoadingSpinner.js               # Loading indicator
│
├── constants/                          # Constants
│   └── Colors.js                       # Color definitions
│
├── plugins/                            # Expo plugins
│   └── withPersonaSDK.js               # Persona SDK Expo plugin
│
├── assets/                             # Images, icons
├── android/                            # Android native code
├── __tests__/                          # Test files
│   ├── security/                       # Security tests
│   ├── store/                          # Redux store tests
│   └── transactions/                   # Transaction tests
│
├── docs/                               # Documentation (30+ docs)
│   ├── START_HERE.md                   # Quick start guide
│   ├── TECHNICAL_DOCUMENTATION.md      # Technical overview
│   ├── FRONTEND_ARCHITECTURE.md        # Architecture details
│   ├── KYC_AND_CONTRACT_IMPLEMENTATION.md
│   ├── API_ENDPOINTS_IMPLEMENTATION.md
│   ├── BACKEND_TRANSACTION_DETAILS_UPDATE.md
│   └── ... (20+ more documentation files)
│
└── screens/                            # Legacy screen files (deprecated)
```

---

## Authentication Flow

### User Registration Flow (Complete)

**Status**: ✅ FULLY IMPLEMENTED & ROBUST

**Flow Sequence**:
```
Welcome Screen
    ↓
Login Selection (Phone/Email)
    ↓
Register Step 1 (All 9 Fields)
    • firstname, lastname, email, phoneNumber
    • password (5 digits minimum), national ID
    • gender, province, district, sector
    • Terms acceptance checkbox
    ↓
Backend: POST /api/auth/open/register
    • Creates user with status NOT_READY
    • Sends OTP to email/phone
    • Returns success response
    ↓
Register OTP Screen
    • User enters OTP from email
    ↓
Backend: POST /api/auth/users/verify-otp
    • Validates OTP code
    • Confirms phone/email ownership
    • User status still NOT_READY
    ↓
Set Transaction PIN Screen
    • User enters new PIN (4-6 digits)
    • Confirms PIN
    ↓
Backend: POST /api/auth/users/set-transaction-pin-by-contact
    • Sets transaction PIN
    • User status changes to ACTIVE
    ↓
User Contract Screen
    • Display wallet contract terms
    • User must scroll to read entire contract
    • User checks acceptance box
    • User clicks Accept button
    ↓
Backend: POST /api/contracts/user/wallet/accept
    • Records contract acceptance
    • Verifies user acceptance
    ↓
Auto-Login (NEW FIX - Feb 2026)
    • Context's login() method called
    • Sends: { emailOrPhoneNumber, password: loginPassword }
    ↓
Backend: POST /api/auth/open/signin
    • Authenticates with password
    • Returns JWT token + user data
    • RootNavigator detects isAuthenticated=true
    ↓
AppStack Navigation
    • RootNavigator switches from AuthStack to AppStack
    • User redirected to Home screen
    • Registration complete ✅
```

**Password Requirements**:
- Exactly 5 digits (0-9 only)
- No special characters or letters
- Example: `12345`

**Transaction PIN Requirements**:
- 4-6 digits (0-9 only)
- Used for sensitive operations like transfers

**API Endpoints Used**:
1. `POST /api/auth/open/register` - Initial registration
2. `POST /api/auth/users/verify-otp` - OTP verification
3. `POST /api/auth/users/set-transaction-pin-by-contact` - PIN setup
4. `POST /api/contracts/user/wallet/accept` - Contract acceptance
5. `POST /api/auth/open/signin` - Auto-login after registration

**Whitelisted Endpoints** (no JWT required):
```javascript
// In apiClient.js - allows registration without token:
const whitelistedEndpoints = [
  '/api/auth/open/register',
  '/api/auth/open/signin',
  '/api/auth/users/verify-otp',
  '/api/auth/users/set-transaction-pin-by-contact',
  '/api/contracts/user/wallet/accept',
  '/api/contracts/user/wallet/get',
  '/api/contracts/vendor/wallet/accept',
  '/api/contracts/vendor/wallet/get',
];
```

### Login Flow (Existing User)

**Status**: ✅ FULLY IMPLEMENTED

```
Welcome Screen
    ↓
Login Selection (Phone/Email)
    ↓
Login Password Screen
    • User enters email/phone
    • User enters password
    ↓
Backend: POST /api/auth/open/signin
    • Validates credentials
    • Returns JWT token + user data
    ↓
AuthContext.login() called
    • Saves token to AsyncStorage
    • Updates auth state
    • RootNavigator detects isAuthenticated=true
    ↓
AppStack Navigation
    • User navigated to Home screen
    • Session established ✅
```

### Logout Flow

**Status**: ✅ IMPLEMENTED

- Clears AsyncStorage tokens
- Updates AuthContext state
- RootNavigator redirects to AuthStack
- No backend logout endpoint needed

---

## Screen-by-Screen Implementation

### Authentication Screens (20 screens)

#### 1. **WelcomeScreen**
- **Status**: ✅ FULLY IMPLEMENTED
- **Path**: `src/features/auth/screens/WelcomeScreen.js`
- **Purpose**: Entry point with animated card UI
- **Features**:
  - Animated blue and yellow cards with spring animations
  - "Get Started" button navigation
  - No backend calls
- **Navigation**:
  - "Get Started" → LoginScreen
- **Backend Integration**: None
- **Error Handling**: None (UI only)

#### 2. **LoginScreen**
- **Status**: ✅ FULLY IMPLEMENTED
- **Path**: `src/features/auth/screens/LoginScreen.js`
- **Purpose**: User selects login method (phone or email)
- **Features**:
  - Phone number input with country code
  - Email input option
  - "Continue" button
  - Input validation
- **Navigation**:
  - Phone → VerifyNumberScreen
  - Email → LoginPasswordScreen
- **Backend Integration**: None (client-side routing only)
- **Validation**:
  - Phone: 10 digits for Rwanda (+250)
  - Email: Valid email format

#### 3. **VerifyNumberScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/auth/screens/VerifyNumberScreen.js`
- **Purpose**: OTP verification for phone login
- **Features**:
  - Display phone number
  - OTP input (6 digits)
  - Resend OTP button with cooldown timer
- **Navigation**:
  - Valid OTP → VerifiedScreen
  - Invalid OTP → Error alert
- **Backend Integration**: 
  - `POST /api/auth/users/verify-otp` - OTP verification
- **Error Handling**: Display error alerts for invalid OTP

#### 4. **VerifiedScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/auth/screens/VerifiedScreen.js`
- **Purpose**: Success screen after OTP verification
- **Features**:
  - Displays verification success
  - Continue button
- **Navigation**:
  - "Continue" → LoginPasswordScreen
- **Backend Integration**: None
- **Error Handling**: None

#### 5. **LoginPasswordScreen**
- **Status**: ✅ FULLY IMPLEMENTED
- **Path**: `src/features/auth/screens/LoginPasswordScreen.js`
- **Purpose**: User enters password to login
- **Features**:
  - Email/Phone input (pre-filled if coming from VerifyNumber)
  - Password input with toggle visibility
  - "Login" button
  - "Forgot Password?" link
  - Sign up redirect
- **Navigation**:
  - Valid credentials → Auto-detected based on auth context
  - Forgot Password → ForgotPasswordScreen
  - Sign Up → RegisterStep1Screen
- **Backend Integration**:
  - `POST /api/auth/open/signin` - User login
  - Calls `authService.login({ emailOrPhoneNumber, password })`
- **Error Handling**:
  - Display error alerts for invalid credentials
  - Show loading spinner during login
  - Clear password on error
- **Key Code**:
  ```javascript
  const handleLogin = async () => {
    setIsLoading(true);
    const result = await login({ emailOrPhoneNumber, password });
    if (result.success) {
      // RootNavigator auto-redirects to AppStack
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };
  ```

#### 6. **RegisterStep1Screen**
- **Status**: ✅ FULLY IMPLEMENTED (Updated Feb 2026)
- **Path**: `src/features/auth/screens/RegisterStep1Screen.js`
- **Purpose**: Collect all registration data in one form
- **Features**:
  - Collects 9 required fields:
    1. First Name (text)
    2. Last Name (text)
    3. Email (email)
    4. Phone Number (phone with country code +250)
    5. Password (5 digits minimum, numbers only)
    6. Confirm Password (must match)
    7. National ID (text)
    8. Gender (dropdown: Male/Female/Other)
    9. Location (Province/District/Sector/Description)
  - Form validation
  - Modern UI with gradient buttons
  - Terms of Service checkbox
- **Navigation**:
  - "Register" → RegisterOtpScreen
  - "Back" → LoginScreen
- **Backend Integration**:
  - `POST /api/auth/open/register` - Initial registration
  - No JWT required (whitelisted endpoint)
- **Error Handling**:
  - Validates all fields before submission
  - Shows validation errors inline
  - Display alert for registration errors
- **Key Validations**:
  ```javascript
  // Password: exactly 5 digits
  password.match(/^\d{5}$/) // Must be true
  
  // Phone: 10 digits
  phoneNumber.match(/^\d{10}$/) // Must be true
  
  // National ID: letters/numbers
  nationalId.match(/^[A-Z0-9]+$/)
  
  // All fields required
  ```

#### 7. **RegisterOtpScreen**
- **Status**: ✅ FULLY IMPLEMENTED (Updated Feb 2026)
- **Path**: `src/features/auth/screens/RegisterOtpScreen.js`
- **Purpose**: Verify OTP sent during registration
- **Features**:
  - Display email/phone that OTP was sent to
  - 6-digit OTP input
  - Resend OTP button with cooldown timer
  - Validation before proceeding
- **Navigation**:
  - Valid OTP → SetTransactionPinRegistrationScreen
  - Invalid OTP → Error alert
- **Backend Integration**:
  - `POST /api/auth/users/verify-otp` - OTP verification
  - Called in handleVerify() function
- **Error Handling**:
  - Shows error alerts for invalid OTP
  - Allows retry
  - Shows loading spinner during verification
- **Route Params**:
  - `emailOrPhoneNumber`: From RegisterStep1Screen
  - `loginPassword`: Stored for later auto-login

#### 8. **SetTransactionPinRegistrationScreen**
- **Status**: ✅ FULLY IMPLEMENTED (Updated Feb 2026)
- **Path**: `src/features/auth/screens/SetTransactionPinRegistrationScreen.js`
- **Purpose**: User sets 4-6 digit transaction PIN
- **Features**:
  - New PIN input (4-6 digits)
  - Confirm PIN input (must match)
  - Validation for PIN requirements
  - Modern UI with gradient button
- **Navigation**:
  - Valid PIN match → UserContractScreen
  - PIN mismatch → Error alert
- **Backend Integration**:
  - `POST /api/auth/users/set-transaction-pin-by-contact` - Set PIN
  - Parameters: emailOrPhoneNumber, newPin, confirmPin
- **Error Handling**:
  - Validates PIN length (4-6 digits)
  - Validates PIN is numeric only
  - Validates PIN match
  - Shows loading spinner during API call
- **PIN Requirements**:
  ```
  - Minimum: 4 digits
  - Maximum: 6 digits
  - Only numbers (0-9)
  - Cannot be all same digit (e.g., 1111)
  - Must be confirmed
  ```

#### 9. **UserContractScreen** ⭐ **CRITICAL - Just Fixed Feb 12 2026**
- **Status**: ✅ FULLY IMPLEMENTED (Auto-login fix applied)
- **Path**: `src/features/auth/screens/UserContractScreen.js`
- **Purpose**: Display wallet contract and handle acceptance
- **Features**:
  - Display contract terms (full scrollable text)
  - Contract metadata (version, effective date)
  - "Read to bottom" requirement enforcement
  - Checkbox for acceptance agreement
  - Accept/Decline buttons
  - Handles both USER_WALLET and VENDOR_WALLET contracts
- **Contract Types**:
  - USER_WALLET: Regular user contract
  - VENDOR_WALLET: Vendor/merchant contract
- **Navigation After Acceptance**:
  - Auto-login triggers
  - RootNavigator switches to AppStack
  - User sees Home screen (new user flow)
  - OR User sees Account screen (existing user)
- **Backend Integration**:
  - **Step 1**: `GET /api/contracts/user/wallet/get` - Get contract (before acceptance)
  - **Step 2**: `POST /api/contracts/user/wallet/accept` - Accept contract (called via userContractService.acceptUserWalletContract())
  - **Step 3**: `POST /api/auth/open/signin` - Auto-login (called via context.login())
- **Key Fix (Feb 12 2026)**:
  - ✅ **BEFORE**: Direct AsyncStorage manipulation bypassed auth context
  - ✅ **AFTER**: Uses `context.login()` method which properly updates AuthContext state
  - ✅ **RESULT**: RootNavigator now detects isAuthenticated=true and navigates correctly
- **Error Handling**:
  - Show error alert if contract fetch fails
  - Allow user to retry acceptance
  - Fallback to manual login if auto-login fails
- **Code Implementation**:
  ```javascript
  // Auto-login after contract acceptance (FIXED VERSION)
  if (fromRegistration && loginResult.success) {
    // login() method properly updates context state
    const loginResult = await login({
      emailOrPhoneNumber,
      password: loginPassword,
    });
    // RootNavigator detects isAuthenticated=true
    // No manual navigation needed
  }
  ```

#### 10-20. **Other Auth Screens** (Partial Implementation)
- **ResetPinScreen**: Reset transaction PIN
- **ForgotPasswordScreen**: Password recovery via email OTP
- **EmailVerificationScreen**: Email verification during password reset
- **NewPasswordScreen**: Set new password
- **PasswordChangedScreen**: Success screen after password change
- **ResetPasswordRegistrationScreen**: Reset password during registration flow
- **ResetPasswordScreen**: Reset password from settings
- **EnterPasswordScreen**: Enter current password for verification
- **PostRegistrationScreen**: Post-registration flow (KYC/Contract)

**Status of Other Screens**: Various stages of implementation
- Most are ✅ Implemented but some features may need refinement
- All have basic structure and backend integration stubs

---

### Wallet Screens (6 screens)

#### 1. **HomeScreen** 
- **Status**: ✅ FULLY IMPLEMENTED
- **Path**: `src/features/wallet/screens/HomeScreen.js`
- **Purpose**: Main dashboard after login
- **Features**:
  - Display user balance
  - Quick action buttons (Pay, Request, Send Money, Vendor Payment)
  - Recent transactions list
  - Notifications button with unread count badge
  - User profile quick access
  - Settings access
- **Backend Integration**:
  - `GET /api/wallet/balance` - Fetch balance
  - `GET /api/transactions/recent` - Fetch recent transactions
  - `GET /api/notifications/unread-count` - Fetch unread notification count
- **Navigation**:
  - Pay button → PayScreen
  - Request Money → RequestMoneyScreen
  - Send Money → TransferMoneyScreen
  - Notifications → NotificationsScreen
  - Settings → SettingsScreen
  - Profile → ProfileScreen
- **Error Handling**:
  - Show error if balance fetch fails
  - Allow retry with refresh button
  - Display 0 balance if error

#### 2. **PayScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/wallet/screens/PayScreen.js`
- **Purpose**: Quick payment interface
- **Features**:
  - Amount input
  - Merchant/recipient selection
  - Payment method selection
  - Confirm button
- **Backend Integration**:
  - `POST /api/transactions/pay` - Process payment
- **Navigation**:
  - Success → HomeScreen
  - Error → Show alert
- **Error Handling**: Show error alerts for payment failures

#### 3. **RequestMoneyScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/wallet/screens/RequestMoneyScreen.js`
- **Purpose**: Request money from another user
- **Features**:
  - Recipient selection
  - Amount input
  - Optional message
  - Send request button
- **Backend Integration**:
  - `POST /api/transactions/request` - Send money request
- **Navigation**:
  - Success → HomeScreen
  - Cancelled → Back
- **Error Handling**: Show error alerts for request failures

#### 4. **AccountScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/wallet/screens/AccountScreen.js`
- **Purpose**: Account overview and settings quick access
- **Features**:
  - Account balance breakdown
  - Account settings shortcuts
  - Transaction history quick link
  - Profile information
- **Backend Integration**: None (displays cached data)
- **Navigation**:
  - Settings → SettingsScreen
  - Transactions → AllTransactionsScreen
  - Profile → ProfileScreen

#### 5. **LanguageScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/wallet/screens/LanguageScreen.js`
- **Purpose**: Language selection (i18n support)
- **Features**:
  - Language options (English, French, Kinyarwanda, Swahili)
  - Save language preference
- **Backend Integration**: None (local preference only)
- **Error Handling**: None

#### 6. **WalletWelcomeScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/wallet/screens/WalletWelcomeScreen.js`
- **Purpose**: Welcome/tutorial for new wallet users
- **Features**:
  - Onboarding tutorial slides
  - Navigation buttons
  - Feature explanations
- **Backend Integration**: None (UI only)
- **Navigation**: To HomeScreen when done

---

### Transaction Screens (9 screens)

#### 1. **AllTransactionsScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/AllTransactionsScreen.js`
- **Purpose**: Display all user transactions with filters
- **Features**:
  - List of all transactions with date, amount, recipient
  - Filter options (sent, received, pending, completed)
  - Search functionality
  - Pull-to-refresh
  - Transaction detail navigation
- **Backend Integration**:
  - `GET /api/transactions/history` - Fetch transaction history
  - Parameters: limit, offset, filter (optional)
- **Navigation**:
  - Transaction item → TransactionDetailScreen
  - Export button → TransactionExportScreen
- **Error Handling**:
  - Show empty state if no transactions
  - Show error alert if fetch fails
  - Allow retry

#### 2. **TransactionDetailScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/TransactionDetailScreen.js`
- **Purpose**: Display detailed transaction information
- **Features**:
  - Full transaction details (amount, recipient, date, status)
  - Transaction ID
  - Timestamp
  - Status (completed, pending, failed)
  - Share/Save option
- **Backend Integration**:
  - `GET /api/transactions/{transactionId}` - Fetch details
- **Navigation**:
  - Back → AllTransactionsScreen
- **Error Handling**: Show error alert if transaction not found

#### 3. **TransferScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/TransferScreen.js`
- **Purpose**: Select transfer type
- **Features**:
  - Display transfer options:
    1. Send to another user
    2. Send to vendor
    3. Send to bank account
- **Navigation**:
  - Send to user → TransferMoneyScreen
  - Send to vendor → VendorPaymentScreen
  - Send to bank → (Future implementation)
- **Backend Integration**: None (routing only)

#### 4. **TransferMoneyScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/TransferMoneyScreen.js`
- **Purpose**: Send money to another user with escrow protection
- **Features**:
  - Recipient selection (search by phone/email)
  - Amount input
  - Description/reference
  - Review confirmation
  - Transaction PIN required for verification
  - Automatic escrow creation for protection
- **Backend Integration**:
  - `POST /api/transactions/create` - Create transfer
  - `POST /api/escrow/create` - Create escrow (automatic)
  - Parameters: recipientId, amount, description, transactionPin
- **Navigation**:
  - Confirm → TransactionDetailScreen
  - Cancel → TransferScreen
- **Error Handling**:
  - Validate recipient exists
  - Validate amount format
  - Check sufficient balance
  - Verify transaction PIN
  - Show error alerts

#### 5. **CreateEscrowScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/CreateEscrowScreen.js`
- **Purpose**: Create escrow agreement for secure transfer
- **Features**:
  - Buyer/Seller selection
  - Amount and terms input
  - Agreement description
  - Confirm button
- **Backend Integration**:
  - `POST /api/escrow/create` - Create escrow agreement
- **Navigation**:
  - Confirm → EscrowDetailScreen
  - Cancel → Back
- **Error Handling**: Show error alerts for escrow creation failures

#### 6. **EscrowDetailScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/EscrowDetailScreen.js`
- **Purpose**: View and manage escrow agreement details
- **Features**:
  - Display escrow terms
  - Show buyer/seller information
  - Amount and status
  - Release/Dispute buttons based on user role
  - Escrow timeline
- **Backend Integration**:
  - `GET /api/escrow/{escrowId}` - Fetch escrow details
  - `POST /api/escrow/{escrowId}/release` - Release funds
  - `POST /api/escrow/{escrowId}/dispute` - Raise dispute
- **Navigation**:
  - Back → EscrowListScreen
  - Release confirmation → Success state
  - Dispute → Submit evidence
- **Error Handling**: Show error alerts for release/dispute failures

#### 7. **EscrowListScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/EscrowListScreen.js`
- **Purpose**: List all escrow agreements
- **Features**:
  - Active escrows list
  - Completed escrows list
  - Filter options
  - Status indicators
- **Backend Integration**:
  - `GET /api/escrow/list` - Fetch escrow list
- **Navigation**:
  - Escrow item → EscrowDetailScreen
  - New Escrow → CreateEscrowScreen
- **Error Handling**: Show empty state if no escrows

#### 8. **VendorPaymentScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/transactions/screens/VendorPaymentScreen.js`
- **Purpose**: Process payment to vendor/merchant
- **Features**:
  - Vendor selection
  - Amount input
  - Invoice/reference input
  - Terms of payment
  - Confirm payment button
- **Backend Integration**:
  - `POST /api/transactions/vendor-payment` - Create vendor payment
  - Also creates automatic escrow for vendor protection
- **Navigation**:
  - Confirm → TransactionDetailScreen
  - Cancel → TransferScreen
- **Error Handling**: Validate vendor exists, validate amount, check balance

#### 9. **TransactionExportScreen**
- **Status**: ✅ FULLY IMPLEMENTED
- **Path**: `src/features/transactions/screens/TransactionExportScreen.js`
- **Purpose**: Export transaction history as PDF or email
- **Features**:
  - Date range selection
  - Filter options
  - Export format selection (PDF, CSV, Email)
  - Email address input for email export
  - Progress indicator
  - Download or email success message
- **Backend Integration**:
  - `GET /api/transactions/history` - Fetch transactions for report
  - `POST /api/transactions/send-report` - Send report via email
  - `GET /api/transactions/export` - Generate export file (if direct download)
- **Navigation**:
  - Cancel → AllTransactionsScreen
  - Success → Confirmation screen with option to share
- **Error Handling**:
  - Validate date range
  - Validate email format (if email export)
  - Show error alert if export fails
  - Retry button on failure

---

### Profile Screens (2 screens)

#### 1. **ProfileScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/profile/screens/ProfileScreen.js`
- **Purpose**: Display user profile information
- **Features**:
  - User avatar/profile picture
  - Name, email, phone
  - User type (CLIENT/VENDOR)
  - Account status
  - KYC verification status
  - Wallet contract acceptance status
  - Edit profile button
  - Delete account option
- **Backend Integration**:
  - `GET /api/auth/users/current-user` - Fetch profile data
- **Navigation**:
  - Edit Profile → EditProfileScreen
  - Settings → SettingsScreen
  - Back → HomeScreen
- **Error Handling**: Show error alert if profile fetch fails

#### 2. **EditProfileScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/profile/screens/EditProfileScreen.js`
- **Purpose**: Edit user profile information
- **Features**:
  - Editable fields (name, email, phone, location)
  - Profile picture upload
  - Save changes button
  - Cancel button
  - Validation
- **Backend Integration**:
  - `PUT /api/auth/users/update-profile` - Update profile
- **Navigation**:
  - Save successful → ProfileScreen
  - Cancel → ProfileScreen
- **Error Handling**:
  - Validate fields before save
  - Show error alerts for update failures
  - Prevent empty fields

---

### Settings Screens (3+ screens)

#### 1. **SettingsScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/settings/screens/SettingsScreen.js`
- **Purpose**: App settings and preferences
- **Features**:
  - Account settings section
  - Security section
  - Notification preferences
  - Language selection
  - About app
  - Logout button
- **Menu Items**:
  - Profile → ProfileScreen
  - Reset Password/PIN → ChangePasswordScreen (Updated Feb 2026)
  - Two-Factor Authentication → (Future)
  - Notification Preferences → (Future)
  - Language → LanguageScreen
  - About → (Future)
  - Logout → Clear auth and return to AuthStack
- **Backend Integration**: None for screen itself, but navigates to screens that call API
- **Navigation**:
  - Various items navigate to respective screens
  - Logout → AuthStack

#### 2. **ChangePasswordScreen** (Updated Feb 2026)
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/settings/screens/ChangePasswordScreen.js`
- **Purpose**: Change password or reset transaction PIN
- **Features**: ✨ **NEW UPDATE Feb 2026**
  - Updated title to "Reset Password/PIN"
  - Updated subtitle to reflect both password and PIN options
  - Current password verification
  - New password input (5 digits)
  - Confirm password input
  - Separate section for transaction PIN reset
  - Save button
- **Backend Integration**:
  - `PUT /api/auth/users/change-password` - Change password
  - `PUT /api/auth/users/reset-transaction-pin` - Reset transaction PIN
- **Navigation**:
  - Save successful → SettingsScreen
  - Cancel → SettingsScreen
- **Error Handling**:
  - Validate current password
  - Validate new password format (5 digits)
  - Validate confirmation matches
  - Show error alerts

#### 3. **SetTransactionPinScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/settings/screens/SetTransactionPinScreen.js`
- **Purpose**: Set or update transaction PIN from settings
- **Features**:
  - Current PIN input (if exists)
  - New PIN input (4-6 digits)
  - Confirm PIN input
  - Save button
- **Backend Integration**:
  - `POST /api/auth/users/set-transaction-pin` - Set/Update PIN
- **Navigation**:
  - Save successful → SettingsScreen
  - Cancel → SettingsScreen
- **Error Handling**: Validate PIN requirements

#### 4. **ResetTransactionPinScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/settings/screens/ResetTransactionPinScreen.js`
- **Purpose**: Reset transaction PIN via security questions or email
- **Features**:
  - Email verification option
  - OTP verification option
  - New PIN setup
- **Backend Integration**:
  - `POST /api/auth/users/reset-transaction-pin-request` - Request PIN reset
  - `POST /api/auth/users/verify-pin-reset` - Verify and set new PIN
- **Navigation**:
  - Success → SettingsScreen
  - Cancel → SettingsScreen
- **Error Handling**: Show error alerts for verification failures

---

### KYC Screens (5 screens)

#### 1. **PersonaKycScreen** ⭐ **CRITICAL - Persona SDK Integration**
- **Status**: ✅ FULLY IMPLEMENTED
- **Path**: `src/features/kyc/screens/PersonaKycScreen.js`
- **Purpose**: Launch Persona identity verification
- **Features**:
  - Display KYC status (UNVERIFIED, PENDING, VERIFIED, REJECTED)
  - Show identity mismatch warning if applicable
  - Display verification requirements
  - "Start Verification" button launches Persona
  - Verification history (attempts, status changes)
- **Backend Integration**:
  - `GET /api/kyc/status` - Get KYC verification status
  - `GET /api/kyc/persona-config` - Get Persona SDK configuration
  - `POST /api/kyc/verify` - Submit verification (Persona calls this)
  - `GET /api/kyc/verification-attempts` - Get attempt history
- **Persona SDK Integration**:
  - Uses Persona SDK to launch verification flow
  - Persona handles document upload, biometric scan
  - Webhook calls backend when verification complete
  - Status updates reflected in app
- **Navigation**:
  - "Start Verification" → Persona SDK (external)
  - After completion → Returns to PersonaKycScreen
  - Success → Home screen (after automatic refresh)
  - Failed → Show error and retry option
- **Error Handling**:
  - Show error alert if Persona config not available
  - Show error if status fetch fails
  - Display mismatch warning if identity doesn't match
  - Allow retry on failure
- **Key Code**:
  ```javascript
  // Launch Persona verification
  const handleStartVerification = async () => {
    try {
      const config = await kycService.getPersonaConfig();
      // Launch Persona with inquiry ID from config
      const result = await Persona.verify(config.inquiryId);
      // Persona handles submission and webhook
      // Status updates automatically
    } catch (error) {
      Alert.alert('Error', 'Failed to start verification');
    }
  };
  ```

#### 2. **SimpleKycScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/kyc/screens/SimpleKycScreen.js`
- **Purpose**: Basic KYC document upload (testing without Persona)
- **Features**:
  - Document type selection
  - Document upload interface
  - File picker integration
  - Upload progress indicator
  - Success confirmation
- **Backend Integration**:
  - `POST /api/kyc/upload-document` - Upload documents
- **Navigation**:
  - Back → Previous screen
  - Success → PersonaKycScreen or HomeScreen
- **Error Handling**: Show error alert for upload failures

#### 3. **KycResidenceScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/kyc/screens/KycResidenceScreen.js`
- **Purpose**: Collect residence information for KYC
- **Features**:
  - Province/District/Sector selection
  - Address details input
  - Verification button
- **Backend Integration**:
  - `POST /api/kyc/verify-residence` - Verify residence
- **Navigation**:
  - Verify → KycDocumentScreen
  - Back → Previous screen
- **Error Handling**: Validate fields before submission

#### 4. **KycDocumentScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/kyc/screens/KycDocumentScreen.js`
- **Purpose**: Select and upload identification documents
- **Features**:
  - Document type selection dropdown
  - Document number input
  - Upload button
  - File preview
- **Backend Integration**:
  - `POST /api/kyc/upload-document` - Upload document
- **Navigation**:
  - Upload → KycUploadScreen
  - Back → KycResidenceScreen
- **Error Handling**: Validate document format and size

#### 5. **KycUploadScreen**
- **Status**: ✅ IMPLEMENTED
- **Path**: `src/features/kyc/screens/KycUploadScreen.js`
- **Purpose**: Upload document files with preview
- **Features**:
  - File picker (camera or gallery)
  - Image preview
  - Upload progress indicator
  - Retry on failure
  - Success confirmation
- **Backend Integration**:
  - `POST /api/kyc/upload-document` - Upload document
- **Navigation**:
  - Success → PersonaKycScreen
  - Back → KycDocumentScreen
- **Error Handling**:
  - Validate file size (max 5MB)
  - Validate file format (JPG, PNG, PDF)
  - Show upload progress
  - Allow retry on failure

---

### Notifications Screen (1 screen)

#### 1. **NotificationsScreen**
- **Status**: ⚠️ PARTIALLY IMPLEMENTED
- **Path**: `src/features/notifications/screens/NotificationsScreen.js`
- **Purpose**: Display in-app notifications
- **Features**:
  - List of all notifications
  - Unread notification count
  - Mark as read functionality
  - Filter by type
  - Delete notification
  - Pull-to-refresh
- **Backend Integration**:
  - `GET /api/notifications/list` - Fetch notifications (TODO - awaiting endpoint)
  - `POST /api/notifications/{id}/mark-read` - Mark as read (TODO)
  - `DELETE /api/notifications/{id}` - Delete notification (TODO)
- **Status**: 
  - UI: ✅ Implemented
  - Backend Integration: ⏳ Awaiting backend endpoints
  - Notification Push: ⏳ Not yet implemented
- **Navigation**:
  - Notification item → Relevant screen based on notification type
  - Back → HomeScreen
- **Error Handling**: Currently shows mock data, will implement error handling when endpoints available

---

### Beneficiaries Screen (1+ screen)

#### 1. **BeneficiariesScreen** (if exists)
- **Status**: ⏳ NOT YET FULLY IMPLEMENTED
- **Path**: Likely `src/features/beneficiaries/screens/BeneficiariesScreen.js`
- **Purpose**: Manage saved payment recipients
- **Features** (planned):
  - List of saved beneficiaries
  - Add new beneficiary
  - Edit beneficiary
  - Delete beneficiary
  - Quick payment to beneficiary
- **Backend Integration** (planned):
  - `GET /api/beneficiaries/list` - Fetch saved beneficiaries
  - `POST /api/beneficiaries/add` - Add new beneficiary
  - `PUT /api/beneficiaries/{id}` - Edit beneficiary
  - `DELETE /api/beneficiaries/{id}` - Delete beneficiary
- **Status**: Backend service exists but screen integration may be incomplete

---

## AWS Backend Integration

### Service Architecture

**Two Main Microservices**:

#### 1. **AUTH Service**
- **Base URL**: `https://auth.movasafe.com`
- **Responsibility**: Authentication, user management, KYC, contracts, profile
- **Endpoints**:

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/auth/open/register` | POST | ❌ No | User registration (creates NOT_READY user, sends OTP) |
| `/api/auth/open/signin` | POST | ❌ No | Login with credentials (returns JWT token) |
| `/api/auth/users/verify-otp` | POST | ❌ No | Verify OTP from registration email |
| `/api/auth/users/set-transaction-pin-by-contact` | POST | ❌ No | Set transaction PIN during registration |
| `/api/auth/users/current-user` | GET | ✅ Yes | Get logged-in user profile |
| `/api/auth/users/update-profile` | PUT | ✅ Yes | Update user profile info |
| `/api/auth/users/change-password` | PUT | ✅ Yes | Change login password |
| `/api/auth/users/reset-transaction-pin` | POST | ✅ Yes | Reset transaction PIN |
| `/api/contracts/user/wallet/get` | GET | ✅ Yes | Get user wallet contract |
| `/api/contracts/user/wallet/accept` | POST | ✅ Yes | Accept user wallet contract |
| `/api/contracts/vendor/wallet/get` | GET | ✅ Yes | Get vendor wallet contract |
| `/api/contracts/vendor/wallet/accept` | POST | ✅ Yes | Accept vendor wallet contract |
| `/api/kyc/status` | GET | ✅ Yes | Get KYC verification status |
| `/api/kyc/persona-config` | GET | ✅ Yes | Get Persona SDK inquiry ID |
| `/api/kyc/verify` | POST | ✅ Yes | Submit KYC verification |
| `/api/kyc/upload-document` | POST | ✅ Yes | Upload KYC documents |

#### 2. **TRANSACTION Service**
- **Base URL**: `https://transaction.movasafe.com`
- **Responsibility**: Money transfers, escrow, payments, transaction history
- **Endpoints**:

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/transactions/create` | POST | ✅ Yes | Create P2P transfer |
| `/api/transactions/vendor-payment` | POST | ✅ Yes | Create vendor payment |
| `/api/transactions/history` | GET | ✅ Yes | Get transaction history (supports filters, pagination) |
| `/api/transactions/send-report` | POST | ✅ Yes | Send transaction report via email |
| `/api/transactions/export` | GET | ✅ Yes | Export transactions as CSV/PDF |
| `/api/escrow/create` | POST | ✅ Yes | Create escrow agreement |
| `/api/escrow/list` | GET | ✅ Yes | List user escrows |
| `/api/escrow/{escrowId}` | GET | ✅ Yes | Get escrow details |
| `/api/escrow/{escrowId}/release` | POST | ✅ Yes | Release escrow funds |
| `/api/escrow/{escrowId}/dispute` | POST | ✅ Yes | Raise escrow dispute |
| `/api/wallet/balance` | GET | ✅ Yes | Get wallet balance |

### Request/Response Format

#### Standard Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "jwtToken": "eyJhbGc..."
  }
}
```

#### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Authentication

**JWT Token Format**:
- Issued by AUTH service on successful login/registration
- Sent in `Authorization: Bearer <token>` header for all protected endpoints
- Token stored in AsyncStorage as `@auth_token`
- Refresh token stored as `@refresh_token` (if provided)

**Token Refresh Flow**:
```
1. Request made with expired token
2. API returns 401 Unauthorized
3. apiClient interceptor detects 401
4. Refresh token used to get new token
5. New token saved to AsyncStorage
6. Original request retried with new token
7. Response returned to caller
8. If refresh fails, user logged out and sent to AuthStack
```

### API Client Configuration

**Location**: `utils/apiClient.js`

**Features**:
- Axios instance with custom interceptors
- Automatic token injection in request headers
- Request/response error handling
- Endpoint whitelisting for registration flow (no token required)
- Service routing based on endpoint pattern
- Automatic error formatting

**Whitelisted Endpoints** (no JWT required):
```javascript
'/api/auth/open/register',
'/api/auth/open/signin',
'/api/auth/users/verify-otp',
'/api/auth/users/set-transaction-pin-by-contact',
'/api/contracts/user/wallet/accept',
'/api/contracts/user/wallet/get',
'/api/contracts/vendor/wallet/accept',
'/api/contracts/vendor/wallet/get',
```

**Service Routing**:
```javascript
// Request to /api/transactions/* routes to TRANSACTION service
// Request to /api/auth/* routes to AUTH service
// Request to /api/contracts/* routes to AUTH service
// Request to /api/kyc/* routes to AUTH service
// Request to /api/wallet/* routes to TRANSACTION service
```

### Error Handling

**API Error Formats Handled**:
1. Network errors (no internet)
2. 401 Unauthorized (expired token)
3. 403 Forbidden (insufficient permissions)
4. 404 Not Found (endpoint/resource doesn't exist)
5. 422 Validation Error (invalid input)
6. 500 Internal Server Error

**Client-Side Error Handling** (apiClient.js):
```javascript
// Catches all error types and returns standardized format:
{
  success: false,
  error: "Friendly error message",
  code: "ERROR_CODE",
  statusCode: 400
}
```

**Service-Level Error Handling** (each service):
```javascript
// Each service catches API errors and returns:
{
  success: false,
  error: "Descriptive error message"
}
```

### Webhooks

**Purpose**: Backend notifies app of asynchronous events

**Event Types**:
1. KYC Verification Complete (Persona → Backend → App)
2. Escrow Status Change
3. Transaction Completion
4. Payment Received
5. Contract Update

**Webhook Handler**: `utils/webhookHandler.js`

**Implementation Status**: Handler structure exists, backend webhook setup may be in progress

---

## Data Flow & Services

### Service Architecture

```
┌──────────────────────────────────┐
│     SCREEN COMPONENT             │
│  (e.g., LoginPasswordScreen)      │
└────────────────┬─────────────────┘
                 │
                 ├─ Calls service method
                 │
┌────────────────▼─────────────────┐
│     SERVICE LAYER                │
│  (e.g., authService.login())     │
│                                  │
│  • Validates input               │
│  • Calls apiClient               │
│  • Normalizes response           │
│  • Returns standardized format   │
└────────────────┬─────────────────┘
                 │
┌────────────────▼─────────────────┐
│     API CLIENT LAYER             │
│  (apiClient.js - axios instance) │
│                                  │
│  • Adds auth token to headers    │
│  • Routes to correct service URL │
│  • Handles response errors       │
│  • Implements retry logic        │
└────────────────┬─────────────────┘
                 │
┌────────────────▼─────────────────┐
│     HTTP LAYER                   │
│  (Network request)               │
│                                  │
│  POST to AWS Elastic Beanstalk   │
│  microservice endpoint            │
└────────────────┬─────────────────┘
                 │
                 └─ Receives response
                 │
                 ├─ Success: Returns data
                 ├─ Error: Formats error
                 └─ Token Expired: Refresh & Retry
```

### Key Services

#### 1. **authService** (`src/features/auth/auth.service.js`)
```javascript
// Main authentication operations
authService.login({ emailOrPhoneNumber, password })
authService.register(userData)
authService.verifyOtp({ emailOrPhoneNumber, otp })
authService.getCurrentUser()
authService.changePassword({ currentPassword, newPassword })
authService.resetTransactionPin()

// Each method:
// 1. Takes input parameters
// 2. Makes API call via apiClient
// 3. Normalizes response data
// 4. Returns { success: boolean, data?, error? }
```

#### 2. **transactionPinService** (`src/features/auth/transactionPin.service.js`)
```javascript
transactionPinService.setTransactionPinByContact({
  emailOrPhoneNumber,
  newPin,
  confirmPin
})
transactionPinService.resetTransactionPin()
transactionPinService.verifyTransactionPin(pin)
```

#### 3. **userContractService** (`src/features/auth/user-contract.service.js`)
```javascript
userContractService.getContractStatus()
userContractService.getUserWalletContract()
userContractService.acceptUserWalletContract()
userContractService.getVendorWalletContract()
userContractService.acceptVendorWalletContract()
```

#### 4. **kycService** (`src/features/kyc/kyc.service.js`)
```javascript
kycService.getKycStatus()
kycService.getPersonaConfig()  // Get Persona inquiry ID
kycService.uploadDocument(formData)
kycService.getKycHistory()
```

#### 5. **transactionsService** (`src/features/transactions/transactions.service.js`)
```javascript
transactionsService.getTransactionHistory(filters)
transactionsService.createTransfer({ recipientId, amount, description })
transactionsService.getTransactionDetail(id)
transactionsService.getBalance()
```

#### 6. **transactionExportService** (`src/features/transactions/transaction-export.service.js`)
```javascript
transactionExportService.exportTransactions({
  format,        // 'pdf' | 'csv'
  startDate,
  endDate,
  email          // optional, for email delivery
})
```

#### 7. **escrowService** (integrated in transactionsService)
```javascript
// Escrow operations
transactionsService.createEscrow(escrowData)
transactionsService.getEscrowList()
transactionsService.getEscrowDetail(id)
transactionsService.releaseEscrow(id)
transactionsService.disputeEscrow(id, reason)
```

#### 8. **userService** (`src/features/profile/user.service.js`)
```javascript
userService.getUserById(id)
userService.updateProfile(profileData)
userService.uploadProfilePicture(image)
```

#### 9. **walletService** (`src/features/wallet/wallet.service.js`)
```javascript
walletService.getBalance()
walletService.getRecentTransactions()
walletService.getWalletInfo()
```

#### 10. **beneficiariesService** (`src/features/beneficiaries/beneficiaries.service.js`)
```javascript
beneficiariesService.getBeneficiaries()
beneficiariesService.addBeneficiary(data)
beneficiariesService.removeBeneficiary(id)
beneficiariesService.updateBeneficiary(id, data)
```

---

## State Management

### Redux Store Structure

**Location**: `src/store/`

**Slices**:

#### 1. **authSlice**
```javascript
{
  authSlice: {
    user: {
      id: string,
      email: string,
      firstname: string,
      lastname: string,
      phoneNumber: string,
      kycVerified: boolean,
      userWalletContractAccepted: boolean,
      vendorWalletContractAccepted: boolean,
      userType: 'CLIENT' | 'VENDOR',
      // ... other fields
    },
    token: string,
    isAuthenticated: boolean,
    isLoading: boolean,
    error: string | null
  }
}
```

#### 2. **notificationSlice**
```javascript
{
  notificationSlice: {
    items: [
      {
        id: string,
        message: string,
        type: string,
        read: boolean,
        timestamp: number,
        // ... other fields
      }
    ],
    unreadCount: number,
    isLoading: boolean,
    error: string | null
  }
}
```

### React Context (AuthContext)

**Location**: `context/AuthContext.js`

**Purpose**: Global authentication state that drives entire app navigation

**State**:
```javascript
{
  user: {},              // Current user data
  isAuthenticated: boolean,
  authToken: string,
  refreshTokenValue: string,
  isLoading: boolean,
}
```

**Methods**:
```javascript
const {
  user,                      // Current user
  isAuthenticated,          // Auth status
  login,                    // Login user
  logout,                   // Logout user
  register,                 // Register user
  updateUser,              // Update user data
  loginWithGoogle,         // Google OAuth
  loginWithApple,          // Apple OAuth
  refreshToken,            // Refresh JWT token
  checkAndPromptContractUpdate  // Contract checks
} = useAuth();
```

**Key Feature - Auto-Login After Registration**:
```javascript
// After contract acceptance, context.login() is called
// This updates auth context state which triggers:
// 1. setAuthToken() - saves token
// 2. setIsAuthenticated(true) - sets authentication flag
// 3. RootNavigator detects isAuthenticated=true
// 4. RootNavigator switches from AuthStack to AppStack
// 5. User sees Home screen
```

### Local Component State

**Common State Patterns**:
```javascript
// Loading state
const [isLoading, setIsLoading] = useState(false);

// Error handling
const [error, setError] = useState('');

// Form data
const [formData, setFormData] = useState({
  email: '',
  password: '',
});

// UI state
const [modalVisible, setModalVisible] = useState(false);
const [selectedTab, setSelectedTab] = useState('all');
```

### AsyncStorage (Persistent Storage)

**Keys Used**:
```javascript
'@auth_token'           // JWT token
'@refresh_token'        // Refresh token for getting new JWT
'@user_data'            // Cached user profile
'@last_active_time'     // Last activity timestamp
'@language_preference'  // Selected language
'@theme_preference'     // UI theme (light/dark)
```

---

## Unimplemented Features

### High Priority (Core Features Missing Implementation)

#### 1. ⏳ Notifications System
- **Status**: UI exists, backend integration incomplete
- **What's Missing**:
  - Push notification setup (Firebase Cloud Messaging)
  - Notification endpoint live testing
  - Real-time notification delivery
  - Notification grouping/threading
- **Files Involved**:
  - `src/features/notifications/screens/NotificationsScreen.js`
  - Backend endpoints `/api/notifications/*`
- **Impact**: Users won't receive real-time alerts for transactions/payments
- **Estimated Work**: 1-2 weeks (backend + frontend + FCM setup)

#### 2. ⏳ Two-Factor Authentication (2FA)
- **Status**: Not implemented
- **What's Needed**:
  - SMS OTP or app-based (Google Authenticator) 2FA option
  - 2FA enablement in settings
  - 2FA verification on login
  - Recovery codes generation
- **Files Needed**: New screen `SettingsScreen` > `Enable2FA` option
- **Backend Endpoints Needed**: `/api/auth/2fa/enable`, `/api/auth/2fa/verify`
- **Impact**: Security enhancement, not critical for v1.0
- **Estimated Work**: 2-3 weeks (security review + backend)

#### 3. ⏳ Biometric Authentication (Fingerprint/Face ID)
- **Status**: Not implemented
- **What's Needed**:
  - React Native Biometric library integration
  - Fingerprint/Face ID option in login screen
  - Biometric enablement in settings
  - Fallback to password if biometric fails
- **Libraries**: `react-native-biometrics` or similar
- **Impact**: Improved user experience for repeat logins
- **Estimated Work**: 1 week

#### 4. ⏳ Backend Contract Update Checking
- **Status**: Partial implementation
- **What's Missing**:
  - Automatic checking for updated contracts on app launch
  - Prompting user to accept new contract versions
  - Contract version tracking
- **Function Exists**: `checkAndPromptContractUpdate()` in AuthContext
- **Files Involved**: `context/AuthContext.js`, `src/features/auth/user-contract.service.js`
- **Impact**: Legal compliance - contracts must be re-accepted when updated
- **Estimated Work**: 1 week

### Medium Priority (Feature Completeness)

#### 5. ⏳ Advanced Transaction Filters
- **Status**: Basic filtering exists
- **What's Missing**:
  - Date range picker
  - Transaction type filtering (sent/received/pending/failed)
  - Search by recipient name
  - Search by transaction amount
  - Filter by transaction status
- **Files**: `src/features/transactions/screens/AllTransactionsScreen.js`
- **Impact**: Better transaction history management for users
- **Estimated Work**: 1 week

#### 6. ⏳ Transaction Evidence/Proof Upload
- **Status**: Service exists (`evidence.service.js`), UI integration incomplete
- **What's Missing**:
  - UI screen for uploading transaction proof
  - Evidence upload on escrow dispute
  - Document viewing interface
  - Evidence history tracking
- **Files**: New screen needed, `src/features/transactions/evidence.service.js` exists
- **Impact**: Escrow dispute resolution requires proof
- **Estimated Work**: 1-2 weeks

#### 7. ⏳ Beneficiaries Management UI
- **Status**: Service exists (`beneficiaries.service.js`), UI integration minimal
- **What's Missing**:
  - Beneficiaries list screen
  - Add beneficiary screen with validation
  - Edit beneficiary screen
  - Delete beneficiary confirmation
  - Quick payment from beneficiary list
- **Files**: Screens needed, service already created
- **Impact**: Streamlined payments to frequent recipients
- **Estimated Work**: 2 weeks

#### 8. ⏳ Vendor Dashboard/Analytics
- **Status**: Not implemented
- **What's Needed**:
  - Vendor-specific screens (different from CLIENT)
  - Sales/revenue analytics
  - Vendor transaction history
  - Vendor profile customization
  - Vendor settings
- **Files**: New feature module `src/features/vendor/` needed
- **Backend Endpoints**: Vendor-specific endpoints needed
- **Impact**: Differentiated experience for vendors vs. regular users
- **Estimated Work**: 3-4 weeks

### Low Priority (Enhancement/Polish)

#### 9. ⏳ Internationalization (i18n)
- **Status**: Language screen exists, translation incomplete
- **What's Missing**:
  - Translation files for all supported languages
  - Language switcher integration
  - RTL support (if Arabic/Hebrew added)
  - Number/date formatting by locale
- **Libraries**: `i18next` or `react-native-localize`
- **Languages Planned**: English, French, Kinyarwanda, Swahili
- **Impact**: Accessibility for non-English speakers
- **Estimated Work**: 2-3 weeks

#### 10. ⏳ Offline Mode
- **Status**: Not implemented
- **What's Needed**:
  - Offline-first architecture (Redux Persist + local DB)
  - Cache recent transactions
  - Queue outgoing transactions/requests
  - Sync when reconnected
  - Offline indicators in UI
- **Libraries**: `redux-persist`, `@react-native-async-storage/async-storage`
- **Impact**: Better UX in areas with spotty internet
- **Estimated Work**: 3-4 weeks

#### 11. ⏳ Dark Mode Support
- **Status**: Theme context exists, not fully implemented
- **What's Missing**:
  - Dark color scheme definitions
  - All screens updated for dark mode
  - System dark mode detection
  - Dark mode toggle in settings
  - Smooth theme transition animations
- **Files**: `context/ThemeContext.js` exists but incomplete
- **Impact**: User preference feature
- **Estimated Work**: 1-2 weeks

#### 12. ⏳ In-App Messaging/Support Chat
- **Status**: Not implemented
- **What's Needed**:
  - Chat interface with support team
  - Real-time messaging (WebSocket)
  - Chat history persistence
  - File sharing in chat
  - Typing indicators
- **Libraries**: Socket.io for WebSocket, or Firebase Firestore
- **Impact**: Customer support channel
- **Estimated Work**: 2-3 weeks

#### 13. ⏳ Referral Program
- **Status**: Not implemented
- **What's Needed**:
  - Referral code generation
  - Referral link sharing
  - Referral tracking
  - Bonus credit on successful referral
  - Referral history screen
- **Backend Endpoints**: Needed for referral management
- **Impact**: User acquisition feature
- **Estimated Work**: 2 weeks

### Features by Priority & Effort

| Priority | Feature | Status | Effort | Dependencies |
|----------|---------|--------|--------|--------------|
| 🔴 HIGH | Push Notifications | ⏳ Missing | 1-2w | Firebase, backend endpoints |
| 🔴 HIGH | Contract Update Checking | ⏳ Partial | 1w | Function exists |
| 🟠 MEDIUM | Transaction Filters | ⏳ Partial | 1w | Minimal backend |
| 🟠 MEDIUM | Evidence Upload UI | ⏳ Missing | 1-2w | Service exists |
| 🟠 MEDIUM | Beneficiaries UI | ⏳ Missing | 2w | Service exists |
| 🟠 MEDIUM | Vendor Dashboard | ⏳ Missing | 3-4w | New backend endpoints |
| 🟢 LOW | 2FA Authentication | ⏳ Missing | 2-3w | Security review |
| 🟢 LOW | Biometric Auth | ⏳ Missing | 1w | react-native-biometrics |
| 🟢 LOW | i18n/Translations | ⏳ Missing | 2-3w | Minimal code changes |
| 🟢 LOW | Offline Mode | ⏳ Missing | 3-4w | Redux Persist setup |
| 🟢 LOW | Dark Mode | ⏳ Missing | 1-2w | Theme context exists |
| 🟢 LOW | In-App Chat | ⏳ Missing | 2-3w | WebSocket setup |
| 🟢 LOW | Referral Program | ⏳ Missing | 2w | Backend integration |

---

## Screen-by-Screen Backend Integration Details

This section provides complete request/response examples for every screen with backend integration.

---

### Authentication Screens Backend Integration

#### LoginPasswordScreen
**Service**: `authService.login()`  
**Endpoint**: `POST https://auth.movasafe.com/api/auth/open/signin`  
**Auth Required**: ❌ No (whitelisted)

**Request Body**:
```json
{
  "emailOrPhoneNumber": "john.doe@example.com",
  "password": "12345"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_value",
    "userId": "user-123",
    "user": {
      "id": "user-123",
      "userId": "user-123",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+250123456789",
      "kycVerified": true,
      "userWalletContractAccepted": true,
      "vendorWalletContractAccepted": false,
      "userType": "CLIENT",
      "accountStatus": "ACTIVE",
      "roles": ["ROLE_USER"]
    }
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS"
}
```

**Frontend Code**:
```javascript
const handleLogin = async () => {
  try {
    setIsLoading(true);
    const result = await login({
      emailOrPhoneNumber,
      password
    });
    
    if (result.success) {
      // AuthContext.login() updates:
      // 1. setAuthToken(token)
      // 2. setUser(userData)
      // 3. setIsAuthenticated(true)
      // 4. RootNavigator detects change → AppStack
    } else {
      Alert.alert('Login Failed', result.error);
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

#### RegisterStep1Screen
**Service**: `authService.register()`  
**Endpoint**: `POST https://auth.movasafe.com/api/auth/open/register`  
**Auth Required**: ❌ No (whitelisted)

**Request Body**:
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+250123456789",
  "password": "12345",
  "nationalId": "1234567890123",
  "gender": "MALE",
  "province": "Kigali",
  "district": "Gasabo",
  "sector": "Kacyiru",
  "locationDescription": "Near main market",
  "userType": "CLIENT",
  "optedIn": true
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "User registered successfully. OTP sent to email.",
  "data": {
    "id": "user-123",
    "email": "john.doe@example.com",
    "phoneNumber": "+250123456789",
    "accountStatus": "NOT_READY",
    "message": "OTP sent to registered email"
  }
}
```

**Response Error (422)**:
```json
{
  "success": false,
  "message": "Email already exists",
  "error": "DUPLICATE_EMAIL"
}
```

**Frontend Code**:
```javascript
const handleRegister = async () => {
  try {
    setIsLoading(true);
    const response = await authService.register({
      firstname,
      lastname,
      email,
      phoneNumber,
      password,
      nationalId,
      gender,
      province,
      district,
      sector,
      locationDescription,
      userType: 'CLIENT',
      optedIn: true
    });
    
    if (response.success) {
      // Navigate to OTP screen with email/phone
      navigation.navigate('RegisterOtp', {
        emailOrPhoneNumber: email,
        loginPassword: password
      });
    }
  } catch (error) {
    Alert.alert('Registration Error', error.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

#### RegisterOtpScreen
**Service**: `authService.verifyOtp()`  
**Endpoint**: `POST https://auth.movasafe.com/api/auth/users/verify-otp`  
**Auth Required**: ❌ No (whitelisted)

**Request Body**:
```json
{
  "emailOrPhoneNumber": "john.doe@example.com",
  "otp": "123456"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true,
    "message": "Email/Phone verified"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Invalid OTP",
  "error": "INVALID_OTP"
}
```

**Frontend Code**:
```javascript
const handleVerify = async () => {
  try {
    setIsLoading(true);
    const response = await authService.verifyOtp({
      emailOrPhoneNumber: route.params.emailOrPhoneNumber,
      otp: otpCode
    });
    
    if (response.success) {
      navigation.navigate('SetTransactionPinRegistration', {
        emailOrPhoneNumber: route.params.emailOrPhoneNumber,
        loginPassword: route.params.loginPassword
      });
    } else {
      Alert.alert('Verification Failed', response.error);
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

#### SetTransactionPinRegistrationScreen
**Service**: `transactionPinService.setTransactionPinByContact()`  
**Endpoint**: `POST https://auth.movasafe.com/api/auth/users/set-transaction-pin-by-contact`  
**Auth Required**: ❌ No (whitelisted)

**Request Body**:
```json
{
  "emailOrPhoneNumber": "john.doe@example.com",
  "newPin": "1234",
  "confirmPin": "1234"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Transaction PIN set successfully",
  "data": {
    "pinSet": true,
    "accountStatus": "ACTIVE"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "PIN confirmation does not match",
  "error": "PIN_MISMATCH"
}
```

**Frontend Code**:
```javascript
const handleSetPin = async () => {
  try {
    setIsLoading(true);
    const response = await transactionPinService.setTransactionPinByContact({
      emailOrPhoneNumber: route.params.emailOrPhoneNumber,
      newPin,
      confirmPin
    });
    
    if (response.success) {
      navigation.navigate('UserContract', {
        emailOrPhoneNumber: route.params.emailOrPhoneNumber,
        loginPassword: route.params.loginPassword,
        fromRegistration: true
      });
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

#### UserContractScreen
**Service**: `userContractService.acceptUserWalletContract()` & `authService.login()`  
**Step 1 - Get Contract**: `GET https://auth.movasafe.com/api/contracts/user/wallet/get`  
**Auth Required**: ✅ Yes (JWT token)

**GET Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "contract-123",
    "type": "USER_WALLET",
    "version": "1.0.0",
    "effectiveDate": "2026-01-01",
    "content": "Terms and conditions text here...",
    "accepted": false
  }
}
```

**Step 2 - Accept Contract**: `POST https://auth.movasafe.com/api/contracts/user/wallet/accept`  
**Request Body**:
```json
{
  "contractId": "contract-123",
  "accepted": true
}
```

**Accept Response Success (200)**:
```json
{
  "success": true,
  "message": "Contract accepted successfully",
  "data": {
    "accepted": true,
    "acceptedAt": "2026-02-12T10:30:00Z"
  }
}
```

**Step 3 - Auto-Login**: `POST https://auth.movasafe.com/api/auth/open/signin`  
**Request Body**:
```json
{
  "emailOrPhoneNumber": "john.doe@example.com",
  "password": "12345"
}
```

**Login Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_value",
    "user": {
      "id": "user-123",
      "firstname": "John",
      "lastname": "Doe",
      "userWalletContractAccepted": true,
      "kycVerified": false,
      "userType": "CLIENT"
    }
  }
}
```

**Frontend Code (UPDATED Feb 12 2026)**:
```javascript
const handleAccept = async () => {
  try {
    setIsAccepting(true);
    
    // Step 1: Accept contract
    const contractResponse = await userContractService.acceptUserWalletContract();
    if (!contractResponse.success) {
      throw new Error(contractResponse.error);
    }
    
    // Step 2: Auto-login using context method
    const loginResult = await login({
      emailOrPhoneNumber: route.params.emailOrPhoneNumber,
      password: route.params.loginPassword
    });
    
    if (loginResult.success) {
      // login() method updates AuthContext state:
      // 1. setAuthToken(token)
      // 2. setUser(userData)
      // 3. setIsAuthenticated(true)
      // RootNavigator detects isAuthenticated=true
      // RootNavigator switches from AuthStack to AppStack
      // User navigated to Home screen automatically
      
      showSuccess('Welcome! Account activated.', () => {
        // Navigation happens automatically via RootNavigator
      });
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsAccepting(false);
  }
};
```

---

### Wallet Screens Backend Integration

#### HomeScreen
**Service Multiple Calls**:

**1. Get Balance**: `GET https://transaction.movasafe.com/api/wallet/balance`  
**Auth Required**: ✅ Yes
```javascript
// Request Headers
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}

// Response (200)
{
  "success": true,
  "data": {
    "balance": 50000,
    "currency": "RWF",
    "available": 50000,
    "pending": 0
  }
}
```

**2. Get Recent Transactions**: `GET https://transaction.movasafe.com/api/transactions/recent?limit=10`  
**Auth Required**: ✅ Yes
```javascript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "txn-123",
      "amount": 5000,
      "currency": "RWF",
      "type": "TRANSFER_SENT",
      "recipient": {
        "firstname": "Jane",
        "lastname": "Smith"
      },
      "status": "COMPLETED",
      "timestamp": "2026-02-12T09:00:00Z"
    }
  ]
}
```

**3. Get Notifications Count**: `GET https://auth.movasafe.com/api/notifications/unread-count`  
**Auth Required**: ✅ Yes
```javascript
// Response (200)
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

**Frontend Code**:
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const [balance, transactions, notifications] = await Promise.all([
        walletService.getBalance(),
        transactionsService.getRecentTransactions({ limit: 10 }),
        fetchUnreadNotifications()
      ]);
      
      setBalance(balance.data);
      setRecentTransactions(transactions.data);
      setUnreadCount(notifications.data.unreadCount);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };
  
  fetchData();
}, []);
```

---

#### PayScreen
**Service**: Transaction service  
**Endpoint**: `POST https://transaction.movasafe.com/api/transactions/pay`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "merchantId": "merchant-456",
  "amount": 10000,
  "currency": "RWF",
  "description": "Payment for services",
  "transactionPin": "1234"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "transactionId": "txn-789",
    "amount": 10000,
    "status": "COMPLETED",
    "timestamp": "2026-02-12T10:00:00Z"
  }
}
```

**Frontend Code**:
```javascript
const handlePayment = async () => {
  const response = await transactionsService.createPayment({
    merchantId,
    amount,
    description,
    transactionPin
  });
  
  if (response.success) {
    Alert.alert('Success', 'Payment completed');
    navigation.navigate('Home');
  }
};
```

---

#### RequestMoneyScreen
**Service**: Transaction service  
**Endpoint**: `POST https://transaction.movasafe.com/api/transactions/request`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "recipientId": "user-456",
  "amount": 5000,
  "currency": "RWF",
  "message": "Payment for lunch"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Money request sent",
  "data": {
    "requestId": "req-123",
    "recipientId": "user-456",
    "amount": 5000,
    "status": "PENDING"
  }
}
```

---

### Transaction Screens Backend Integration

#### AllTransactionsScreen
**Service**: `transactionsService.getTransactionHistory()`  
**Endpoint**: `GET https://transaction.movasafe.com/api/transactions/history?limit=20&offset=0&filter=ALL`  
**Auth Required**: ✅ Yes

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-123",
        "amount": 5000,
        "currency": "RWF",
        "type": "TRANSFER_SENT",
        "recipient": {
          "id": "user-456",
          "firstname": "Jane",
          "lastname": "Smith",
          "phoneNumber": "+250987654321"
        },
        "status": "COMPLETED",
        "timestamp": "2026-02-12T09:30:00Z",
        "description": "Payment"
      }
    ],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

**Frontend Code**:
```javascript
const fetchTransactions = async () => {
  try {
    const response = await transactionsService.getTransactionHistory({
      limit: 20,
      offset: 0,
      filter: selectedFilter
    });
    
    if (response.success) {
      setTransactions(response.data.transactions);
      setTotal(response.data.total);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to load transactions');
  }
};
```

---

#### TransactionDetailScreen
**Service**: `transactionsService.getTransactionDetail()`  
**Endpoint**: `GET https://transaction.movasafe.com/api/transactions/{transactionId}`  
**Auth Required**: ✅ Yes

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "txn-123",
    "amount": 5000,
    "currency": "RWF",
    "type": "TRANSFER_SENT",
    "sender": {
      "id": "user-123",
      "firstname": "John",
      "lastname": "Doe"
    },
    "recipient": {
      "id": "user-456",
      "firstname": "Jane",
      "lastname": "Smith"
    },
    "status": "COMPLETED",
    "description": "Payment for lunch",
    "fee": 100,
    "timestamp": "2026-02-12T09:30:00Z",
    "completedAt": "2026-02-12T09:31:00Z",
    "reference": "REF-123456"
  }
}
```

---

#### TransferMoneyScreen
**Service**: `transactionsService.createTransfer()` (auto-creates escrow)  
**Endpoint**: `POST https://transaction.movasafe.com/api/transactions/create`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "recipientId": "user-456",
  "amount": 10000,
  "currency": "RWF",
  "description": "Payment for goods",
  "transactionPin": "1234",
  "autoEscrow": true
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Transfer created with escrow protection",
  "data": {
    "transactionId": "txn-789",
    "escrowId": "escrow-123",
    "amount": 10000,
    "recipientId": "user-456",
    "status": "IN_ESCROW",
    "escrowStatus": "PENDING_CONFIRMATION",
    "timestamp": "2026-02-12T10:15:00Z"
  }
}
```

**Frontend Code**:
```javascript
const handleTransfer = async () => {
  const response = await transactionsService.createTransfer({
    recipientId,
    amount,
    description,
    transactionPin,
    autoEscrow: true  // Auto-create escrow for protection
  });
  
  if (response.success) {
    navigation.navigate('TransactionDetail', {
      transactionId: response.data.transactionId
    });
  }
};
```

---

#### CreateEscrowScreen
**Service**: `transactionsService.createEscrow()`  
**Endpoint**: `POST https://transaction.movasafe.com/api/escrow/create`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "buyerId": "user-123",
  "sellerId": "user-456",
  "amount": 50000,
  "currency": "RWF",
  "description": "Payment for laptop",
  "terms": "Payment upon delivery",
  "deliveryDeadline": "2026-02-20",
  "transactionPin": "1234"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Escrow agreement created",
  "data": {
    "escrowId": "escrow-123",
    "buyerId": "user-123",
    "sellerId": "user-456",
    "amount": 50000,
    "status": "PENDING_ACCEPTANCE",
    "buyerAccepted": true,
    "sellerAccepted": false,
    "createdAt": "2026-02-12T10:20:00Z"
  }
}
```

---

#### EscrowDetailScreen
**Service Multiple Calls**:

**1. Get Escrow Details**: `GET https://transaction.movasafe.com/api/escrow/{escrowId}`  
**Auth Required**: ✅ Yes
```javascript
// Response (200)
{
  "success": true,
  "data": {
    "id": "escrow-123",
    "buyerId": "user-123",
    "sellerId": "user-456",
    "amount": 50000,
    "status": "PENDING_RELEASE",
    "buyerAccepted": true,
    "sellerAccepted": true,
    "timeline": [
      {
        "event": "Created",
        "timestamp": "2026-02-12T10:20:00Z"
      },
      {
        "event": "Accepted by both",
        "timestamp": "2026-02-12T11:00:00Z"
      }
    ]
  }
}
```

**2. Release Escrow (Buyer action)**: `POST https://transaction.movasafe.com/api/escrow/{escrowId}/release`  
**Request Body**:
```json
{
  "transactionPin": "1234",
  "releaseReason": "Goods received and verified"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Escrow released, funds transferred to seller",
  "data": {
    "escrowId": "escrow-123",
    "status": "RELEASED",
    "releasedAt": "2026-02-12T11:30:00Z",
    "transactionId": "txn-999"
  }
}
```

**3. Dispute Escrow (Either party)**: `POST https://transaction.movasafe.com/api/escrow/{escrowId}/dispute`  
**Request Body**:
```json
{
  "reason": "Goods not received",
  "evidence": ["evidence_id_1", "evidence_id_2"]
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Dispute filed, awaiting resolution",
  "data": {
    "escrowId": "escrow-123",
    "status": "DISPUTED",
    "disputeId": "dispute-123",
    "filedAt": "2026-02-12T12:00:00Z"
  }
}
```

---

#### VendorPaymentScreen
**Service**: `transactionsService.createVendorPayment()`  
**Endpoint**: `POST https://transaction.movasafe.com/api/transactions/vendor-payment`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "vendorId": "vendor-123",
  "amount": 25000,
  "currency": "RWF",
  "invoiceNumber": "INV-2026-001",
  "description": "Invoice payment",
  "transactionPin": "1234",
  "autoEscrow": true
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Vendor payment created with escrow",
  "data": {
    "paymentId": "vpay-123",
    "escrowId": "escrow-456",
    "vendorId": "vendor-123",
    "amount": 25000,
    "status": "IN_ESCROW"
  }
}
```

---

#### TransactionExportScreen
**Service**: `transactionExportService.exportTransactions()`  

**1. Fetch Transactions for Export**: `GET https://transaction.movasafe.com/api/transactions/history?startDate=2026-01-01&endDate=2026-02-12&limit=1000`  
**Auth Required**: ✅ Yes

**2. Generate PDF/CSV**: `GET https://transaction.movasafe.com/api/transactions/export?format=pdf&startDate=2026-01-01&endDate=2026-02-12`  
**Response**: Binary file (PDF/CSV)

**3. Send Report via Email**: `POST https://transaction.movasafe.com/api/transactions/send-report`  
**Request Body**:
```json
{
  "format": "pdf",
  "email": "recipient@example.com",
  "startDate": "2026-01-01",
  "endDate": "2026-02-12",
  "includeDetails": true
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Report sent to your email",
  "data": {
    "reportId": "report-123",
    "sentTo": "recipient@example.com",
    "sentAt": "2026-02-12T13:00:00Z"
  }
}
```

**Frontend Code**:
```javascript
const handleExport = async () => {
  try {
    if (exportFormat === 'email') {
      const response = await transactionExportService.sendReport({
        format: 'pdf',
        email: emailAddress,
        startDate,
        endDate
      });
      
      Alert.alert('Success', 'Report sent to your email');
    } else {
      const response = await transactionExportService.export({
        format: exportFormat,
        startDate,
        endDate
      });
      
      // Download or share file
      Share.open({ url: response.url });
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

### Profile Screens Backend Integration

#### ProfileScreen
**Service**: `authService.getCurrentUser()` & `userService.getUserById()`  
**Endpoint**: `GET https://auth.movasafe.com/api/auth/users/current-user`  
**Auth Required**: ✅ Yes

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+250123456789",
    "gender": "MALE",
    "userType": "CLIENT",
    "accountStatus": "ACTIVE",
    "kycVerified": true,
    "userWalletContractAccepted": true,
    "vendorWalletContractAccepted": false,
    "createdAt": "2025-12-01T10:00:00Z",
    "profilePicture": "https://..."
  }
}
```

**Frontend Code**:
```javascript
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setUserProfile(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    }
  };
  
  fetchProfile();
}, []);
```

---

#### EditProfileScreen
**Service**: `userService.updateProfile()`  
**Endpoint**: `PUT https://auth.movasafe.com/api/auth/users/update-profile`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.newemail@example.com",
  "phoneNumber": "+250123456789",
  "gender": "MALE"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user-123",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.newemail@example.com",
    "updatedAt": "2026-02-12T14:00:00Z"
  }
}
```

---

### Settings Screens Backend Integration

#### ChangePasswordScreen
**Service**: `authService.changePassword()`  
**Endpoint**: `PUT https://auth.movasafe.com/api/auth/users/change-password`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "currentPassword": "54321",
  "newPassword": "12345",
  "confirmPassword": "12345"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "changedAt": "2026-02-12T14:30:00Z"
  }
}
```

**Frontend Code**:
```javascript
const handleChangePassword = async () => {
  try {
    const response = await authService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword
    });
    
    if (response.success) {
      Alert.alert('Success', 'Password changed');
      navigation.goBack();
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

#### SetTransactionPinScreen
**Service**: `transactionPinService.setTransactionPin()`  
**Endpoint**: `POST https://auth.movasafe.com/api/auth/users/set-transaction-pin`  
**Auth Required**: ✅ Yes

**Request Body**:
```json
{
  "currentPin": "1111",
  "newPin": "1234",
  "confirmPin": "1234"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Transaction PIN set successfully",
  "data": {
    "pinUpdatedAt": "2026-02-12T15:00:00Z"
  }
}
```

---

### KYC Screens Backend Integration

#### PersonaKycScreen (Persona SDK Integration)
**Service**: `kycService.getPersonaConfig()` & Persona SDK  
**Step 1 - Get Config**: `GET https://auth.movasafe.com/api/kyc/persona-config`  
**Auth Required**: ✅ Yes

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "inquiryId": "inquiry_abc123xyz",
    "inquiryTemplateId": "tmpl_prod_123",
    "status": "UNVERIFIED",
    "verificationAttempts": 0
  }
}
```

**Step 2 - Launch Persona**: React-native-persona library launches verification

**Step 3 - Persona Webhook**: When user completes verification, Persona calls:
```
POST https://auth.movasafe.com/api/kyc/verify
{
  "inquiryId": "inquiry_abc123xyz",
  "status": "VERIFIED"
}
```

**Step 4 - Get Updated Status**: `GET https://auth.movasafe.com/api/kyc/status`  
**Auth Required**: ✅ Yes

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "kycStatus": "VERIFIED",
    "verificationDate": "2026-02-12T15:30:00Z",
    "identityMismatch": false,
    "verifiedName": "John Doe"
  }
}
```

**Frontend Code**:
```javascript
useEffect(() => {
  const initKyc = async () => {
    try {
      // Get Persona config
      const config = await kycService.getPersonaConfig();
      
      // Launch Persona verification
      const result = await Persona.verify(config.inquiryId);
      
      if (result.status === 'COMPLETED') {
        // Poll for updated status
        const statusResponse = await kycService.getKycStatus();
        setKycStatus(statusResponse.data.kycStatus);
      }
    } catch (error) {
      Alert.alert('Error', 'KYC failed');
    }
  };
  
  initKyc();
}, []);
```

---

#### SimpleKycScreen
**Service**: `kycService.uploadDocument()`  
**Endpoint**: `POST https://auth.movasafe.com/api/kyc/upload-document`  
**Auth Required**: ✅ Yes

**Request Body** (Form Data):
```
Content-Type: multipart/form-data

{
  "documentType": "NATIONAL_ID",
  "documentNumber": "1234567890123",
  "file": <image_file>,
  "side": "FRONT"
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Document uploaded",
  "data": {
    "documentId": "doc-123",
    "documentType": "NATIONAL_ID",
    "uploadedAt": "2026-02-12T16:00:00Z"
  }
}
```

---

### Notifications Screen Backend Integration

#### NotificationsScreen
**Service**: Notification service  
**Endpoint**: `GET https://auth.movasafe.com/api/notifications/list?limit=50&offset=0`  
**Auth Required**: ✅ Yes

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif-123",
        "title": "Payment Received",
        "message": "You received RWF 5000 from Jane Smith",
        "type": "PAYMENT",
        "read": false,
        "timestamp": "2026-02-12T12:00:00Z",
        "actionUrl": "transaction/txn-123"
      }
    ],
    "total": 25,
    "unreadCount": 5
  }
}
```

**Mark as Read**: `POST https://auth.movasafe.com/api/notifications/{id}/mark-read`  
**Auth Required**: ✅ Yes

---

## Testing & Deployment

### Current Testing Setup

**Test Framework**: Jest

**Test Files Located**: `__tests__/` directory

**Test Categories**:
1. **Security Tests** (`__tests__/security/encryption.test.js`)
   - Token encryption/decryption
   - Password hashing validation
   - API request signing

2. **State Management Tests** (`__tests__/store/authSlice.test.js`)
   - Redux store actions
   - State mutations
   - Auth reducer logic

3. **Integration Tests** (`__tests__/transactions/`)
   - Transaction creation flow
   - Escrow operations
   - Transaction export

**Running Tests**:
```bash
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report
```

### Build & Deployment

#### Development Build
```bash
npm start                  # Start Expo development server
expo start                # Alternative command
```

#### Production Build

**For Android APK/AAB**:
```bash
eas build -p android --profile preview    # Preview build
eas build -p android --profile production # Production build
```

**For iOS**:
```bash
eas build -p ios --profile preview       # Preview build
eas build -p ios --profile production    # Production build
```

**Configuration**:
- **File**: `eas.json`
- **Project ID**: `baa770e4-f33f-4d42-b4ad-4e5d083d3ee8` (new Feb 2026)
- **Expo Account**: `j.did.it` (new Feb 2026)

#### Environment Configuration
- **File**: `config/env.config.js`
- **Microservices URLs**: `config/microservices.config.js`
- **API Endpoints**: `config/api.config.js`

### Deployment Checklist

- [ ] All screens tested in simulator/device
- [ ] Registration flow tested end-to-end
- [ ] Login/logout tested
- [ ] KYC verification flow tested with Persona
- [ ] Transactions tested with escrow
- [ ] Error handling tested (network errors, validation, etc.)
- [ ] All API endpoints responding correctly
- [ ] JWT token refresh working
- [ ] Push notifications configured (when available)
- [ ] Build signed with correct certificates
- [ ] Environment variables set correctly
- [ ] Analytics/logging configured
- [ ] Crash reporting configured

---

## Summary

### What's Working ✅

- **Complete Registration Flow**: All 5 steps fully implemented and tested
  - Register → OTP → PIN → Contract → Auto-login (FIXED Feb 12 2026)
- **Authentication**: Login, logout, token management, password reset
- **Wallet**: Balance view, transaction history, quick actions
- **Transactions**: P2P transfers, vendor payments, escrow protection
- **KYC**: Persona SDK integration for identity verification
- **Contracts**: User/Vendor wallet contract acceptance
- **Profiles**: User profile view and edit
- **Settings**: App settings, password/PIN management
- **Transaction Export**: PDF/Email export of transaction history
- **State Management**: Redux + React Context for global state

### What Needs Work ⏳

**Critical**:
- Push notifications (backend endpoints not live)
- Contract update automatic checking
- Advanced filtering

**Important**:
- Beneficiaries UI
- Evidence upload UI
- Vendor dashboard

**Enhancement**:
- 2FA, Biometric auth, i18n, Offline mode, Dark mode, In-app chat, Referral program

### Architecture Quality

- **Clean Separation of Concerns**: Services handle API logic, screens handle UI
- **Scalable Structure**: Feature-based module organization
- **Error Handling**: Comprehensive error handling throughout
- **Security**: JWT tokens, endpoint whitelisting, data validation
- **Performance**: Lazy loading, pagination support, image optimization
- **Accessibility**: Safe area handling, keyboard awareness, color contrast

### Backend Integration Status

- **AUTH Service**: ✅ Fully integrated
- **TRANSACTION Service**: ✅ Fully integrated
- **Persona SDK**: ✅ Integrated (third-party KYC)
- **Webhooks**: ⏳ Handler exists, backend setup in progress
- **Push Notifications**: ⏳ Not configured

---

**Last Updated**: February 12, 2026
**Version**: 1.0.0
**Maintained By**: Development Team
**Next Review**: After major feature additions

