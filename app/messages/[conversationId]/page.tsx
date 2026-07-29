'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

interface OtherUser {
  username: string
  first_name: string
  surname: string
  avatar_url?: string
}

interface Property {
  property_type: string
  property_details: string
}

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [propertyInfo, setPropertyInfo] = useState<Property | null>(null)
  const [sendError, setSendError] = useState('')
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherUserId = params.conversationId

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, first_name, surname, avatar_url')
        .eq('user_id', otherUserId)
        .maybeSingle()

      if (profile) {
        setOtherUser(profile)
      }

      // Get property ID from query params if exists
      const urlParams = new URLSearchParams(window.location.search)
      const propId = urlParams.get('property')
      if (propId) {
        setPropertyId(propId)
        // Fetch property info
        const { data: prop } = await supabase
          .from('properties')
          .select('property_type, property_details')
          .eq('id', propId)
          .maybeSingle()
        if (prop) {
          setPropertyInfo(prop)
        }
      }

      // Fetch messages
      await fetchMessages(user.id, otherUserId)

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false)

      setLoading(false)
    }

    checkUser()
  }, [otherUserId, router])

  // Setup realtime subscription after user is loaded
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`messages:${user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${otherUserId},receiver_id=eq.${user.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, otherUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async (myId: string, otherId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .or(`sender_id.eq.${otherId},receiver_id.eq.${otherId}`)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !message.trim()) return

    setSending(true)
    setSendError('')

    // Optimistically add the message to local state
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: message.trim(),
      created_at: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setMessage('')

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content: optimisticMessage.content,
      property_id: propertyId,
    })

    setSending(false)
    if (error) {
      console.error('Send message error:', error)
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setSendError(`Failed to send message: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading conversation...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-16">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-128px)]">
        {/* Header */}
        <div className="mb-4 p-4 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30">
            {otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-on-surface">{otherUser?.username || `${otherUser?.first_name} ${otherUser?.surname}`}</h2>
            {propertyInfo && (
              <p className="text-xs text-primary mt-1">
                Re: {propertyInfo.property_type} - {propertyInfo.property_details}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  msg.sender_id === user?.id
                    ? 'bg-primary-container text-white rounded-br-sm'
                    : 'bg-surface-container text-on-surface rounded-bl-sm'
                } ${msg.id.startsWith('temp-') ? 'opacity-70' : ''}`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender_id === user?.id ? 'text-white/60' : 'text-on-surface-variant/60'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.id.startsWith('temp-') && ' • Sending...'}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Error */}
        {sendError && (
          <p className="text-sm text-red-500 text-center mb-2">{sendError}</p>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              if (sendError) setSendError('')
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
            className={`px-6 py-3 bg-primary text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
              sending || !message.trim() ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  )
}