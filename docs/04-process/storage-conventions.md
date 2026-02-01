# Storage Conventions

**Created:** 2026-02-01
**Status:** Active

## Overview

BandHub uses Supabase Storage for file uploads. This document defines the storage path conventions and access patterns.

---

## Storage Bucket

| Bucket | Access | Purpose |
|--------|--------|---------|
| `band-files` | Private | All band file uploads |

---

## Path Structure

```
band-files/
  └── {band_id}/
      └── {filename}
```

### Example

```
band-files/
  └── 550e8400-e29b-41d4-a716-446655440000/
      ├── setlist-2026-02-01.pdf
      ├── band-logo.png
      └── demo-track.mp3
```

---

## Path Components

| Component | Format | Description |
|-----------|--------|-------------|
| `band_id` | UUID | Band identifier from `bands.id` |
| `filename` | string | Original filename (sanitized) |

---

## Access Control

Files are protected by RLS policies:

| Operation | Policy |
|-----------|--------|
| SELECT | Band members can view their band's files |
| INSERT | Band members can upload to their band |
| DELETE | File uploader or band admin can delete |

---

## File Metadata

File metadata is stored in the `files` table:

| Column | Description |
|--------|-------------|
| `id` | File record UUID |
| `band_id` | Associated band |
| `uploaded_by` | User who uploaded |
| `file_name` | Display name |
| `file_path` | Storage path (`{band_id}/{filename}`) |
| `file_type` | MIME type |
| `file_size` | Size in bytes |

---

## Signed URLs

Files are accessed via signed URLs with 1-hour expiry:

```typescript
const { data } = await supabase.storage
  .from('band-files')
  .createSignedUrl(file.file_path, 3600)
```

---

## Filename Sanitization

When uploading, filenames should be sanitized to:
- Remove special characters
- Replace spaces with hyphens
- Ensure uniqueness (append timestamp if needed)

---

*Referenced by: REV-001 in security-audit-stage1.md*
