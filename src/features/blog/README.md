# Blog Feature

Sistema completo di gestione blog con CRUD operations, draft/publish, e admin area.

## Componenti

- `PostForm.tsx` - Form per creare/modificare post (client component)

## Server Actions

- `createPost(input)` - Crea nuovo post (richiede auth)
- `updatePost(postId, input)` - Aggiorna post esistente (richiede ownership)
- `deletePost(postId)` - Elimina post (richiede ownership)
- `getPostsForAdmin()` - Ottieni tutti i post dell'utente (richiede auth)

## Database Schema

```typescript
export const posts = pgTable("post", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  authorId: text("authorId").references(() => users.id),
  published: boolean("published").default(false),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
```

## Validazione

Schema Zod in `schema.ts`:

```typescript
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(10),
  coverImage: z.string().url().optional(),
  published: z.boolean().default(false),
});
```

## Routes

### Public Routes

- `/blog` - Lista post pubblicati
- `/blog/[slug]` - Dettaglio singolo post

### Admin Routes (protette)

- `/admin/blog` - Dashboard: lista tutti i post (draft + published)
- `/admin/blog/new` - Crea nuovo post
- `/admin/blog/[id]/edit` - Modifica post esistente

## Features

### 1. Draft/Publish

- Post possono essere salvati come draft (`published: false`)
- Publish imposta `published: true` e `publishedAt: now()`
- Solo post published sono visibili in `/blog`

### 2. Ownership

- Ogni post ha un `authorId` (foreign key su users)
- Solo l'autore può modificare/eliminare i propri post
- Verifiche automatiche nelle Server Actions

### 3. SEO-friendly slugs

- Slug validation: lowercase, hyphens only
- Unique constraint sul database
- URL format: `/blog/my-post-slug`

### 4. Cover Images

- Campo opzionale per URL immagine
- Mostrato nella pagina dettaglio post
- Supporta URL esterni o upload (da implementare)

## Utilizzo

### Creare un post (da admin)

1. Login come utente autenticato
2. Vai a `/admin/blog`
3. Click "Create New Post"
4. Compila form e salva come draft o pubblica

### Leggere post (pubblico)

```tsx
// Server Component - fetch posts
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function BlogPage() {
  const publishedPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt));

  return <div>{/* Render posts */}</div>;
}
```

## Estendere

### 1. Aggiungere Markdown support

Installa parser:

```bash
pnpm add remark remark-html
```

In `PostForm.tsx`, sostituisci textarea con Markdown editor.
In `blog/[slug]/page.tsx`, parsa content:

```tsx
import { remark } from "remark";
import html from "remark-html";

const processedContent = await remark().use(html).process(post.content);
```

### 2. Aggiungere categorie/tags

Crea tabelle:

```typescript
export const categories = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const postCategories = pgTable("post_category", {
  postId: text("postId").references(() => posts.id),
  categoryId: text("categoryId").references(() => categories.id),
});
```

### 3. Aggiungere Rich Text Editor

Opzioni:

- **Tiptap** (recommended): Headless editor, molto flessibile
- **Lexical**: Facebook's editor, moderno
- **Draft.js**: Stabile ma meno moderno

Installa Tiptap:

```bash
pnpm add @tiptap/react @tiptap/starter-kit
```

### 4. Upload immagini

Opzioni:

- **Cloudflare Images**: Integrazione perfetta con Workers
- **Uploadthing**: Semplice, free tier generoso
- **S3 + CloudFront**: Soluzione enterprise

## Security

- ✅ Autenticazione richiesta per tutte le admin operations
- ✅ Ownership check su update/delete
- ✅ Input validation con Zod
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection (React escaping automatico)

**Note**: Content supporta HTML raw (`dangerouslySetInnerHTML`).
Se permetti HTML user-generated, sanitizza con library come `DOMPurify`.

## Performance

- Server Components per SEO e performance
- Revalidation cache ogni 60 secondi (`revalidate: 60`)
- `revalidatePath()` dopo create/update/delete per fresh data
- Database indexes su `slug` (unique) e `published`

## TODO (optional enhancements)

- [ ] Aggiungere search/filter su admin dashboard
- [ ] Pagination per blog list (quando > 20 posts)
- [ ] Rich text editor invece di textarea
- [ ] Image upload invece di URL field
- [ ] Categories/tags system
- [ ] Post preview prima di publish
- [ ] SEO metadata (Open Graph, Twitter Cards)
- [ ] Reading time estimation
- [ ] Related posts suggestions
