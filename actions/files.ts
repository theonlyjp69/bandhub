'use server'

import { createClient } from '@/lib/supabase/server'

interface UploadFileInput {
  bandId: string
  name: string
  description?: string
  filePath: string
  fileSize: number
  mimeType: string
}

export async function uploadFile(input: UploadFileInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!input.bandId || !input.name || !input.filePath) {
    throw new Error('Missing required fields')
  }

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', input.bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  // Create database record
  const { data, error } = await supabase
    .from('files')
    .insert({
      band_id: input.bandId,
      name: input.name,
      description: input.description,
      file_path: input.filePath,
      file_size: input.fileSize,
      mime_type: input.mimeType,
      uploaded_by: user.id
    })
    .select(`
      *,
      profiles!uploaded_by(display_name)
    `)
    .single()

  if (error) throw error
  return data
}

export async function getBandFiles(bandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!bandId) throw new Error('Band ID required')

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('files')
    .select(`
      *,
      profiles!uploaded_by(display_name, avatar_url)
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getFileDownloadUrl(fileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!fileId) throw new Error('File ID required')

  // Get file record
  const { data: file, error } = await supabase
    .from('files')
    .select('file_path, band_id')
    .eq('id', fileId)
    .single()

  if (error) throw error
  if (!file || !file.band_id) throw new Error('File not found')

  // Verify user is a member of the band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', file.band_id)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  // Generate signed URL (valid for 1 hour)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('band-files')
    .createSignedUrl(file.file_path, 3600)

  if (urlError) throw urlError
  return urlData.signedUrl
}

export async function deleteFile(fileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!fileId) throw new Error('File ID required')

  // Get file record and verify ownership
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('file_path, uploaded_by, band_id')
    .eq('id', fileId)
    .single()

  if (fetchError) throw fetchError
  if (!file || !file.band_id) throw new Error('File not found')

  // Check if user is uploader or admin
  const isUploader = file.uploaded_by === user.id
  const { data: adminMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', file.band_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!isUploader && !adminMember) throw new Error('Access denied')

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('band-files')
    .remove([file.file_path])

  if (storageError) throw storageError

  // Delete database record
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)

  if (error) throw error
}

export async function updateFileMetadata(fileId: string, updates: { name?: string; description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!fileId) throw new Error('File ID required')

  // Get file record and verify ownership
  const { data: file } = await supabase
    .from('files')
    .select('uploaded_by')
    .eq('id', fileId)
    .single()

  if (!file) throw new Error('File not found')
  if (file.uploaded_by !== user.id) throw new Error('Access denied')

  const { data, error } = await supabase
    .from('files')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description })
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper: Upload file to storage and create record
export async function uploadFileWithStorage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File | null
  const bandId = formData.get('bandId') as string | null
  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null

  if (!file || !bandId || !name) {
    throw new Error('Missing required fields')
  }

  // Verify user is a member of this band
  const { data: member } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Access denied')

  // Generate unique file path: band_id/timestamp_filename
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${bandId}/${timestamp}_${safeName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('band-files')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Create database record
  const { data, error } = await supabase
    .from('files')
    .insert({
      band_id: bandId,
      name: name,
      description: description,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id
    })
    .select(`
      *,
      profiles!uploaded_by(display_name)
    `)
    .single()

  if (error) {
    // Clean up storage if database insert fails
    await supabase.storage.from('band-files').remove([filePath])
    throw error
  }

  return data
}
