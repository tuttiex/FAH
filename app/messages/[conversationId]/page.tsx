'use client'

import { useState, useEffect, useRef, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/AuthContext'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

function ConversationContent({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId: otherUserId } = use(params)
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property')
  const { user, loading: authLoading } = useAuth()
  const [otherUserName, setOtherUserName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const [propertyDetails, setPropertyDetails] = useState<{ property_type: string; property_details: string; price: number; address: string; image_urls?: string[]; is_active?: boolean } | null>(null)
  const [resolvedPropertyId, setResolvedPropertyId] = useState<string | null>(null)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }

    let cancelled = false

    const init = async () => {
      // Fetch other user's name via RPC (bypasses RLS)
      const { data: profileData } = await supabase
        .rpc('get_user_profile', { target_user_id: otherUserId })
      const profile = profileData?.[0] ?? null

      if (!cancelled && profile) {
        setOtherUserName(profile.username || `${profile.first_name} ${profile.surname}`.trim())
      }

      // Determine property ID: from URL or fallback to most recent message's property_id
      let resolvedPropId = propertyId
      if (!resolvedPropId) {
        const { data: recentMsg, error: recentMsgError } = await supabase
          .from('messages')
          .select('property_id')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .not('property_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (recentMsgError) {
          console.error('Error fetching recent message property_id:', recentMsgError)
        }
        if (recentMsg?.property_id) {
          resolvedPropId = recentMsg.property_id
        }
      }

      if (!cancelled) {
        setResolvedPropertyId(resolvedPropId)
      }

      // Fetch property details if we have a property ID
      if (resolvedPropId) {
        const { data: propData, error: propError } = await supabase
          .rpc('get_property', { target_property_id: resolvedPropId })
        if (propError) {
          console.error('Error fetching property details:', propError)
        }
        const prop = propData?.[0] ?? null
        if (!cancelled && prop) {
          setPropertyDetails(prop)
        }
      }

      // Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!cancelled && msgs) {
        setMessages(msgs)
      }

      // Mark unread as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false)

      if (!cancelled) setLoading(false)
    }

    init()

    return () => { cancelled = true }
  }, [authLoading, user, otherUserId, router])

  // Realtime listener
  useEffect(() => {
    if (!user) return

    const addMessage = (payload: any) => {
      setMessages((prev) => {
        // Avoid duplicates if the message already exists (e.g., optimistic add)
        if (prev.some((m) => m.id === (payload.new as Message).id)) {
          return prev
        }
        return [...prev, payload.new as Message]
      })
    }

    const channel = supabase
      .channel(`room-${user.id}-${otherUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${otherUserId},receiver_id=eq.${user.id}`, // incoming
      }, addMessage)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id},receiver_id=eq.${otherUserId}`, // outgoing from other device
      }, addMessage)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, otherUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = inputText.trim()
    if (!user || !text) return

    console.log('Sending message:', { sender_id: user.id, receiver_id: otherUserId, content: text })

    setSending(true)

    const insertPayload: Record<string, any> = {
      sender_id: user.id,
      receiver_id: otherUserId,
      content: text,
    }
    if (resolvedPropertyId) {
      insertPayload.property_id = resolvedPropertyId
    }
    const { data, error } = await supabase.from('messages').insert(insertPayload).select()

    setSending(false)

    if (error) {
      console.error('Send error:', error)
      alert('Send failed: ' + error.message)
      return
    }

    console.log('Send success:', data)

    // Add sent message to local state immediately using the real returned row
    // (the insert uses .select(), so data[0] has the real id, created_at, etc.)
    // Dedup-guard the same way addMessage does, in case the realtime "outgoing"
    // event arrived over the websocket before this REST response resolved.
    if (data && data[0]) {
      const newMsg = data[0] as Message
      setMessages((prev) =>
        prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
      )
    }
    setInputText('')
  }

  if (loading || authLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading conversation...</p>
      </main>
    )
  }

  return (
    <main className="fixed inset-x-0 bottom-0 top-20 flex flex-col px-4 pt-16">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-4 p-4 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30 space-y-2">
          {propertyDetails && (
            <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
              {propertyDetails.image_urls?.[0] && (
                <img
                  src={propertyDetails.image_urls[0]}
                  alt={propertyDetails.property_type}
                  className="w-14 h-14 rounded-lg object-cover border border-outline-variant/20 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {propertyDetails.property_type} - {propertyDetails.property_details}
                </p>
                <p className="text-xs text-on-surface-variant truncate">{propertyDetails.address}</p>
                <p className="text-xs font-bold text-primary">₦{propertyDetails.price.toLocaleString()}</p>
              </div>
            </div>
          )}
          {propertyDetails && propertyDetails.is_active === false && (
            <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-semibold">
              This listing is no longer available
            </div>
          )}
          <h2 className="font-semibold text-on-surface">{otherUserName || 'User'}</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
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
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-white/60' : 'text-on-surface-variant/60'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            className={`px-6 py-3 bg-primary text-white rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] ${
              sending || !inputText.trim() ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading conversation...</p>
      </main>
    }>
      <ConversationContent params={params} />
    </Suspense>
  )
}