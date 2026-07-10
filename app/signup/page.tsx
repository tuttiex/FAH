'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !canResend) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account.')
      setCanResend(false)
      setCountdown(90)
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
      setCountdown(90)
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
        className="px-6 py-2 rounded-full text-white w-full max-w-sm"
        style={{ backgroundColor: '#12AD5C' }}
      >
        Sign Up
      </button>
      {message && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">{message}</p>
          {message.includes('Check your email') && (
            <button
              onClick={handleResend}
              disabled={!canResend}
              className={`mt-2 px-4 py-1 rounded text-sm ${
                canResend 
                  ? 'text-green hover:underline' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {canResend 
                ? 'Resend confirmation email' 
                : `Resend in ${countdown}s`
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
