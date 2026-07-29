'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function ListPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
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
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if profile is complete
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
      
      // Check for edit query param
      const editId = searchParams.get('edit')
      if (editId) {
        await loadPropertyForEdit(editId)
      }
      
      fetchProperties()
      setLoading(false)
    }
    
    checkUserAndProfile()
  }, [router, searchParams])

  const loadPropertyForEdit = async (propertyId: string) => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (data) {
      setEditingPropertyId(data.id)
      setFormData({
        property_type: data.property_type,
        property_details: data.property_details,
        description: data.description,
        price: data.price.toString(),
        address: data.address,
        toilets: data.toilets.toString(),
        units_available: data.units_available.toString(),
      })
      setExistingImages(data.image_urls || [])
      setImagesToDelete([])
      setShowForm(true)
    }
  }

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

  const handleRemoveExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url))
    setImagesToDelete(prev => [...prev, url])
  }

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
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

    const newImageUrls = await uploadImages()
    const finalImageUrls = [...existingImages, ...newImageUrls]

    if (editingPropertyId) {
      // Update existing property
      const { error } = await supabase
        .from('properties')
        .update({
          property_type: formData.property_type,
          property_details: formData.property_details,
          description: formData.description,
          price: parseInt(formData.price),
          address: formData.address,
          toilets: parseInt(formData.toilets),
          units_available: parseInt(formData.units_available),
          image_urls: finalImageUrls,
        })
        .eq('id', editingPropertyId)

      if (error) {
        setSubmitMessage('Error updating property. Please try again.')
      } else {
        setSubmitMessage('Property updated successfully!')
        resetForm()
        fetchProperties()
      }
    } else {
      // Insert new property
      const { error } = await supabase.from('properties').insert({
        ...formData,
        price: parseInt(formData.price),
        toilets: parseInt(formData.toilets),
        units_available: parseInt(formData.units_available),
        user_id: user.id,
        image_urls: newImageUrls,
      })

      if (error) {
        setSubmitMessage('Error listing property. Please try again.')
      } else {
        setSubmitMessage('Property listed successfully!')
        resetForm()
        fetchProperties()
      }
    }
  }

  const resetForm = () => {
    setFormData({ property_type: '', property_details: '', description: '', price: '', address: '', toilets: '', units_available: '' })
    setSelectedImages([])
    setExistingImages([])
    setImagesToDelete([])
    setEditingPropertyId(null)
    setShowForm(false)
    // Remove edit param from URL
    router.push('/list')
  }

  const handleCancel = () => {
    resetForm()
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
            <h1 className="font-display font-bold text-3xl text-on-surface">
              {editingPropertyId ? 'Edit Property' : 'List Your Property'}
            </h1>
            <p className="text-on-surface-variant">
              {editingPropertyId ? 'Update your property details.' : 'Add your property to reach potential tenants.'}
            </p>
          </div>
          {user && !editingPropertyId && (
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
                    <label className="text-sm font-semibold text-on-surface">
                      {editingPropertyId ? 'Add More Images' : 'Upload Property Images'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    
                    {/* Existing images (edit mode) */}
                    {editingPropertyId && existingImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-on-surface mb-2">Current Images:</p>
                        <div className="flex flex-wrap gap-3">
                          {existingImages.map((url, index) => (
                            <div key={index} className="relative group">
                              <img src={url} alt={`Existing ${index + 1}`} className="w-24 h-24 object-cover rounded-lg border border-outline-variant/30" />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(url)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Newly selected images */}
                    {selectedImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-on-surface mb-2">New Images:</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`New ${index + 1}`} 
                                className="w-24 h-24 object-cover rounded-lg border border-outline-variant/30" 
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveNewImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 py-3 px-6 border border-outline-variant text-on-surface rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className={`flex-1 py-3 px-6 bg-primary text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
                        uploading ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? 'Uploading...' : editingPropertyId ? 'Update Property' : 'List Property'}
                    </button>
                  </div>
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

export default function ListPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </main>
    }>
      <ListPageContent />
    </Suspense>
  )
}
