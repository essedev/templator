# Cloudflare R2 File Storage Setup

Complete guide to adding file uploads with Cloudflare R2 (S3-compatible storage).

## Overview

**Cloudflare R2** is S3-compatible object storage with:

- **Zero egress fees** - No bandwidth charges for downloads
- **Global CDN** - Files served from Cloudflare's edge network
- **S3 API** - Works with AWS SDK and any S3-compatible client
- **Cost**: $0.015/GB/month storage + $0.36/million reads

**When to add R2:**

- User profile images/avatars
- Document uploads (PDFs, images)
- File attachments
- Any user-generated content

**Time estimate:** 30-60 minutes

---

## Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. Click **Create bucket**
3. **Name:** `your-app-uploads` (lowercase, no spaces)
4. **Location:** Automatic (or choose specific region)
5. Click **Create bucket**

---

## Step 2: Create API Token

1. In R2 dashboard → **Manage R2 API Tokens**
2. Click **Create API Token**
3. **Permissions:** Object Read & Write
4. **Specify bucket(s):** Select your bucket (or all buckets)
5. **TTL:** No expiration (or set as needed)
6. Click **Create API Token**

**Save these values** (shown only once):

```
Access Key ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Get Account ID

1. Go to Cloudflare Dashboard → **Overview** (any domain)
2. Scroll down to **API** section on the right
3. Copy your **Account ID**

Or from R2 dashboard URL: `https://dash.cloudflare.com/ACCOUNT_ID/r2`

---

## Step 4: Environment Variables

Add to `.env`:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="your-app-uploads"
```

Add to `wrangler.jsonc` vars (for production):

```jsonc
{
  "vars": {
    // ... existing vars
    "R2_ACCOUNT_ID": "your-account-id",
    "R2_BUCKET_NAME": "your-app-uploads",
  },
}
```

**Important:** Add secrets via Wrangler CLI (not in wrangler.jsonc):

```bash
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
```

---

## Step 5: Install AWS SDK

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Step 6: Create R2 Client

Create `src/lib/r2-client.ts`:

```typescript
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 Client (S3-compatible)
 *
 * R2 uses S3-compatible API, so we use AWS SDK.
 *
 * Environment variables required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 */

let r2Client: S3Client | null = null;

/**
 * Get or create R2 client instance (singleton)
 */
export function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 configuration missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY."
    );
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

/**
 * Generate presigned URL for upload (PUT)
 *
 * @param key - File path in bucket (e.g., "avatars/user-123.jpg")
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @param expiresIn - URL expiration in seconds (default: 15 minutes)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate presigned URL for download (GET)
 *
 * @param key - File path in bucket
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete object from R2
 *
 * @param key - File path in bucket
 */
export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * Get public URL for an object (if bucket has public access enabled)
 *
 * Note: Only works if you've configured a custom domain or public bucket.
 * For private buckets, use getSignedDownloadUrl() instead.
 */
export function getPublicUrl(key: string, customDomain?: string): string {
  const domain = customDomain || process.env.R2_PUBLIC_DOMAIN;
  if (!domain) {
    throw new Error(
      "R2_PUBLIC_DOMAIN not configured. Use getSignedDownloadUrl() for private files."
    );
  }
  return `https://${domain}/${key}`;
}
```

---

## Step 7: Server Actions for Upload

Create `src/features/uploads/actions.ts`:

```typescript
"use server";

import { getSignedUploadUrl, getSignedDownloadUrl, deleteR2Object } from "@/lib/r2-client";
import { getSession } from "@/lib/auth";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

/**
 * Get a presigned URL for uploading a file
 */
export async function getUploadUrl(filename: string, contentType: string, fileSize: number) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  // Validate content type
  if (!ALLOWED_TYPES.includes(contentType)) {
    return { error: "File type not allowed" };
  }

  // Generate unique key with user prefix for organization
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `uploads/${session.user.id}/${timestamp}-${sanitizedFilename}`;

  try {
    const uploadUrl = await getSignedUploadUrl(key, contentType);
    return { uploadUrl, key };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return { error: "Failed to generate upload URL" };
  }
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getDownloadUrl(key: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  // Optional: Verify user owns this file
  // if (!key.includes(session.user.id)) {
  //   return { error: "Access denied" };
  // }

  try {
    const downloadUrl = await getSignedDownloadUrl(key);
    return { downloadUrl };
  } catch (error) {
    console.error("Error generating download URL:", error);
    return { error: "Failed to generate download URL" };
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  // Optional: Verify user owns this file
  // if (!key.includes(session.user.id)) {
  //   return { error: "Access denied" };
  // }

  try {
    await deleteR2Object(key);
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { error: "Failed to delete file" };
  }
}
```

---

## Step 8: Upload Component

Create `src/features/uploads/FileUpload.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import { getUploadUrl } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

interface FileUploadProps {
  onUploadComplete?: (key: string, url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onUploadComplete,
  accept = "image/*",
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);

    try {
      // 1. Get presigned URL from server
      const result = await getUploadUrl(file.name, file.type, file.size);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      // 2. Upload directly to R2
      const response = await fetch(result.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("File uploaded successfully");
      onUploadComplete?.(result.key, result.uploadUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function clearPreview() {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="max-w-xs rounded-lg shadow-md" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
          className="max-w-xs"
        />

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Max file size: {maxSizeMB}MB</p>
    </div>
  );
}
```

---

## Step 9: Usage Example

### In a Profile Page

```typescript
// src/app/dashboard/profile/page.tsx
import { FileUpload } from "@/features/uploads/FileUpload";

export default function ProfilePage() {
  return (
    <div>
      <h2>Profile Picture</h2>
      <FileUpload
        accept="image/*"
        maxSizeMB={5}
        onUploadComplete={(key, url) => {
          console.log("Uploaded:", key);
          // Save key to database, update user profile, etc.
        }}
      />
    </div>
  );
}
```

### Storing File References

To track uploaded files, add a table to your schema:

```typescript
// src/db/schema.ts
export const attachment = pgTable("attachment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  key: text("key").notNull(), // R2 object key
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(), // bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Step 10: Public Bucket (Optional)

For publicly accessible files (like profile avatars):

1. Go to R2 bucket → **Settings**
2. Enable **Public access**
3. Connect a **custom domain** (recommended) or use R2.dev subdomain

Then use `getPublicUrl()` instead of presigned URLs:

```typescript
// For public files
const publicUrl = getPublicUrl(key, "cdn.yourdomain.com");

// For private files
const signedUrl = await getSignedDownloadUrl(key);
```

---

## CORS Configuration

If uploading directly from browser, configure CORS:

1. Go to R2 bucket → **Settings** → **CORS Policy**
2. Add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Troubleshooting

### "Failed to generate upload URL"

**Check:**

1. R2 credentials are correct
2. Bucket name matches
3. Account ID is correct

**Debug:**

```typescript
console.log({
  accountId: process.env.R2_ACCOUNT_ID,
  bucket: process.env.R2_BUCKET_NAME,
  hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
});
```

### Upload fails with 403

**Cause:** API token doesn't have write permissions

**Fix:** Create new token with "Object Read & Write" permissions

### CORS errors in browser

**Cause:** Missing CORS configuration

**Fix:** Add CORS policy as shown above

### Files not accessible after upload

**Cause:** Bucket is private

**Fix:** Either:

- Enable public access on bucket
- Use presigned download URLs

---

## Cost Estimation

| Usage      | Storage | Reads | Cost/month |
| ---------- | ------- | ----- | ---------- |
| Small app  | 1 GB    | 100k  | ~$0.05     |
| Medium app | 10 GB   | 1M    | ~$0.50     |
| Large app  | 100 GB  | 10M   | ~$5.00     |
| Enterprise | 1 TB    | 100M  | ~$50.00    |

**Free tier:** 10 GB storage, 10M reads/month

---

## Security Best Practices

1. **Always validate file types** server-side (not just client)
2. **Set file size limits** to prevent abuse
3. **Use presigned URLs** with short expiration for private files
4. **Organize by user ID** to simplify access control
5. **Never expose R2 credentials** to client-side code
6. **Consider virus scanning** for user uploads (external service)

---

## Related Documentation

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK S3 Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [`LIMITATIONS.md`](./LIMITATIONS.md) - Feature gaps and workarounds
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Production deployment
