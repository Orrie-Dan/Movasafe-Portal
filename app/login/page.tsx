'use client'

import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Wallet } from 'lucide-react'
import { adminLogin, adminForgotPassword } from '@/lib/auth'
import type { LoginRequest } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmailOrPhone, setForgotEmailOrPhone] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const loginRequest: LoginRequest = {
        emailOrPhoneNumber: emailOrPhone.trim(),
        password,
        mfaCode,
      }

      await adminLogin(loginRequest)
      
      navigate('/admin')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = () => {
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setForgotError(null)
    setForgotSuccess(null)
    setForgotLoading(true)
    try {
      const result = await adminForgotPassword(forgotEmailOrPhone)
      setForgotSuccess(result.message || 'Request sent successfully.')
      setForgotOpen(false)
      setForgotEmailOrPhone('')
      navigate('/login')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit forgot password request'
      setForgotError(message)
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 border border-slate-700 rounded-lg mb-4">
            <Wallet className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MovaSafe Admin Portal</h1>
          <p className="text-slate-400 text-sm">Sign in to access the admin dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-black border border-slate-800 rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email or Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone" className="text-white">
                Email or Phone Number
              </Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="Enter your email or phone number"
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value)
                  handleInputChange()
                }}
                className="bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  handleInputChange()
                }}
                className="bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfaCode" className="text-white">
                MFA Code
              </Label>
              <Input
                id="mfaCode"
                type="text"
                placeholder="Enter your MFA code"
                value={mfaCode}
                onChange={(e) => {
                  setMfaCode(e.target.value)
                  handleInputChange()
                }}
                className="bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => {
                  setForgotOpen(true)
                  setForgotError(null)
                  setForgotSuccess(null)
                  setForgotEmailOrPhone(emailOrPhone)
                }}
                className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {forgotSuccess && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-md p-3 text-sm text-green-400">
                {forgotSuccess}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in as Admin'
              )}
            </Button>
          </form>
        </div>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent className="bg-black border border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter your email to request a password reset.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-white">
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmailOrPhone}
                  onChange={(e) => {
                    setForgotEmailOrPhone(e.target.value)
                    if (forgotError) setForgotError(null)
                  }}
                  className="bg-black border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={forgotLoading}
                />
              </div>
              {forgotError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-400">
                  {forgotError}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={forgotLoading}>
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} MovaSafe. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
