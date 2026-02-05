'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

export function useRealtimeMessages(bandId: string, threadId?: string, eventId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = useMemo(() => createClient(), [])

  // Helper to add message only if not already present
  const addIfNew = (prev: Message[], message: Message): Message[] =>
    prev.some((m) => m.id === message.id) ? prev : [...prev, message]

  // Optimistic add - for immediate UI feedback when user sends a message
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => addIfNew(prev, message))
  }, [])

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*, profiles!user_id(display_name, avatar_url)')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true })

      // Three-way scoping: event chat, thread chat, or main chat
      if (eventId) {
        query = query.eq('event_id', eventId)
      } else if (threadId) {
        query = query.eq('thread_id', threadId)
      } else {
        query = query.is('thread_id', null).is('event_id', null)
      }

      const { data } = await query
      if (data) setMessages(data as Message[])
    }

    fetchMessages()

    // Subscribe to new messages
    const channelName = eventId
      ? `messages:${bandId}:event:${eventId}`
      : `messages:${bandId}:${threadId || 'main'}`

    // Build filter for the subscription
    const filter = `band_id=eq.${bandId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter
        },
        async (payload) => {
          // Client-side filtering for correct scoping
          const newMsg = payload.new as Record<string, unknown>
          if (eventId) {
            if (newMsg.event_id !== eventId) return
          } else if (threadId) {
            if (newMsg.thread_id !== threadId) return
          } else {
            if (newMsg.thread_id !== null || newMsg.event_id !== null) return
          }

          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles!user_id(display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => addIfNew(prev, data as Message))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandId, threadId, eventId])

  return { messages, addMessage }
}
