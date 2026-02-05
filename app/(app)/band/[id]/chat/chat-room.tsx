'use client'

import { useState, useRef, useEffect } from 'react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { sendMessage } from '@/actions/messages'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send } from 'lucide-react'

type Props = {
  bandId: string
  threadId?: string
  eventId?: string
}

export function ChatRoom({ bandId, threadId, eventId }: Props) {
  const { messages, addMessage } = useRealtimeMessages(bandId, threadId, eventId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    setError('')

    try {
      const message = await sendMessage(bandId, input.trim(), threadId, eventId)
      addMessage(message) // Optimistic update - show immediately
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <Card className="flex flex-col flex-1 overflow-hidden">
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {message.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">
                    {message.profiles?.display_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.created_at && new Date(message.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={5000}
            className="flex-1 focus-ring-enhanced"
          />
          <Button type="submit" disabled={!input.trim() || sending} className="btn-gradient">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
}
