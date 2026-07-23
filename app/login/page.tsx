'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [noAccountFound, setNoAccountFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter both an email and a password.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      const errText = error.message.toLowerCase()
      if (errText.includes('email not confirmed')) {
        setMessage('Please confirm your email before logging in. Check your inbox.')
        setNoAccountFound(false)
      } else if (errText.includes('invalid login credentials')) {
        setMessage('No account found with that email and password, or your details are incorrect.')
        setNoAccountFound(true)
      } else {
        setMessage(error.message)
        setNoAccountFound(false)
      }
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display font-bold text-3xl text-on-surface">Log in to FAH</h1>
          <p className="text-on-surface-variant">Welcome back! Please enter your details.</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </div>
        
        {message && (
          <div className="text-center">
            <p className="text-sm text-on-surface-variant">{message}</p>
            {noAccountFound && (
              <a
                href="/signup"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Create an account instead
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  )
}