# AI Workflow — Working with Templator

This template is optimized for AI-assisted development (Cursor, Claude Code, GitHub Copilot, etc.).

## Why This Template is AI-Friendly

1. **Strict naming conventions** → AI knows exactly where to find/create files
2. **Repeatable patterns** → Every feature follows the same structure
3. **Pervasive type-safety** → TypeScript + Zod + Drizzle guide AI to correct code
4. **Inline documentation** → JSDoc and comments that AI reads
5. **Validation loop** → ESLint/TypeScript catch errors automatically
6. **Drizzle TypeScript-first** → AI generates DB queries with perfect autocomplete

## Feature Structure (Always Follow This)

Every feature **must** follow this structure:

```
src/features/[feature-name]/
  ├── actions.ts       # Server Actions (named function exports)
  ├── schema.ts        # Zod schemas (const exports)
  ├── [Feature]*.tsx   # React components
  └── README.md        # Feature documentation (follow blog/README.md template)
```

**Reference Implementation:** See `src/features/blog/` and `src/features/contact/` for complete examples.

## Validation Loop (Required After Every Change)

After implementing **any** feature, always run:

```bash
pnpm format      # Auto-format code
pnpm lint        # Check for linting errors
pnpm typecheck   # Verify TypeScript types
```

If errors occur, read them and fix before proceeding. TypeScript errors are especially important - they catch bugs before runtime.

## Claude Commands for Version Management

### `/changelog` - Update CHANGELOG.md

Reviews recent work and updates `CHANGELOG.md` with changes in the `[Unreleased]` section.

**How it works:**

1. Checks recent changes with `git status` and `git diff`
2. Categorizes changes: Added, Changed, Fixed, Removed, Security
3. Updates `CHANGELOG.md` in `[Unreleased]` section
4. Follows existing changelog style

**When to use:** After completing a feature or fix, before creating a release.

**Example:**

```bash
# After implementing a feature
/changelog
```

### `/release` - Create New Version

Prepares and releases a new version by converting `[Unreleased]` to a versioned release with git tag.

**How it works:**

1. Asks for version number (e.g., `0.1.2`, `1.0.0`)
2. Verifies `[Unreleased]` section has changes
3. Updates `CHANGELOG.md`:
   - Renames `[Unreleased]` to `[x.y.z] - YYYY-MM-DD`
   - Creates new empty `[Unreleased]` section
4. Shows changes and asks for confirmation
5. Creates commit and git tag:
   ```bash
   git add CHANGELOG.md
   git commit -m "chore: release vx.y.z"
   git tag -a vx.y.z -m "Release x.y.z"
   ```
6. Asks if you want to push (optional)

**When to use:** When ready to release a new version after updating changelog.

**Complete workflow:**

```bash
# 1. After completing features
/changelog

# 2. When ready for release
/release
# → Specify version: 0.2.0
# → Confirm changes
# → Choose whether to push

# 3. (Optional) Manual push
git push && git push --tags
```

**Best practice - Semantic Versioning:**

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward-compatible)
- **PATCH** (0.0.1): Bug fixes

## Key Conventions

### File Naming

- **React components:** `PascalCase.tsx` (e.g., `ContactForm.tsx`)
- **Utilities/lib:** `kebab-case.ts` (e.g., `format-date.ts`)
- **Route folders:** `kebab-case` (e.g., `app/blog-post/[slug]/page.tsx`)
- **Feature folders:** `kebab-case` (e.g., `features/user-profile/`)

### Import Paths

**Always use absolute imports** with `@/` alias:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/features/newsletter/actions";

// ❌ Wrong
import { Button } from "../../components/ui/button";
```

### Standard Feature Files

Every feature has the same structure:

```typescript
// actions.ts - Server Actions
"use server";
import { db } from "@/db";
import { myTable } from "@/db/schema";
import { mySchema } from "./schema";

export async function myAction(input: unknown) {
  const data = mySchema.parse(input);
  await db.insert(myTable).values(data);
}
```

```typescript
// schema.ts - Zod validation
import { z } from "zod";

export const mySchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required"),
});

export type MyFormData = z.infer<typeof mySchema>;
```

## Common Patterns

### 1. Adding a Protected Route

Tell AI: "Create a protected page at `app/admin/settings/page.tsx` requiring admin role using `requireAuth()`"

**What AI will generate:**

```typescript
import { requireAuth } from "@/lib/rbac";

export default async function SettingsPage() {
  const session = await requireAuth(["admin"]);

  return <div>Settings content...</div>;
}
```

### 2. Adding a New Database Table

Tell AI: "Add a `comments` table to `src/db/schema.ts` with fields: userId (FK), postId (FK), content (text), createdAt. Then run `pnpm db:generate && pnpm db:push`"

### 3. Creating a Form with Server Action

Tell AI: "Create a newsletter subscription feature in `src/features/newsletter/` following the structure in `features/contact/`. Include schema.ts, actions.ts, and NewsletterForm.tsx"

## Documentation Structure

When AI needs context, it should read:

1. **Feature-specific:** `src/features/[name]/README.md`
2. **Project structure:** `docs/ARCHITECTURE.md`
3. **Auth system:** `docs/AUTHENTICATION.md` (basic) or `docs/AUTHENTICATION_ADVANCED.md` (advanced)
4. **RBAC system:** `docs/RBAC.md`
5. **Database schema:** `src/db/schema.ts` (complete JSDoc)
6. **Middleware:** `docs/MIDDLEWARE.md`
7. **Email system:** `docs/EMAIL_SYSTEM.md`
8. **Deployment:** `docs/DEPLOYMENT.md`
9. **Stack decisions:** `docs/STACK.md`
10. **Step-by-step guides:** `docs/recipes/`

## Architectural Preferences

### 1. Server Actions (Preferred)

For CRUD operations, use Server Actions in `features/[name]/actions.ts`:

```typescript
"use server";
export async function myAction(input: unknown) {
  const data = mySchema.parse(input);
  await db.insert(table).values(data);
}
```

**When NOT to use Server Actions:**

- Public API endpoints (for mobile apps, webhooks)
- Non-JSON responses (file downloads, streaming)
- Complex rate limiting/middleware

### 2. Data Fetching Priority

1. **Server Components** (fetch directly in async component) - preferred
2. **Server Actions** (for form submissions)
3. **TanStack Query** (only if caching/polling needed)

### 3. State Management Priority

1. **Server Components** (no client state needed) - preferred
2. **useState** (local component state)
3. **Context** (shared parent-children state)
4. **Zustand** (only for global persistent state)

## Effective Prompts

### ✅ Good Prompts (Specific)

- "Add a 'comments' feature following `features/contact` structure. Each comment has: userId (FK), postId (FK), content (text), status (pending/approved/rejected), createdAt. Use Drizzle ORM."
- "Create `/blog/[slug]` page that fetches post from database with Drizzle. Show 404 if post doesn't exist. Use Server Component."
- "Add dark mode toggle in Navbar using next-themes and ThemeToggle component in `components/layout/`"

### ❌ Vague Prompts (Avoid)

- "Add a comment system" ← too vague, AI must guess structure
- "Create a blog page" ← missing routing, data source, requirements
- "Implement auth" ← auth already exists, be specific about what you need

## Troubleshooting

### AI creates files in wrong location

**Solution:** Always specify full path in prompt.

```
❌ "Create ContactForm"
✅ "Create src/features/contact/ContactForm.tsx"
```

### AI uses relative imports

**Solution:** Remind AI to use `@/` alias.

```
❌ import { Button } from "../../components/ui/button"
✅ import { Button } from "@/components/ui/button"
```

### AI doesn't run validation loop

**Solution:** Always include in prompt: "After implementing, run `pnpm format && pnpm lint && pnpm typecheck`"

### TypeScript errors after generation

**Solution:** Ask AI: "Read the TypeScript errors and fix them. Then rerun `pnpm typecheck`"

## Best Practices for Prompts

1. **Reference existing features** → "following the structure in `features/contact`"
2. **Specify full paths** → `src/features/[name]/[file].tsx`
3. **Request validation loop** → "run format, lint, typecheck"
4. **Use template terminology** → "Server Action", "Zod schema", "feature folder"
5. **Ask for one step at a time** → not "implement auth + dashboard + blog"

## Working with Better Auth

When working with authentication:

- **Get session:** `const session = await getSession()`
- **Require auth:** `const session = await requireAuth(["admin"])`
- **Client hook:** `const { data: session } = useSession()`
- **Sign out:** `await signOut()`

See `docs/AUTHENTICATION.md` for complete auth documentation.

## Resources for AI

When AI works on this template, it has access to:

1. **Complete docs** in `docs/` folder
2. **Inline JSDoc** in `src/db/schema.ts` with workflow descriptions
3. **Feature examples** in `src/features/blog/` and `src/features/contact/`
4. **Recipes** in `docs/recipes/` for step-by-step guides

The AI should read these files to understand patterns and replicate them accurately.
