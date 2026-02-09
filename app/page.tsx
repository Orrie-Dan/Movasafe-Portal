'use client'

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-300">Loading...</div>
    </div>
  )
}
