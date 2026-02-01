# File Storage Feature Specification

## Overview

File storage allows band members to share recordings, stems, setlists, and other documents within their band. Files are stored in Supabase Storage with database metadata tracking.

## User Stories

### US-FILE-1: Upload File
**As a** band member
**I want to** upload files to my band
**So that** I can share recordings and documents

**Acceptance Criteria:**
- File picker and upload button
- Display name and description fields
- Progress indicator during upload
- File appears in list after upload

### US-FILE-2: View Files
**As a** band member
**I want to** see all files in my band
**So that** I can find what I need

**Acceptance Criteria:**
- List of files with name, size, uploader, date
- File type icons
- Search/filter (future)

### US-FILE-3: Download File
**As a** band member
**I want to** download shared files
**So that** I can use them locally

**Acceptance Criteria:**
- Download button on each file
- Opens in new tab or downloads
- Works with signed URLs

### US-FILE-4: Delete File
**As a** file uploader
**I want to** delete my uploaded files
**So that** I can remove outdated content

**Acceptance Criteria:**
- Delete button visible only to uploader
- Confirmation before delete
- Removes from storage and database

## Data Model

### files table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| band_id | UUID | References bands |
| name | TEXT | Display name (required) |
| description | TEXT | File description |
| file_path | TEXT | Supabase Storage path |
| file_size | BIGINT | Size in bytes |
| mime_type | TEXT | File MIME type |
| uploaded_by | UUID | References profiles |
| created_at | TIMESTAMPTZ | Upload timestamp |

## Storage Structure

```
band-files/                    # Bucket name
├── {band_id}/                # Folder per band
│   ├── {timestamp}_{filename}
│   ├── {timestamp}_{filename}
│   └── ...
```

## File Path Format

```
{band_id}/{timestamp}_{safe_filename}

Example:
550e8400-e29b-41d4-a716-446655440000/1704067200000_setlist_jan_2024.pdf
```

## Security

### Database RLS Policies
- Band members can view files
- Band members can upload files
- Uploaders can delete their own files

### Storage RLS Policies
```sql
-- Upload: band members only
CREATE POLICY "Band members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'band-files' AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  );

-- Download: band members only
CREATE POLICY "Band members can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'band-files' AND
    EXISTS (
      SELECT 1 FROM band_members
      WHERE band_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  );

-- Delete: uploader only
CREATE POLICY "Uploaders can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'band-files' AND
    auth.uid() = owner
  );
```

## Signed URLs

Files are accessed via signed URLs with 1-hour expiration:

```typescript
const { data } = await supabase.storage
  .from('band-files')
  .createSignedUrl(file.file_path, 3600)
```

## Limits

| Limit | Value |
|-------|-------|
| Max file size | 50 MB |
| Allowed types | All (for MVP) |
| Storage per band | Supabase free tier limits |

## UI Components

### Files Page (`/band/[id]/files`)
- Upload form (file input, name, description)
- Upload progress indicator
- File list with:
  - File type icon
  - Display name
  - Size (formatted)
  - Uploader name
  - Upload date
  - Download button
  - Delete button (uploader only)

---

*Implementation: [plans/STAGE-4-EVENTS.md](../../../plans/STAGE-4-EVENTS.md)*
