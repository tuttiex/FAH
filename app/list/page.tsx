'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Property {
  id: string
  property_type: string
  property_details: string
  description: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  units_available: number
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
    location: '',
    bedrooms: '',
    bathrooms: '',
    units_available: '',
  })
  const [submitMessage, setSubmitMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Fetch existing properties
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    if (data) {
      setProperties(data)
    }
    setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const { error } = await supabase.from('properties').insert({
      ...formData,
      price: parseInt(formData.price),
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseInt(formData.bathrooms),
      units_available: parseInt(formData.units_available),
      user_id: user.id,
    })

    if (error) {
      setSubmitMessage('Error listing property. Please try again.')
    } else {
      setSubmitMessage('Property listed successfully!')
      setFormData({ property_type: '', property_details: '', description: '', price: '', location: '', bedrooms: '', bathrooms: '', units_available: '' })
      setShowForm(false)
      fetchProperties()
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">List Your Property</h1>
        
        {user ? (
          <>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-6 px-6 py-2 rounded-full text-white"
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
                  <input
                    type="number"
                    name="price"
                    placeholder="Price (USD)"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  />
                  <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-4 py-2 w-full"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="bedrooms"
                      placeholder="Bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      required
                      className="border rounded px-4 py-2"
                    />
                    <input
                      type="number"
                      name="bathrooms"
                      placeholder="Bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      required
                      className="border rounded px-4 py-2"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full text-white mt-2"
                    style={{ backgroundColor: '#12AD5C' }}
                  >
                    List Property
                  </button>
                </div>
                
                {submitMessage && <p className="mt-4 text-sm text-gray-600">{submitMessage}</p>}
              </form>
            )}

            <h2 className="text-2xl font-semibold mb-4">Your Properties</h2>
            {loading ? (
              <p>Loading properties...</p>
            ) : properties.length === 0 ? (
              <p className="text-ink-soft">No properties listed yet. Add your first property above!</p>
            ) : (
              <div className="grid gap-4">
                {properties.map((prop) => (
                  <div key={prop.id} className="p-4 border border-green-tint-strong rounded-lg">
                    <h3 className="font-semibold text-lg">{prop.property_type}</h3>
                    <p className="text-ink-soft text-sm">{prop.location}</p>
                    <p className="font-bold text-green mt-1">${prop.price.toLocaleString()}</p>
                    <p className="text-sm mt-2">{prop.bedrooms} bd • {prop.bathrooms} ba</p>
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