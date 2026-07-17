'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

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

export default function ListPage() {
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    property_type: '',
    property_details: '',
    description: '',
    price: '',
    address: '',
    toilets: '',
    units_available: '',
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
    if (user) {
      // Check if profile is complete (proof_of_identity is now optional)
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, surname, email')
        .eq('user_id', user.id)
        .single()
      
      const isProfileComplete = profile && 
        profile.first_name && 
        profile.surname && 
        profile.email
      
      if (!isProfileComplete) {
        router.push('/profile')
        return
      }
    }
      
      fetchProperties()
      setLoading(false)
    }
    
    checkUserAndProfile()
  }, [router])

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    if (data) {
      setProperties(data)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getPropertyDetailsOptions = () => {
    switch (formData.property_type) {
      case 'House':
        return ['1 room self contain', 'room and palour self contain', '2 bedroom flat', '3 bedroom flat', 'duplex', 'other']
      case 'Shop':
        return ['single shop', 'other']
      case 'Land':
        return ['bare land', 'other']
      default:
        return []
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(prev => [...prev, ...files])
  }

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return []
    
    setUploading(true)
    const uploadedUrls: string[] = []
    
    for (const file of selectedImages) {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file)
      
      if (data) {
        const { data: publicUrl } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path)
        if (publicUrl) {
          uploadedUrls.push(publicUrl.publicUrl)
        }
      }
    }
    
    setUploading(false)
    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const imageUrls = await uploadImages()

    const { error } = await supabase.from('properties').insert({
      ...formData,
      price: parseInt(formData.price),
      toilets: parseInt(formData.toilets),
      units_available: parseInt(formData.units_available),
      user_id: user.id,
      image_urls: imageUrls,
    })

    if (error) {
      setSubmitMessage('Error listing property. Please try again.')
    } else {
      setSubmitMessage('Property listed successfully!')
      setFormData({ property_type: '', property_details: '', description: '', price: '', address: '', toilets: '', units_available: '' })
      setSelectedImages([])
      setShowForm(false)
      fetchProperties()
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
    <main className="flex-1 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-2">
            <h1 className="font-display font-bold text-3xl text-on-surface">List Your Property</h1>
            <p className="text-on-surface-variant">Add your property to reach potential tenants.</p>
          </div>
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-primary-container text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              {showForm ? 'Cancel' : 'Add New Property'}
            </button>
          )}
        </div>
        
        {user ? (
          <>
            {showForm && (
              <form onSubmit={handleSubmit} className="mb-8 p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Property Type *</label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select Property Type</option>
                      <option value="House">House</option>
                      <option value="Shop">Shop</option>
                      <option value="Land">Land</option>
                    </select>
                  </div>
                  
                  {formData.property_type && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Property Details *</label>
                      <select
                        name="property_details"
                        value={formData.property_details}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>Select Property Details</option>
                        {getPropertyDetailsOptions().map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Description *</label>
                    <textarea
                      name="description"
                      placeholder="Describe your property..."
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary h-24"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Toilets *</label>
                      <input
                        type="number"
                        name="toilets"
                        placeholder="Number of toilets"
                        value={formData.toilets}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Price (₦) *</label>
                      <input
                        type="number"
                        name="price"
                        placeholder="Price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Address *</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Property address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Units Available *</label>
                    <input
                      type="number"
                      name="units_available"
                      placeholder="Number of units"
                      value={formData.units_available}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Upload Property Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {selectedImages.length > 0 && (
                      <p className="text-xs text-on-surface-variant">{selectedImages.length} image(s) selected</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full py-3 px-6 bg-primary text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
                      uploading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'List Property'}
                  </button>
                </div>
                
                {submitMessage && <p className="mt-4 text-sm text-center text-on-surface-variant">{submitMessage}</p>}
              </form>
            )}

            <h2 className="text-2xl font-semibold mb-4 text-on-surface">Your Properties</h2>
            {properties.length === 0 ? (
              <p className="text-on-surface-variant">No properties listed yet. Add your first property above!</p>
            ) : (
              <div className="grid gap-4">
                {properties.map((prop) => (
                  <div key={prop.id} className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg text-on-surface">{prop.property_type} - {prop.property_details}</h3>
                    <p className="text-on-surface-variant text-sm">{prop.address}</p>
                    <p className="font-bold text-primary mt-1">₦{prop.price.toLocaleString()}</p>
                    {prop.image_urls && prop.image_urls.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {prop.image_urls.map((url, index) => (
                          <img key={index} src={url} alt={`Property ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg mb-4 text-on-surface">Please log in to list your property</p>
            <a href="/login" className="px-6 py-3 bg-primary-container text-white rounded-xl font-semibold inline-block">
              Log In
            </a>
          </div>
        )}
      </div>
    </main>
  )
}