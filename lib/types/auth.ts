// Authentication types and interfaces

export type UserType = 'CLIENT' | 'VENDOR' | 'ADMIN'

export interface User {
  id: string
  email: string
  fullName: string
  username?: string
  phoneNumber?: string
  nationalId?: string
  userType?: UserType
  role: string
  roles?: Role[]
  permissions?: string[]
  status: 'active' | 'suspended' | 'locked' | 'inactive'
  emailVerified: boolean
  kycVerified?: boolean
  mfaEnabled: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  profile?: UserProfile
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  timezone?: string
  locale?: string
}

export interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  permissions: string[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  displayName: string
  description?: string
  resource: string
  action: string
  category?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  success: boolean
  token: string
  refreshToken?: string
  user: User
  expiresIn?: number
}

export interface AuthSession {
  user: User
  token: string
  refreshToken?: string
  expiresAt: number
}

export interface MfaSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface MfaVerification {
  code: string
  backupCode?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
  confirmPassword: string
}

export interface PasswordChange {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Additional DTOs from Swagger
export interface LoginDTO {
  emailOrPhoneNumber: string  // API accepts both email and phone number
  password: string
}

export interface RegisterUserDTO {
  phoneNumber: string
  password: string
  // Add other fields from your Swagger as needed
  email?: string
  fullName?: string
}

export interface ResendOtpDTO {
  phoneNumber: string
}

export interface UpdateUserRoleDTO {
  roleId: string
  // Add other fields as needed
}

export interface ChangeCurrentPasswordDTO {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordDTO {
  phoneNumber: string
  otp: string
  newPassword: string
}

export interface ForgotPasswordDTO {
  phoneNumber: string
}

export interface VerifyPasswordDTO {
  phoneNumber: string
  password: string
}

export interface VerifyOtpDTO {
  phoneNumber: string
  otp: string
}

export interface ValidateTransactionPinDTO {
  phoneNumber: string
  transactionPin: string
}

export interface SetTransactionPinDTO {
  phoneNumber: string
  transactionPin: string
}

export interface ChangeTransactionPinDTO {
  phoneNumber: string
  currentPin: string
  newPin: string
}

export interface RolePermissionDTO {
  roleId: string
  permissionIds: string[]
}

