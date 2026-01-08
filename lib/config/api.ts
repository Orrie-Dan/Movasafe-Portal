// API Configuration - Base URLs and endpoints

export const API_CONFIG = {
  AUTH: {
    baseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL || 
      'http://authentificationv2-env.eba-zxhbu6ur.eu-north-1.elasticbeanstalk.com',
    endpoints: {
      // Authentication
      signin: '/api/auth/open/signin',
      register: '/api/auth/open/register',
      resendOtp: '/api/auth/open/resend-activation-otp',
      accountStatus: '/api/auth/open/account-status',
      
      // Current User
      currentUser: '/api/auth/users/current-user',
      
      // Users
      users: {
        all: '/api/auth/users/all',
        byId: '/api/auth/users',
        byPhone: '/api/auth/users/user-info',
        byNationalIds: '/api/auth/users/by-national-ids',
        totalUsers: '/api/auth/users/total-users',
        portalClients: '/api/auth/users/portal/clients',
        checkExists: '/api/auth/users/check-user-exists',
        update: '/api/auth/users/update',
        delete: '/api/auth/users',
        // Password Management
        changePassword: '/api/auth/users/change-password',
        changeCurrentPassword: '/api/auth/users/change-current-password',
        resetPassword: '/api/auth/users/reset-password',
        forgotPassword: '/api/auth/users/forgot-password',
        setPassword: '/api/auth/users/set-user-password',
        verifyPassword: '/api/auth/users/verify-password',
        // Transaction PIN
        setTransactionPin: '/api/auth/users/set-transaction-pin',
        setTransactionPinByContact: '/api/auth/users/set-transaction-pin-by-contact',
        changeTransactionPin: '/api/auth/users/change-transaction-pin',
        validateTransactionPin: '/api/auth/users/validate-transaction-pin',
        // OTP
        verifyOtp: '/api/auth/users/verify-otp',
        // API Keys
        createApiKey: '/api/auth/users/create-user-apikey',
        getApiKeys: '/api/auth/users',
        // Role Management
        updateUserRole: '/api/auth/users/portal/update-user-role',
      },
      
      // Roles
      roles: {
        all: '/api/auth/roles/all',
        byId: '/api/auth/roles/by-id',
        addNew: '/api/auth/roles/add-new',
        update: '/api/auth/roles/update',
        delete: '/api/auth/roles/delete',
        addPermissions: '/api/auth/roles/add-permissions',
        removePermissions: '/api/auth/roles/remove-permissions',
      },
      
      // Permissions
      permissions: {
        all: '/api/auth/permissions/all',
      },
    }
  },
  TRANSACTION: {
    baseUrl: process.env.NEXT_PUBLIC_TRANSACTION_API_URL || 
      'http://movasafe-transaction-env.eba-ydyugcws.eu-north-1.elasticbeanstalk.com',
    endpoints: {
      // Wallet Accounts
      createWalletAccount: '/api/transactions/accounts',
      // Transactions
      transfer: '/api/transactions/transfer',
      escrowPayVendor: '/api/transactions/escrow/pay-vendor',
      allTransactions: '/api/transactions/all',
      transactionByUser: '/api/transactions/by-user',
      transactionById: '/api/transactions',
      // Wallets
      walletById: '/api/transactions/wallets',
      walletByUser: '/api/transactions/wallets/by-user',
      allWallets: '/api/transactions/wallets/all',
    }
  },
  ESCROW: {
    baseUrl: process.env.NEXT_PUBLIC_ESCROW_API_URL || 
      process.env.NEXT_PUBLIC_TRANSACTION_API_URL || 
      'http://movasafe-transaction-env.eba-ydyugcws.eu-north-1.elasticbeanstalk.com',
    endpoints: {
      create: '/api/escrows/create',
      list: '/api/escrows/my-escrows/list',
      approve: '/api/escrows/approve',
      release: '/api/escrows/release',
      refund: '/api/escrows/refund',
      byId: '/api/escrows',
    }
  },
  AUDIT: {
    baseUrl: process.env.NEXT_PUBLIC_AUDIT_API_URL || 
      'http://movasafeaudit-env.eba-np6jzj74.eu-north-1.elasticbeanstalk.com/api/audit-logs',
    endpoints: {
      // Will be updated when audit service endpoints are provided
    }
  }
} as const

