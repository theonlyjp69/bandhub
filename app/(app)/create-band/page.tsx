'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBand } from '@/actions/bands'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Music } from 'lucide-react'

export default function CreateBandPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const band = await createBand(name, description || undefined)
      router.push(`/band/${band.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create band')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Music className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Create New Band</CardTitle>
          <CardDescription>
            Set up your band and start collaborating with your members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Band Name *</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Enter band name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Describe your band (optional)"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Band'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
