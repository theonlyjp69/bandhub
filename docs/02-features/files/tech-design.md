# File Storage - Technical Design

## Overview

Band file sharing using Supabase Storage with signed URLs for secure downloads. Supports recordings, setlists, contracts, and other documents.

## Database Schema

### files table
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('band-files', 'band-files', false);
```

## Server Actions

### actions/files.ts

| Function | Purpose | Authorization |
|----------|---------|---------------|
| `uploadFile(input)` | Create file record (metadata only) | Band member |
| `uploadFileWithStorage(formData)` | Full upload via FormData | Band member |
| `getBandFiles(bandId)` | List all band files | Band member |
| `getFileDownloadUrl(fileId)` | Generate signed URL (1hr) | Band member |
| `deleteFile(fileId)` | Delete from storage + DB | Uploader or admin |
| `updateFileMetadata(fileId, updates)` | Update name/description | Uploader only |

## Data Flow

### Full Upload (uploadFileWithStorage)
```
Client → uploadFileWithStorage(formData)
  → Verify authentication
  → Extract file, bandId, name from FormData
  → Verify band membership
  → Generate path: {bandId}/{timestamp}_{sanitized_filename}
  → Upload to Supabase Storage
  → Insert into files table
  → On DB error: rollback (delete from storage)
  → Return file record with id
```

### Download
```
Client → getFileDownloadUrl(fileId)
  → Verify authentication
  → Get file record
  → Verify band membership
  → Generate signed URL (3600 seconds)
  → Return signed URL
```

### Delete
```
Client → deleteFile(fileId)
  → Verify authentication
  → Get file record
  → Check uploader or admin
  → Delete from storage
  → Delete from database
```

## Storage Path Convention

```
band-files/
  └── {band_uuid}/
      └── {timestamp}_{sanitized_filename}

Example:
band-files/abc123-def456/1706832000000_setlist_feb_show.pdf
```

### Filename Sanitization
```typescript
const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
const filePath = `${bandId}/${timestamp}_${safeName}`
```

## Security

### RLS Policies

**files table:**
- SELECT: Band members can view files
- INSERT: Band members can upload files
- UPDATE: Uploaders can update file metadata
- DELETE: Uploaders can delete own files

**storage.objects:**
- INSERT: Band members (band_id from path)
- SELECT: Band members (band_id from path)
- DELETE: File owner (auth.uid = owner)

### Signed URLs
- Default expiry: 3600 seconds (1 hour)
- Generated server-side only
- Contains time-limited access token
- Cannot be shared beyond expiry

## Limits

| Constraint | Value |
|------------|-------|
| Max file size | 50MB (Supabase free tier) |
| Storage quota | 1GB (free tier) |
| Signed URL expiry | 1 hour |

## Error Handling

### Upload Rollback
```typescript
// If database insert fails after storage upload
try {
  const { error } = await supabase.from('files').insert(...)
  if (error) {
    await supabase.storage.from('band-files').remove([filePath])
    throw error
  }
} catch (e) {
  // File not orphaned in storage
}
```

## Integration Points

- **File list UI:** Uses getBandFiles() with uploader profiles
- **Download button:** Opens signed URL in new tab
- **Upload form:** Uses uploadFileWithStorage with FormData
- **Delete confirmation:** Warns about permanent removal
