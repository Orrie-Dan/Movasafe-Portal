'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Wallet } from 'lucide-react'
import { adminLogin } from '@/lib/auth'
import type { LoginRequest } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const loginRequest: LoginRequest = {
        emailOrPhoneNumber: emailOrPhone.trim(),
        password,
      }

      await adminLogin(loginRequest)
      
      // Redirect to admin dashboard on success
      router.push('/admin')
      router.refresh()
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-400">
                {error}
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

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} MovaSafe. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
