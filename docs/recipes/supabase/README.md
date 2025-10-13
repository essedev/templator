# Supabase Integration Recipes

Step-by-step implementation guides for integrating Supabase features with Templator.

## Prerequisites

Before following these recipes, complete the basic setup:

1. Read [SUPABASE_INTEGRATION.md](../../SUPABASE_INTEGRATION.md#getting-started) (1 hour)
2. Create Supabase project
3. Update database connection
4. Install Supabase client

---

## Available Recipes

### 1. [Real-time Chat](./realtime-chat.md) ⭐ **Most Popular**

**Build:** Complete chat system with live messages
**Time:** 2-3 hours
**Difficulty:** ⭐⭐⭐☆☆

**You'll implement:**

- Chat rooms with Drizzle
- Real-time message updates
- Row Level Security
- User presence
- Message history

**Start here if:** You need chat, live notifications, or any real-time feature

---

### 2. [File Storage](./file-storage.md)

**Build:** Avatar uploads, document management, file downloads
**Time:** 1-2 hours
**Difficulty:** ⭐⭐☆☆☆

**You'll implement:**

- Avatar upload with image transformations
- Document storage with validation
- Public and private buckets
- Presigned URLs for secure downloads
- Progress tracking

**Start here if:** You need user file uploads or content storage

---

### 3. [Presence Detection](./presence-detection.md)

**Build:** Online/offline status, typing indicators
**Time:** 1 hour
**Difficulty:** ⭐⭐☆☆☆

**You'll implement:**

- Real-time presence tracking
- Online users list
- "User is typing..." indicators
- Last seen timestamps

**Prerequisites:** Complete [Real-time Chat](./realtime-chat.md) first

---

### 4. [Database Enhancements](./database-enhancements.md)

**Build:** Full-text search, AI embeddings, webhooks
**Time:** Varies by feature
**Difficulty:** ⭐⭐⭐⭐☆

**You'll implement:**

- Full-text search with highlighting
- AI semantic search with pgvector
- Database webhooks
- Scheduled functions (cron)

**Start here if:** You need advanced database features

---

## Quick Start Guide

### For Real-time Features

```
1. Read: SUPABASE_INTEGRATION.md (30 min)
2. Setup: Getting Started steps (30 min)
3. Follow: Real-time Chat recipe (2-3 hours)
4. Optional: Add Presence Detection (1 hour)
```

### For File Storage

```
1. Read: SUPABASE_INTEGRATION.md (30 min)
2. Setup: Getting Started steps (30 min)
3. Follow: File Storage recipe (1-2 hours)
```

### For Database Features

```
1. Read: SUPABASE_INTEGRATION.md (30 min)
2. Setup: Getting Started steps (30 min)
3. Follow: Database Enhancements recipe (varies)
```

---

## Common Patterns

### Pattern: Real-time Updates

```typescript
// Subscribe to database changes
const channel = supabase
  .channel("table-name")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "table_name" }, (payload) => {
    // Handle new record
  })
  .subscribe();

// Cleanup
return () => channel.unsubscribe();
```

### Pattern: File Upload

```typescript
// Server Action
export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;

  const { data } = await supabase.storage
    .from("bucket-name")
    .upload(`${userId}/${file.name}`, file);

  return data.path;
}
```

### Pattern: Row Level Security

```sql
-- Users can only access their own data
CREATE POLICY "users_own_data"
ON table_name FOR ALL
USING (user_id = auth.uid());
```

---

## Troubleshooting

### Real-time not working?

1. Check RLS policies are correct
2. Verify WebSocket connection (Network tab)
3. Check channel subscription status

### File upload failing?

1. Verify bucket exists and is configured
2. Check file size limits
3. Validate RLS policies on storage.objects

### Database queries slow?

1. Add indexes to frequently queried columns
2. Use joins instead of multiple queries
3. Consider caching with Cloudflare KV

---

## Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Template Issues:** [GitHub](https://github.com/yourusername/templator/issues)
- **Main Guide:** [SUPABASE_INTEGRATION.md](../../SUPABASE_INTEGRATION.md)

---

## Contributing

Found an issue or have an improvement? Open a PR!

**Recipe structure:**

- Prerequisites
- Overview (what, time, difficulty)
- Step-by-step implementation
- Code examples
- Troubleshooting
- Next steps
