'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  user_id: string
  first_name: string
  surname: string
  email: string
  phone: string
  proof_of_identity?: string
  avatar_url?: string
  created_at?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    phone: '',
    proof_of_identity: '',
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
          first_name: data.first_name || '',
          surname: data.surname || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          proof_of_identity: data.proof_of_identity || '',
        })
      } else {
        // Pre-fill email from auth user
        setFormData(prev => ({ ...prev, email: user.email || '' }))
      }
      setLoading(false)
    }
    
    checkUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadProofOfIdentity = async (): Promise<string> => {
    if (!selectedFile || !user) return ''
    
    const fileName = `proof-of-identity-${user.id}-${Date.now()}-${selectedFile.name}`
    const { data, error } = await supabase.storage
      .from('proof-of-identity')
      .upload(fileName, selectedFile)
    
    if (error) {
      console.error('Upload error:', error)
      return ''
    }
    
    const { data: publicUrl } = supabase.storage
      .from('proof-of-identity')
      .getPublicUrl(data.path)
    
    return publicUrl?.publicUrl || ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    
    // Upload proof of identity image if selected
    let proofOfIdentityUrl = formData.proof_of_identity
    if (selectedFile) {
      proofOfIdentityUrl = await uploadProofOfIdentity()
    }

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      first_name: formData.first_name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone,
      proof_of_identity: proofOfIdentityUrl,
    })

    setSaving(false)
    if (error) {
      setMessage('Error saving profile. Please try again.')
    } else {
      setMessage('Profile saved successfully!')
      setProfile({ ...profile, user_id: user.id, ...formData, proof_of_identity: proofOfIdentityUrl } as Profile)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display font-bold text-3xl text-on-surface">Complete Your Profile</h1>
          <p className="text-on-surface-variant">Please provide your details to continue.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">First Name</label>
            <input
              type="text"
              name="first_name"
              placeholder="Enter your first name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Surname</label>
            <input
              type="text"
              name="surname"
              placeholder="Enter your surname"
              value={formData.surname}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              readOnly
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-surface-container cursor-not-allowed"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Proof of Identity (Image)</label>
            <input
              type="file"
              name="proof_of_identity"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {selectedFile && (
              <p className="text-xs text-on-surface-variant">Selected: {selectedFile.name}</p>
            )}
            {!selectedFile && formData.proof_of_identity && (
              <p className="text-xs text-on-surface-variant">Current file uploaded</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
              saving ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
        
        {message && (
          <p className="text-sm text-center text-on-surface-variant">{message}</p>
        )}
      </div>
    </main>
  )
}