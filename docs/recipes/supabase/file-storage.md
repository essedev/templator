# File Storage with Supabase

Complete guide to implementing file uploads, storage, and CDN delivery using Supabase Storage with Templator.

## Prerequisites

- Supabase project created and connected
- Basic migration completed (see [SUPABASE_INTEGRATION.md](../../SUPABASE_INTEGRATION.md#path-1-minimal-real-time-only-))

## Overview

**What you'll build:**

- User avatar uploads
- Document/file uploads
- Private and public file access
- Image transformations (resize, crop)
- Presigned URLs for secure downloads

**Time estimate:** 1-2 hours

**Storage features:**

- S3-compatible API
- Automatic CDN distribution
- Row Level Security for files
- Image transformations built-in

---

## Step 1: Create Storage Buckets

### Public Bucket (Avatars, Public Images)

1. **Go to Supabase Dashboard** → Storage → New bucket
2. **Name:** `avatars`
3. **Public:** ✅ Checked
4. **File size limit:** 5MB
5. **Allowed MIME types:** `image/*`

### Private Bucket (Documents)

1. **New bucket**
2. **Name:** `documents`
3. **Public:** ❌ Unchecked
4. **File size limit:** 50MB
5. **Allowed MIME types:** `application/pdf,application/msword,text/*`

---

## Step 2: Storage Policies (RLS)

Set access policies for your buckets:

```sql
-- AVATARS BUCKET (Public)

-- Anyone can view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

```sql
-- DOCUMENTS BUCKET (Private)

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note:** Folder structure: `{userId}/filename.ext` ensures user-specific access.

---

## Step 3: Avatar Upload (Server Action)

```typescript
// src/features/profile/actions.ts
"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("avatar") as File;
  if (!file) throw new Error("No file provided");

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  // Validate file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size must be less than 5MB");
  }

  // Create Supabase client with service role for server-side operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only secret
    { auth: { persistSession: false } }
  );

  // Upload to Supabase Storage
  const filePath = `${session.user.id}/avatar.jpg`;
  const { data, error } = await supabaseAdmin.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true, // Replace if exists
  });

  if (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload avatar");
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("avatars").getPublicUrl(data.path);

  // Update user record
  await db.update(user).set({ image: publicUrl }).where(eq(user.id, session.user.id));

  revalidatePath("/dashboard/profile");

  return { success: true, url: publicUrl };
}

export async function deleteAvatar() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Delete from storage
  const filePath = `${session.user.id}/avatar.jpg`;
  await supabaseAdmin.storage.from("avatars").remove([filePath]);

  // Update user record
  await db.update(user).set({ image: null }).where(eq(user.id, session.user.id));

  revalidatePath("/dashboard/profile");

  return { success: true };
}
```

---

## Step 4: Avatar Upload Component

```typescript
// src/features/profile/AvatarUpload.tsx
"use client";

import { useState, FormEvent } from 'react';
import { uploadAvatar, deleteAvatar } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Upload } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
}

export function AvatarUpload({ currentAvatarUrl }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await uploadAvatar(formData);

      setPreview(result.url);
      toast.success('Avatar updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete your avatar?')) return;

    setUploading(true);
    try {
      await deleteAvatar();
      setPreview(null);
      toast.success('Avatar deleted');
    } catch (err) {
      toast.error('Failed to delete avatar');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="flex items-center space-x-4">
          <img
            src={preview}
            alt="Avatar preview"
            className="w-24 h-24 rounded-full object-cover"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={uploading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <Input
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          required
        />

        <Button type="submit" disabled={uploading}>
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Avatar'}
        </Button>
      </form>
    </div>
  );
}
```

---

## Step 5: Document Upload

Add document table to track uploads:

```typescript
// src/db/schema.ts
export const documents = pgTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

```typescript
// src/features/documents/actions.ts
"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function uploadDocument(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("document") as File;
  if (!file) throw new Error("No file provided");

  // Validate file size (50MB max)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size must be less than 50MB");
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${session.user.id}/${timestamp}-${sanitizedName}`;

  // Upload to storage
  const { data, error } = await supabaseAdmin.storage.from("documents").upload(filePath, file);

  if (error) throw new Error("Failed to upload document");

  // Save metadata to database
  await db.insert(documents).values({
    userId: session.user.id,
    filename: file.name,
    path: data.path,
    size: file.size,
    mimeType: file.type,
  });

  return { success: true, filename: file.name };
}

export async function getUserDocuments() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await db
    .select()
    .from(documents)
    .where(eq(documents.userId, session.user.id))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentDownloadUrl(documentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));

  if (!doc || doc.userId !== session.user.id) {
    throw new Error("Document not found or unauthorized");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Generate presigned URL (valid for 1 hour)
  const { data, error } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(doc.path, 3600);

  if (error) throw new Error("Failed to generate download URL");

  return data.signedUrl;
}

export async function deleteDocument(documentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));

  if (!doc || doc.userId !== session.user.id) {
    throw new Error("Document not found or unauthorized");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Delete from storage
  await supabaseAdmin.storage.from("documents").remove([doc.path]);

  // Delete from database
  await db.delete(documents).where(eq(documents.id, documentId));

  return { success: true };
}
```

---

## Step 6: Image Transformations

Get avatar with automatic resizing:

```typescript
// Get transformed image URL
export function getAvatarUrl(userId: string, size: number = 200) {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar.jpg`, {
      transform: {
        width: size,
        height: size,
        resize: 'cover' // or 'contain', 'fill'
      }
    });

  return data.publicUrl;
}

// Usage in component
<img
  src={getAvatarUrl(user.id, 200)}
  alt={user.name}
  className="w-12 h-12 rounded-full"
/>
```

**Available transformations:**

- `width`: Target width in pixels
- `height`: Target height in pixels
- `resize`: `cover` | `contain` | `fill`
- `quality`: 20-100 (default: 80)
- `format`: `origin` | `webp`

---

## Step 7: Bulk Upload

Upload multiple files at once:

```typescript
export async function uploadMultipleDocuments(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const files = formData.getAll("documents") as File[];
  if (files.length === 0) throw new Error("No files provided");

  const results = [];
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  for (const file of files) {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${session.user.id}/${timestamp}-${sanitizedName}`;

      const { data, error } = await supabaseAdmin.storage.from("documents").upload(filePath, file);

      if (error) throw error;

      await db.insert(documents).values({
        userId: session.user.id,
        filename: file.name,
        path: data.path,
        size: file.size,
        mimeType: file.type,
      });

      results.push({ success: true, filename: file.name });
    } catch (err) {
      results.push({
        success: false,
        filename: file.name,
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  return results;
}
```

```typescript
// Component
"use client";

export function BulkUpload() {
  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const results = await uploadMultipleDocuments(formData);

    const successful = results.filter(r => r.success).length;
    toast.success(`${successful}/${results.length} files uploaded`);
  }

  return (
    <form onSubmit={handleUpload}>
      <Input
        type="file"
        name="documents"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv"
      />
      <Button type="submit">Upload Files</Button>
    </form>
  );
}
```

---

## Step 8: Progress Tracking

Track upload progress:

```typescript
"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function UploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(0);

    const filePath = `${userId}/${file.name}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

    setUploading(false);

    if (error) {
      toast.error('Upload failed');
    } else {
      toast.success('Upload complete');
    }
  }

  return (
    <div>
      <Input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center mt-2">{progress}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## Environment Variables

Add to `.env`:

```bash
# Supabase (already added in basic setup)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."

# Service role key (server-only, for admin operations)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..." # From Supabase Dashboard → Settings → API
```

**Important:** Never expose service role key to client!

---

## Troubleshooting

### "Unable to upload file" error

**Check:**

1. Bucket exists in Supabase Dashboard
2. RLS policies are correct
3. File size within limits
4. MIME type allowed

**Debug:**

```typescript
const { data, error } = await supabase.storage.from("avatars").upload(path, file);

if (error) {
  console.error("Upload error:", error);
  // Check error.message for details
}
```

### Images not loading

**Check:**

1. Bucket is set to "Public"
2. URL is correct (check publicUrl in response)
3. No CORS issues (Supabase handles this automatically)

### RLS preventing access

**Test policies:**

```sql
-- Test as specific user
SELECT auth.uid(); -- Check current user
SELECT * FROM storage.objects WHERE bucket_id = 'avatars';
```

---

## Next Steps

- Add [real-time chat](./realtime-chat.md) with file attachments
- Implement image gallery with thumbnails
- Add file sharing between users
- Implement file versioning

---

## Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Back to Supabase Integration Guide](../../SUPABASE_INTEGRATION.md)
