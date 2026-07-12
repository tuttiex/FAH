'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
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
    const { error } = await supabase.auth.signUp({
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
    } else {
      setMessage('Check your email to confirm your account.')
      setSignupSuccess(true)
      setCanResend(false)
      setCountdown(60)
    }
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
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-20">
      <h1 className="text-2xl font-bold mb-6">Create your FAH account</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-4 py-2 mb-3 w-full max-w-sm"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-4 py-2 mb-4 w-full max-w-sm"
      />
      <button
        onClick={handleSignUp}
        disabled={loading}
        className={`px-6 py-2 rounded-full text-white w-full max-w-sm transition-opacity ${
          loading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        style={{ backgroundColor: '#12AD5C' }}
      >
        {loading ? 'Signing up…' : 'Sign Up'}
      </button>
      {message && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">{message}</p>
          {signupSuccess && (
            <button
              onClick={handleResend}
              disabled={!canResend}
              className={`mt-2 px-4 py-1 rounded text-sm ${
                canResend
                  ? 'text-[#12AD5C] hover:underline'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {canResend ? 'Resend confirmation email' : `Resend in ${countdown}s`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}