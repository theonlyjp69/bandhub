'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFileWithStorage, getFileDownloadUrl, deleteFile } from '@/actions/files'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Download, File, FileAudio, FileImage, FileText, FileVideo, FolderOpen, Trash2, Upload } from 'lucide-react'

type FileItem = {
  id: string
  name: string | null
  description: string | null
  file_size: number | null
  mime_type: string | null
  created_at: string | null
  uploaded_by: string | null
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

type Props = {
  bandId: string
  files: FileItem[]
  currentUserId: string
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.startsWith('audio/')) return FileAudio
  if (mimeType.startsWith('video/')) return FileVideo
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText
  return File
}

export function FilesList({ bandId, files, currentUserId }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('bandId', bandId)

      await uploadFileWithStorage(formData)
      router.refresh()
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileId: string) => {
    setDownloadingId(fileId)
    setError('')

    try {
      const url = await getFileDownloadUrl(fileId)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    setDeletingId(fileId)
    setError('')

    try {
      await deleteFile(fileId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-title flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                type="file"
                id="file"
                name="file"
                required
                className="file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Max 50MB. Allowed: Images, Audio, Video, PDF, Documents, Spreadsheets
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., Setlist for Friday show"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
            <Button type="submit" disabled={uploading} className="btn-gradient">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-title mb-2">No files yet</h3>
            <p className="text-muted-foreground text-center">
              Upload files to share with your band.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.mime_type)
            return (
              <Card key={file.id} className="stagger-item">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.name}</h3>
                      {file.description && (
                        <p className="text-muted-foreground text-sm mt-0.5 truncate">{file.description}</p>
                      )}
                      <p className="text-muted-foreground text-sm mt-1">
                        {formatFileSize(file.file_size)}
                        <span className="mx-2">·</span>
                        {file.profiles?.display_name || 'Unknown'}
                        {file.created_at && (
                          <>
                            <span className="mx-2">·</span>
                            {new Date(file.created_at).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(file.id)}
                        disabled={downloadingId === file.id}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {file.uploaded_by === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          disabled={deletingId === file.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
