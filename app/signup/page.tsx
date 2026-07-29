'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [accountExists, setAccountExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const router = useRouter()

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

  const handleStep1 = async () => {
    if (!email || !password) {
      setMessage('Please enter both an email and a password.')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setMessage('')
    setStep(2)
  }

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', value)
      .maybeSingle()
    
    setUsernameAvailable(!data)
    setUsernameChecking(false)
  }

  const validateUsername = (value: string): boolean => {
    // Letters, numbers, periods, dashes — 3-16 characters
    return /^[a-zA-Z0-9.\-]{3,16}$/.test(value)
  }

  const handleSignUp = async () => {
    if (!firstName || !surname) {
      setMessage('Please enter your first name and surname.')
      return
    }

    if (!username || !validateUsername(username)) {
      setMessage('Username must be 3-16 characters and can only contain letters, numbers, periods, and dashes.')
      return
    }

    if (usernameAvailable === false) {
      setMessage('This username is already taken. Please choose another.')
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

    // Supabase returns no error for an already-registered, confirmed email
    if (data?.user?.identities && data.user.identities.length === 0) {
      setMessage('An account with this email already exists.')
      setSignupSuccess(false)
      setAccountExists(true)
      return
    }

    // Create profile immediately (user may need to confirm email first)
    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: data.user.id,
        first_name: firstName,
        surname,
        email,
        phone,
        username,
      })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
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

  const handleBackToStep1 = () => {
    setStep(1)
    setMessage('')
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display font-bold text-3xl text-on-surface">Create your FAH account</h1>
          <p className="text-on-surface-variant">Join us to find or list your perfect home.</p>
        </div>
        
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 1 ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface-variant'
          }`}>
            1
          </div>
          <div className="w-12 h-0.5 bg-surface-container">
            <div className={`h-full transition-all ${
              step >= 2 ? 'bg-primary-container' : ''
            }`} />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 2 ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface-variant'
          }`}>
            2
          </div>
        </div>

        {step === 1 && (
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
              onClick={handleStep1}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && !signupSuccess && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Username *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value
                    setUsername(value)
                    if (validateUsername(value)) {
                      checkUsername(value)
                    } else {
                      setUsernameAvailable(null)
                    }
                  }}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameChecking && (
                    <svg className="animate-spin w-5 h-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="#12AD5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">Letters, numbers, periods and dashes only (3-16 characters)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">First Name *</label>
              <input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Surname *</label>
              <input
                type="text"
                placeholder="Enter your surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBackToStep1}
                className="flex-1 py-3 px-6 border border-outline-variant text-on-surface rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]"
              >
                Back
              </button>
              <button
                onClick={handleSignUp}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Signing up…' : 'Sign Up'}
              </button>
            </div>
          </div>
        )}
        
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

        {signupSuccess && (
          <p className="text-center text-sm text-on-surface-variant">
            After confirming your email, you can{' '}
            <a href="/login" className="text-primary hover:underline">log in here</a>.
          </p>
        )}
      </div>
    </main>
  )
}