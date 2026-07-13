'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  user_id: string
  full_name: string
  phone: string
  avatar_url?: string
  created_at?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  })
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      
      // Fetch existing profile
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        })
      }
      setLoading(false)
    }
    
    checkUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      full_name: formData.full_name,
      phone: formData.phone,
    })

    setSaving(false)
    if (error) {
      setMessage('Error saving profile. Please try again.')
    } else {
      setMessage('Profile saved successfully!')
      setProfile({ ...profile, user_id: user.id, ...formData } as Profile)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 px-6 py-20">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-20">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="full_name"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            className="border rounded px-4 py-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="border rounded px-4 py-2 w-full"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className={`px-6 py-2 rounded-full text-white w-full transition-opacity ${
            saving ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          style={{ backgroundColor: '#12AD5C' }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {message && (
          <p className="mt-4 text-sm text-center text-gray-600">{message}</p>
        )}
      </form>
    </div>
  )
}