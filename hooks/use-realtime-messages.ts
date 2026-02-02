'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

export function useRealtimeMessages(bandId: string, threadId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*, profiles!user_id(display_name, avatar_url)')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true })

      if (threadId) {
        query = query.eq('thread_id', threadId)
      } else {
        query = query.is('thread_id', null)
      }

      const { data } = await query
      if (data) setMessages(data as Message[])
    }

    fetchMessages()

    // Subscribe to new messages
    const channelName = `messages:${bandId}:${threadId || 'main'}`

    // Build filter for the subscription
    // Note: Supabase realtime filter syntax uses comma for AND
    const filter = threadId
      ? `band_id=eq.${bandId},thread_id=eq.${threadId}`
      : `band_id=eq.${bandId}`

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
          // For main chat, filter out thread messages client-side
          // since realtime doesn't support is.null filter
          if (!threadId && payload.new.thread_id !== null) {
            return
          }

          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles!user_id(display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as Message])
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
  }, [bandId, threadId])

  return messages
}
