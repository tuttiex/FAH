'use client'

import { useState, useEffect, useRef, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function ConversationContent({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId: otherUserId } = use(params)
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property')
  const [user, setUser] = useState<User | null>(null)
  const [otherUserName, setOtherUserName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (cancelled) return

      setUser(user)

      // Fetch other user's name via RPC (bypasses RLS)
      const { data: profileData } = await supabase
        .rpc('get_user_profile', { target_user_id: otherUserId })
      const profile = profileData?.[0] ?? null

      if (!cancelled && profile) {
        setOtherUserName(profile.username || `${profile.first_name} ${profile.surname}`.trim())
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
  }, [otherUserId, router])

  // Realtime listener
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`room-${user.id}-${otherUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${otherUserId},receiver_id=eq.${user.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
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
    if (propertyId) {
      insertPayload.property_id = propertyId
    }
    const { data, error } = await supabase.from('messages').insert(insertPayload).select()

    setSending(false)

    if (error) {
      console.error('Send error:', error)
      alert('Send failed: ' + error.message)
      return
    }

    console.log('Send success:', data)

    // Add sent message to local state immediately
    const newMsg: Message = {
      id: `local-${Date.now()}`,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: text,
      created_at: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')
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
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4 p-4 bg-surface-bright rounded-2xl shadow-sm border border-outline-variant/30">
          <h2 className="font-semibold text-on-surface">{otherUserName || 'User'}</h2>
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