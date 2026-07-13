'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Property {
  id: string
  title: string
  description: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  created_at: string
}

export default function RentPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
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

  const filteredProperties = properties.filter((prop) =>
    prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="flex-1 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Find Your Home</h1>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by location, title, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-4 py-2 w-full max-w-md"
          />
        </div>

        {loading ? (
          <p>Loading properties...</p>
        ) : filteredProperties.length === 0 ? (
          <p className="text-ink-soft">No properties found. {searchTerm ? 'Try a different search.' : 'Be the first to list a property!'}</p>
        ) : (
          <div className="grid gap-6">
            {filteredProperties.map((prop) => (
              <div key={prop.id} className="p-6 border border-green-tint-strong rounded-lg hover:shadow-md transition-shadow">
                <h2 className="font-semibold text-xl mb-2">{prop.title}</h2>
                <p className="text-ink-soft text-sm mb-3">{prop.location}</p>
                <p className="text-gray-700 mb-4">{prop.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green text-lg">${prop.price.toLocaleString()}</span>
                  <span className="text-sm text-ink-soft">{prop.bedrooms} bd • {prop.bathrooms} ba</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}