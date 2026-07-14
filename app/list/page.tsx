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
        // Check if profile is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, surname, email, proof_of_identity')
          .eq('user_id', user.id)
          .single()
        
        const isProfileComplete = profile && 
          profile.first_name && 
          profile.surname && 
          profile.email && 
          profile.proof_of_identity
        
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
        <p className="text-gray-600">Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">List Your Property</h1>
        
        {user ? (
          <>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-6 px-6 py-2 rounded-full text-white transition-opacity"
              style={{ backgroundColor: '#12AD5C' }}
            >
              {showForm ? 'Cancel' : 'Add New Property'}
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="mb-8 p-6 border border-green-tint-strong rounded-lg">
                <div className="grid gap-4">
                  <p className="font-medium">Select Property Type</p>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  >
                    <option value="" disabled>Select Property Type</option>
                    <option value="House">House</option>
                    <option value="Shop">Shop</option>
                    <option value="Land">Land</option>
                  </select>
                  
                  {formData.property_type && (
                    <>
                      <p className="font-medium">Select Property Details</p>
                      <select
                        name="property_details"
                        value={formData.property_details}
                        onChange={handleInputChange}
                        required
                        className="border rounded px-4 py-2 w-full"
                      >
                        <option value="" disabled>Select Property Details</option>
                        {getPropertyDetailsOptions().map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  <p className="font-medium">Further description of property details</p>
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full h-24"
                  />
                  
                  <p className="font-medium">Number of toilet facility</p>
                  <input
                    type="number"
                    name="toilets"
                    placeholder="Number of toilets"
                    value={formData.toilets}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  />
                  
                  <p className="font-medium">Price</p>
                  <input
                    type="number"
                    name="price"
                    placeholder="Price (Naira)"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  />
                  
                  <p className="font-medium">Address</p>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  />
                  
                  <p className="font-medium">Number/Units available</p>
                  <input
                    type="number"
                    name="units_available"
                    placeholder="Number of units available"
                    value={formData.units_available}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  />
                  
                  <p className="font-medium">Upload Property Images</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="border rounded px-4 py-2 w-full"
                  />
                  {selectedImages.length > 0 && (
                    <p className="text-sm text-gray-600">{selectedImages.length} image(s) selected</p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`px-6 py-2 rounded-full text-white mt-2 transition-opacity ${
                      uploading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    style={{ backgroundColor: '#12AD5C' }}
                  >
                    {uploading ? 'Uploading...' : 'List Property'}
                  </button>
                </div>
                
                {submitMessage && <p className="mt-4 text-sm text-gray-600">{submitMessage}</p>}
              </form>
            )}

            <h2 className="text-2xl font-semibold mb-4">Your Properties</h2>
            {properties.length === 0 ? (
              <p className="text-ink-soft">No properties listed yet. Add your first property above!</p>
            ) : (
              <div className="grid gap-4">
                {properties.map((prop) => (
                  <div key={prop.id} className="p-4 border border-green-tint-strong rounded-lg">
                    <h3 className="font-semibold text-lg">{prop.property_type}</h3>
                    <p className="text-ink-soft text-sm">{prop.address}</p>
                    <p className="font-bold text-green mt-1">₦{prop.price.toLocaleString()}</p>
                    {prop.image_urls && prop.image_urls.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {prop.image_urls.map((url, index) => (
                          <img key={index} src={url} alt={`Property ${index + 1}`} className="w-20 h-20 object-cover rounded" />
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
            <p className="text-lg mb-4">Please log in to list your property</p>
            <a href="/login" className="px-6 py-2 rounded-full text-white inline-block" style={{ backgroundColor: '#12AD5C' }}>
              Log In
            </a>
          </div>
        )}
      </div>
    </main>
  )
}