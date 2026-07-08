'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
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
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  )
}