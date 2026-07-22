'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Conversation {
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
  property_id?: string
  property_type?: string
}

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      fetchConversations(user.id)
    }

    checkUser()
  }, [router])

  const fetchConversations = async (userId: string) => {
    setLoading(true)
    
    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        read,
        property_id,
        properties:property_id(property_type)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
      setLoading(false)
      return
    }

    // Group by conversation (other user)
    const conversationMap = new Map<string, Conversation>()
    
    for (const msg of messages || []) {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
      
      if (!conversationMap.has(otherUserId)) {
        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, surname, avatar_url')
          .eq('user_id', otherUserId)
          .single()

        conversationMap.set(otherUserId, {
          other_user_id: otherUserId,
          other_user_name: profile ? `${profile.first_name} ${profile.surname}` : 'Unknown User',
          other_user_avatar: profile?.avatar_url,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: 0,
          property_id: msg.property_id,
          property_type: (msg.properties as any)?.property_type,
        })
      }

      const conv = conversationMap.get(otherUserId)!
      conv.last_message = msg.content
      conv.last_message_time = msg.created_at
      if (!msg.read && msg.receiver_id === userId) {
        conv.unread_count += 1
      }
    }

    setConversations(Array.from(conversationMap.values()))
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading messages...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 space-y-2">
          <h1 className="font-display font-bold text-3xl text-on-surface">Messages</h1>
          <p className="text-on-surface-variant">Your conversations with other users.</p>
        </div>

        {conversations.length === 0 ? (
          <p className="text-on-surface-variant">No messages yet. Contact a property owner to start a conversation!</p>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conv) => (
              <div
                key={conv.other_user_id}
                onClick={() => router.push(`/messages/${conv.other_user_id}${conv.property_id ? `?property=${conv.property_id}` : ''}`)}
                className="p-4 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30">
                    {conv.other_user_avatar ? (
                      <img src={conv.other_user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-on-surface">{conv.other_user_name}</h3>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-1 bg-primary text-white rounded-full text-xs font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.property_type && (
                      <p className="text-xs text-primary">{conv.property_type}</p>
                    )}
                    <p className="text-sm text-on-surface-variant line-clamp-1">{conv.last_message}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">
                      {new Date(conv.last_message_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}