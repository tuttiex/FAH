'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter both an email and a password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setMessage('Please confirm your email before logging in. Check your inbox.')
      } else {
        setMessage(error.message)
      }
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-20">
      <h1 className="text-2xl font-bold mb-6">Log in to FAH</h1>
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
        onClick={handleLogin}
        disabled={loading}
        className={`px-6 py-2 rounded-full text-white w-full max-w-sm transition-opacity ${
          loading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        style={{ backgroundColor: '#12AD5C' }}
      >
        {loading ? 'Logging in…' : 'Log In'}
      </button>
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  )
}