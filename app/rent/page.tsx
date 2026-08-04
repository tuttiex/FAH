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
  user_id: string
}

function RentPageContent() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read homepage search query params (location, type, budget)
  const locationParam = searchParams.get('location') || ''
  const typeParam = searchParams.get('type') || ''
  const budgetParam = searchParams.get('budget') || ''

  // Pre-fill the search input from the homepage location query param
  const [searchTerm, setSearchTerm] = useState(locationParam)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
    fetchProperties()
    // TODO: wire up Property Type (typeParam) and Budget (budgetParam) filtering
    // to the existing search logic. For now, location drives the text search.
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    if (data) {
      setProperties(data)
    }
    setLoading(false)
  }

  const filteredProperties = properties.filter((prop) =>
    prop.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.property_details.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleContactOwner = (ownerId: string, propertyId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    if (ownerId === user.id) {
      alert('This is your own property listing.')
      return
    }
    router.push(`/messages/${ownerId}?property=${propertyId}`)
  }

  return (
    <main className="flex-1 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 space-y-2">
          <h1 className="font-display font-bold text-3xl text-on-surface">Find Your Home</h1>
          <p className="text-on-surface-variant">Browse our curated selection of properties.</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by location, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <p className="text-on-surface-variant">Loading properties...</p>
        ) : filteredProperties.length === 0 ? (
          <p className="text-on-surface-variant">No properties found. {searchTerm ? 'Try a different search.' : 'Be the first to list a property!'}</p>
        ) : (
          <div className="grid gap-6">
            {filteredProperties.map((prop) => (
              <div key={prop.id} className="p-6 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                <h2 className="font-semibold text-xl mb-2 text-on-surface">{prop.property_type} - {prop.property_details}</h2>
                <p className="text-on-surface-variant text-sm mb-3">{prop.address}</p>
                <p className="text-gray-700 mb-4">{prop.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary text-lg">₦{prop.price.toLocaleString()}</span>
                  <span className="text-sm text-on-surface-variant">{prop.toilets} toilet • {prop.units_available} unit(s) available</span>
                </div>
                {prop.image_urls && prop.image_urls.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {prop.image_urls.map((url, index) => (
                      <img key={index} src={url} alt={`Property ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => handleContactOwner(prop.user_id, prop.id)}
                  className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Contact Owner
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function RentPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </main>
    }>
      <RentPageContent />
    </Suspense>
  )
}