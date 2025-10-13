# Database Enhancements with Supabase

Leverage Supabase PostgreSQL extensions for advanced database features.

## Overview

**What you'll learn:**

- Full-text search with highlighting
- AI embeddings with pgvector
- Database webhooks
- Scheduled functions (cron)

---

## Full-Text Search

### Setup

```sql
-- Add tsvector column to posts
ALTER TABLE posts
ADD COLUMN fts tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content)
) STORED;

-- Create GIN index for fast searching
CREATE INDEX posts_fts_idx ON posts USING gin(fts);
```

### Search Function

```sql
CREATE FUNCTION search_posts(
  search_query text,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  excerpt text,
  headline text,
  rank real
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.excerpt,
    ts_headline(
      'english',
      p.content,
      plainto_tsquery('english', search_query),
      'MaxFragments=1,MaxWords=20,MinWords=10'
    ) as headline,
    ts_rank(p.fts, plainto_tsquery('english', search_query)) as rank
  FROM posts p
  WHERE p.fts @@ plainto_tsquery('english', search_query)
  AND p.published = true
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$;
```

### Usage

```typescript
// Server Action
export async function searchPosts(query: string) {
  const { data } = await supabase.rpc("search_posts", {
    search_query: query,
    limit_count: 20,
  });

  return data;
}
```

---

## AI Embeddings (pgvector)

### Enable Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Add Embedding Column

```typescript
// Drizzle schema
import { customType } from "drizzle-orm/pg-core";

const vector = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(1536)";
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
});

export const documents = pgTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
});
```

```sql
-- Create index
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
```

### Generate Embeddings

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function addDocument(content: string) {
  // Generate embedding
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const embedding = response.data[0].embedding;

  // Store in database
  await db.insert(documents).values({
    content,
    embedding,
  });
}
```

### Semantic Search

```sql
CREATE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

```typescript
export async function semanticSearch(query: string) {
  // Generate query embedding
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryEmbedding = response.data[0].embedding;

  // Search
  const { data } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
  });

  return data;
}
```

---

## Database Webhooks

Trigger HTTP requests on database events:

```sql
-- Webhook when post is published
CREATE TRIGGER on_post_published
  AFTER UPDATE ON posts
  FOR EACH ROW
  WHEN (NEW.published = true AND OLD.published = false)
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://xxx.functions.supabase.co/on-post-published',
    'POST',
    '{"Content-Type":"application/json"}',
    json_build_object(
      'post_id', NEW.id,
      'title', NEW.title,
      'author_id', NEW.author_id
    )::text,
    '5000'
  );
```

Handle in Edge Function (see [edge-functions.md](./edge-functions.md)).

---

## Scheduled Functions

Run tasks on schedule (cron):

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at midnight
SELECT cron.schedule(
  'cleanup-old-sessions',
  '0 0 * * *', -- Daily at midnight
  $$
  DELETE FROM sessions
  WHERE expires_at < NOW() - INTERVAL '7 days'
  $$
);

-- Schedule weekly report
SELECT cron.schedule(
  'weekly-report',
  '0 9 * * 1', -- Monday 9 AM
  $$
  SELECT supabase_functions.http_request(
    'https://xxx.functions.supabase.co/weekly-report',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '10000'
  )
  $$
);
```

---

## Resources

- [Supabase Extensions](https://supabase.com/docs/guides/database/extensions)
- [pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Back to Integration Guide](../../SUPABASE_INTEGRATION.md)
