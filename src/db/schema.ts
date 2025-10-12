import { pgTable, text, bigint, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

// ============================================
// AUTHENTICATION TABLES (Better Auth)
// ============================================
// Generated with: npx @better-auth/cli generate
// Naming convention: snake_case for all columns (PostgreSQL best practice)

/**
 * User role enum for RBAC system
 *
 * Roles hierarchy:
 * - user: Basic authenticated user (default)
 * - editor: Content manager (can manage blog, newsletter, contacts)
 * - admin: Full system access (can manage users and system settings)
 *
 * See docs/RBAC.md for complete permission mapping
 */
export const userRoleEnum = pgEnum("user_role", ["user", "editor", "admin"]);

/**
 * User table (managed by Better Auth)
 *
 * Core authentication table with user credentials and profile information.
 * Better Auth automatically manages authentication flows (sign up, sign in, password reset).
 *
 * Custom fields:
 * - role: RBAC role (user/editor/admin) - managed via Better Auth additionalFields
 *
 * Relations:
 * - sessions: Active user sessions
 * - accounts: OAuth provider accounts (if using social login)
 * - posts: Blog posts authored by user
 *
 * Security notes:
 * - Passwords hashed with PBKDF2 (100k iterations) via custom implementation
 * - role field has input: false (can't be set on sign up, must be changed by admin)
 *
 * @see docs/AUTHENTICATION.md for auth system details
 * @see docs/RBAC.md for role management
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: userRoleEnum("role").default("user").notNull(),
});

/**
 * Session table (managed by Better Auth)
 *
 * Tracks active user sessions with JWT tokens.
 * Better Auth automatically handles session expiration and renewal.
 *
 * Security features:
 * - HttpOnly cookies (XSS protection)
 * - 5-minute cookie cache for performance
 * - IP address and user agent tracking for security auditing
 *
 * Session lifecycle:
 * 1. Created on successful sign in
 * 2. Token stored in HttpOnly cookie
 * 3. Automatically cleaned up on expiration
 * 4. Cascade deleted when user is deleted
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

/**
 * Account table (managed by Better Auth)
 *
 * Stores OAuth provider accounts linked to users.
 * Supports multiple providers per user (e.g., GitHub + Google).
 *
 * Provider support:
 * - Email/password (stored in account.password field)
 * - OAuth providers (GitHub, Google, etc.) - tokens stored here
 *
 * Token management:
 * - access_token: OAuth access token
 * - refresh_token: OAuth refresh token (for token renewal)
 * - Token expiration tracked for automatic renewal
 *
 * Security:
 * - Cascade delete when user is removed
 * - Tokens encrypted at rest (database-level encryption recommended)
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Verification table (managed by Better Auth)
 *
 * Stores verification tokens for:
 * 1. Email verification (on sign up)
 * 2. Password reset requests
 *
 * Token lifecycle:
 * - Created when verification email is sent
 * - Single-use (deleted after successful verification)
 * - Expires after configured time (default: 1 hour for password reset)
 *
 * Security:
 * - Cryptographically random tokens
 * - Time-limited expiration
 * - Automatic cleanup of expired tokens
 *
 * @see src/lib/emails/auth-emails.ts for email sending
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Rate Limit table (managed by Better Auth)
 *
 * Database-backed rate limiting for edge compatibility.
 * Prevents brute force attacks and API abuse.
 *
 * Configuration (src/lib/auth.ts):
 * - window: 60 seconds
 * - max: 100 requests per window
 * - storage: "database" (works in Cloudflare Workers)
 *
 * Why database storage:
 * - Edge-compatible (no in-memory state needed)
 * - Distributed rate limiting across multiple workers
 * - Persistent across deployments
 *
 * Performance:
 * - Indexed on 'key' for fast lookups
 * - Automatic cleanup of old entries
 */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});

// ============================================
// BUSINESS TABLES
// ============================================
// Following same snake_case convention for consistency

/**
 * Contact Message table
 *
 * Stores messages submitted via the public contact form.
 * Typically displayed in admin dashboard for review.
 *
 * Feature: src/features/contact/
 * - Form: ContactForm component with React Hook Form + Zod validation
 * - Action: sendContactMessage() Server Action
 * - Admin view: /dashboard/contacts (editor/admin only)
 *
 * Workflow:
 * 1. User fills contact form on public site
 * 2. Message saved to database
 * 3. Optional: Email notification sent to admin
 * 4. Admin reviews messages in dashboard
 *
 * Future enhancements:
 * - Add 'status' field (new/read/replied)
 * - Add 'replied_at' timestamp
 * - Link replies to email thread
 *
 * @see src/features/contact/README.md
 */
export const contactMessage = pgTable("contact_message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Newsletter subscription status enum
 *
 * Status flow:
 * pending → active (on email confirmation)
 * active → unsubscribed (on unsubscribe action)
 */
export const newsletterStatusEnum = pgEnum("newsletter_status", [
  "pending",
  "active",
  "unsubscribed",
]);

/**
 * Newsletter Subscriber table
 *
 * Manages email newsletter subscriptions with double opt-in flow.
 *
 * Feature: src/features/newsletter/
 * - Form: NewsletterForm component (typically in footer/sidebar)
 * - Actions: subscribeNewsletter(), confirmSubscription(), unsubscribe()
 * - Admin view: /dashboard/newsletter (editor/admin only)
 *
 * Subscription workflow:
 * 1. User enters email in newsletter form
 * 2. Record created with status="pending"
 * 3. Verification email sent with confirmation link
 * 4. User clicks link → status="active", confirmedAt set
 * 5. Active subscriber receives newsletter emails
 * 6. User can unsubscribe → status="unsubscribed", unsubscribedAt set
 *
 * Status transitions:
 * - pending → active (email confirmed)
 * - active → unsubscribed (user unsubscribes)
 * - pending → deleted (cleanup of unconfirmed after N days)
 *
 * Best practices:
 * - Always respect unsubscribe requests (CAN-SPAM compliance)
 * - Clean up pending subscriptions older than 30 days
 * - Don't delete unsubscribed records (keep for compliance)
 *
 * @see src/features/newsletter/README.md
 */
export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  status: newsletterStatusEnum("status").notNull().default("pending"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

/**
 * Newsletter Verification table
 *
 * Separate from Better Auth verification table.
 * Stores tokens for newsletter double opt-in confirmation.
 *
 * Workflow:
 * 1. User subscribes → verification token created
 * 2. Confirmation email sent with link containing token
 * 3. User clicks link → token validated
 * 4. Subscriber status updated to "active"
 * 5. Token deleted (single-use)
 *
 * Security:
 * - Cryptographically random tokens
 * - Time-limited expiration (recommended: 24 hours)
 * - Single-use (deleted after successful confirmation)
 * - Indexed on token for fast lookups
 *
 * Cleanup:
 * - Expired tokens should be cleaned up periodically
 */
export const newsletterVerification = pgTable("newsletter_verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Blog Post table
 *
 * Content management system for blog posts with draft/publish workflow.
 *
 * Feature: src/features/blog/
 * - Form: PostForm component for create/edit
 * - Actions: createPost(), updatePost(), deletePost(), publishPost()
 * - Public routes: /blog (list), /blog/[slug] (single post)
 * - Admin routes: /dashboard/blog/* (editor/admin only)
 *
 * Publishing workflow:
 * 1. Editor creates post (published=false, publishedAt=null)
 * 2. Post saved as draft (visible only in dashboard)
 * 3. Editor reviews and clicks "Publish"
 * 4. published=true, publishedAt=now()
 * 5. Post appears on public /blog page
 * 6. Can be unpublished (set published=false, preserves publishedAt)
 *
 * URL structure:
 * - Slug must be unique and URL-safe (lowercase, hyphens only)
 * - Example: "my-first-post" → /blog/my-first-post
 * - Auto-generated from title or manually set
 *
 * Access control:
 * - Public: Can read published posts only
 * - Editor/Admin: Can CRUD all posts
 * - Author ownership tracked via authorId
 *
 * Features:
 * - Cover images (URL or upload path)
 * - Excerpt for preview cards
 * - Full content (supports HTML/Markdown)
 * - Timestamps for created/updated tracking
 *
 * SEO considerations:
 * - Unique slugs for clean URLs
 * - Excerpt for meta descriptions
 * - publishedAt for sorting and display
 *
 * @see src/features/blog/README.md
 */
export const post = pgTable("post", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
