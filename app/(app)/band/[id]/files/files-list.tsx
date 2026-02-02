'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFileWithStorage, getFileDownloadUrl, deleteFile } from '@/actions/files'

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
    <div>
      <div className="mb-6 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h2 className="text-lg font-medium text-white mb-4">Upload File</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm text-zinc-400 mb-1">
              File *
            </label>
            <input
              type="file"
              id="file"
              name="file"
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-zinc-300 file:cursor-pointer"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Max 50MB. Allowed: Images, Audio, Video, PDF, Documents, Spreadsheets
            </p>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-400 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g., Setlist for Friday show"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm text-zinc-400 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Optional description..."
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500">No files uploaded yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{file.name}</h3>
                  {file.description && (
                    <p className="text-zinc-400 text-sm mt-1 truncate">{file.description}</p>
                  )}
                  <p className="text-zinc-500 text-sm mt-1">
                    {formatFileSize(file.file_size)}
                    <span className="mx-2">&middot;</span>
                    {file.profiles?.display_name || 'Unknown'}
                    {file.created_at && (
                      <>
                        <span className="mx-2">&middot;</span>
                        {new Date(file.created_at).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(file.id)}
                    disabled={downloadingId === file.id}
                    className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded"
                  >
                    {downloadingId === file.id ? '...' : 'Download'}
                  </button>
                  {file.uploaded_by === currentUserId && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                    >
                      {deletingId === file.id ? '...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
