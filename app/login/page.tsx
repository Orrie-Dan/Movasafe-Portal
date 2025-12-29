'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { apiLogin, apiMe } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Twitter, Instagram, Facebook } from 'lucide-react'

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await apiLogin(email, password)
      const { user } = await apiMe()
      if (user.role === 'admin') {
        router.replace('/admin')
      } else if (user.role === 'officer') {
        router.replace('/officer')
      } else {
        router.replace('/')
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Login failed'
      if (errorMessage.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Main Content Frame - Full Screen */}
      <div 
        className={`w-full h-screen overflow-hidden bg-slate-900 transition-all duration-700 ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="grid lg:grid-cols-2 h-full">
          {/* Left Panel - Image and Marketing Text */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0">
              <Image
                src="/images/Recycle.png"
                alt="Waste Management"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
            
            {/* Template label - Top Left */}
            <div className="absolute top-6 left-6 z-10">
              <div className="flex items-center gap-2 text-white text-sm">
                <span className="border border-dashed border-white/50 px-2 py-1 rounded">WMS</span>
              </div>
            </div>

            {/* Marketing Content - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                 Waste Management System
              </h2>
              <p className="text-base md:text-lg text-white/90 font-light drop-shadow-md mb-8">
                Efficient, sustainable, and intelligent waste collection operations for a cleaner future.
              </p>
              
              
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="bg-black p-8 md:p-12 flex flex-col justify-center relative">
            {/* Template label - Top Right */}
            <div className="absolute top-6 right-6">
              <div className="flex items-center gap-2 text-white text-sm">
                <span className="border border-dashed border-white/50 px-2 py-1 rounded">WMS</span>
              </div>
            </div>

            <div className="max-w-md mx-auto w-full space-y-6">
              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded p-3">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                    Forgot your password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'SIGN IN'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Presented by */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <p className="text-white/60 text-xs">presented by <span className="font-bold">WMS</span></p>
      </div>
    </div>
  )
}
