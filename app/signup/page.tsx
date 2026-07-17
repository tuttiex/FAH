'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [accountExists, setAccountExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  const isCounting = countdown > 0

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (!isCounting) return

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isCounting])

  const handleSignUp = async () => {
    // Basic client-side validation before hitting Supabase
    if (!email || !password) {
      setMessage('Please enter both an email and a password.')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      setMessage(error.message)
      setSignupSuccess(false)
      setAccountExists(false)
      return
    }

    // Supabase returns no error for an already-registered, confirmed email —
    // an empty identities array is how we detect it
    if (data?.user?.identities && data.user.identities.length === 0) {
      setMessage('An account with this email already exists.')
      setSignupSuccess(false)
      setAccountExists(true)
      return
    }

    setMessage('Check your email to confirm your account.')
    setSignupSuccess(true)
    setAccountExists(false)
    setCanResend(false)
    setCountdown(60)
  }

  const handleResend = async () => {
    if (!canResend) return

    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Confirmation email sent! Check your inbox.')
      setCanResend(false)
      setCountdown(60)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display font-bold text-3xl text-on-surface">Create your FAH account</h1>
          <p className="text-on-surface-variant">Join us to find or list your perfect home.</p>
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
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleSignUp}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Signing up…' : 'Sign Up'}
          </button>
        </div>
        
        {message && (
          <div className="text-center">
            <p className="text-sm text-on-surface-variant">{message}</p>
            {signupSuccess && (
              <button
                onClick={handleResend}
                disabled={!canResend}
                className={`mt-2 px-4 py-1 rounded text-sm ${
                  canResend
                    ? 'text-primary hover:underline'
                    : 'text-on-surface-variant/40 cursor-not-allowed'
                }`}
              >
                {canResend ? 'Resend confirmation email' : `Resend in ${countdown}s`}
              </button>
            )}
            {accountExists && (
              <a
                href="/login"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Log in instead
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  )
}