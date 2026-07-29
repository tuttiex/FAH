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
  username?: string
  email: string
  phone: string
  avatar_url?: string
  created_at?: string
}

interface Property {
  id: string
  property_type: string
  property_details: string
  description: string
  price: number
  address: string
  toilets: number
  units_available: number
  image_urls?: string[]
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    username: '',
    email: '',
    phone: '',
  })
  const router = useRouter()

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          first_name: profileData.first_name || '',
          surname: profileData.surname || '',
          username: profileData.username || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
        })
      }

      // Fetch user's properties
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (props) {
        setProperties(props)
      }

      setLoading(false)
    }

    checkUserAndProfile()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedAvatar(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedAvatar) return null

    const fileName = `avatar-${user?.id}-${Date.now()}`
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, selectedAvatar)

    if (data) {
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)
      return publicUrl?.publicUrl
    }
    return null
  }

  const handleSave = async () => {
    if (!user) return

    // Check if username is already taken by another user
    if (formData.username && formData.username !== profile?.username) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', formData.username)
        .neq('user_id', user.id)
        .maybeSingle()

      if (existingUser) {
        setMessage('Username already taken. Please choose another.')
        setSaving(false)
        return
      }
    }

    setSaving(true)
    let avatarUrl: string | undefined = profile?.avatar_url

    if (selectedAvatar) {
      const uploadedUrl = await uploadAvatar()
      avatarUrl = uploadedUrl || undefined
    }

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      first_name: formData.first_name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone,
      username: formData.username,
      avatar_url: avatarUrl,
    }, { onConflict: 'user_id' })

    setSaving(false)
    if (error) {
      if (error.code === '23505') {
        setMessage('Username already taken. Please choose another.')
      } else {
        setMessage('Error saving profile. Please try again.')
      }
    } else {
      setMessage('Profile updated successfully!')
      setProfile({
        id: profile?.id || '',
        user_id: user.id,
        ...formData,
        avatar_url: avatarUrl || '',
      })
      setEditing(false)
      setSelectedAvatar(null)
      setAvatarPreview(null)
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return

    const { error } = await supabase.from('properties').delete().eq('id', propertyId)
    if (!error) {
      setProperties(properties.filter(p => p.id !== propertyId))
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </main>
    )
  }

  const totalValue = properties.reduce((sum, p) => sum + (p.price * p.units_available), 0)

  return (
    <main className="flex-1 px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container border-2 border-outline-variant/30">
              {avatarPreview || profile?.avatar_url ? (
                <img 
                  src={avatarPreview || profile?.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            {editing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-container transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display font-bold text-3xl text-on-surface">
              {profile?.first_name} {profile?.surname}
            </h1>
            <p className="text-sm text-primary font-medium">@{profile?.username}</p>
            <p className="text-on-surface-variant">{profile?.email}</p>
            <p className="text-on-surface-variant">{profile?.phone}</p>
          </div>

          <button
            onClick={() => {
              setEditing(!editing)
              if (editing) {
                setFormData({
                  first_name: profile?.first_name || '',
                  surname: profile?.surname || '',
                  username: profile?.username || '',
                  email: profile?.email || user?.email || '',
                  phone: profile?.phone || '',
                })
                setSelectedAvatar(null)
                setAvatarPreview(null)
                setMessage('')
              }
            }}
            className="px-6 py-2 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-3xl font-bold text-primary">{properties.length}</p>
            <p className="text-sm text-on-surface-variant">Properties Listed</p>
          </div>
          <div className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-3xl font-bold text-primary">{properties.reduce((sum, p) => sum + p.units_available, 0)}</p>
            <p className="text-sm text-on-surface-variant">Total Units</p>
          </div>
          <div className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-3xl font-bold text-primary">₦{totalValue.toLocaleString()}</p>
            <p className="text-sm text-on-surface-variant">Total Value</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        {editing && (
          <div className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30">
            <h2 className="font-display font-bold text-xl text-on-surface mb-4">Edit Profile</h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Surname</label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-surface-container cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3 px-6 bg-primary text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
                  saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {message && <p className="text-sm text-center text-on-surface-variant">{message}</p>}
            </div>
          </div>
        )}

        {/* My Properties Section */}
        <div>
          <h2 className="font-display font-bold text-2xl text-on-surface mb-4">My Properties</h2>
          {properties.length === 0 ? (
            <p className="text-on-surface-variant">You haven't listed any properties yet.</p>
          ) : (
            <div className="grid gap-4">
              {properties.map((prop) => (
                <div key={prop.id} className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row gap-4">
                    {prop.image_urls && prop.image_urls.length > 0 && (
                      <img 
                        src={prop.image_urls[0]} 
                        alt={prop.property_type} 
                        className="w-full md:w-48 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-on-surface">{prop.property_type} - {prop.property_details}</h3>
                      <p className="text-on-surface-variant text-sm">{prop.address}</p>
                      <p className="text-gray-700 text-sm mt-1 line-clamp-2">{prop.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-primary">₦{prop.price.toLocaleString()}</span>
                        <span className="text-sm text-on-surface-variant">{prop.toilets} toilet • {prop.units_available} unit(s)</span>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2">
                      <button
                        onClick={() => router.push(`/list?edit=${prop.id}`)}
                        className="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-semibold text-sm hover:bg-outline-variant/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
