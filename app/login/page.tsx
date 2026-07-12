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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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
      {message && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">{message}</p>
          {noAccountFound && (
            <a
              href="/signup"
              className="mt-2 inline-block text-sm text-[#12AD5C] hover:underline"
            >
              Create an account instead
            </a>
          )}
        </div>
      )}
    </div>
  )
}