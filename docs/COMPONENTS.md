# Components Reference

Quick reference for implemented components in the template.

## UI Components (shadcn/ui)

Base components in `src/components/ui/`:

- **button** - Button with variants (default, destructive, outline, ghost, link)
- **input** - Text input with label support
- **textarea** - Multi-line text input
- **label** - Form label
- **select** - Dropdown select with Radix UI
- **checkbox** - Checkbox input
- **card** - Card container with header/content/footer
- **badge** - Status badge with variants
- **alert** - Alert messages
- **dialog** - Modal dialog
- **dropdown-menu** - Dropdown menu with items
- **separator** - Horizontal/vertical divider
- **form** - React Hook Form integration
- **sonner** - Toast notifications (via Sonner)

All components are from [shadcn/ui](https://ui.shadcn.com) and fully customizable.

## Layout Components

### Navbar

**Location:** `src/components/layout/Navbar.tsx`

Main navigation with:

- Logo/brand
- Navigation links
- Theme toggle
- Auth state (login/logout)
- Mobile responsive menu

### Footer

**Location:** `src/components/layout/Footer.tsx`

Site footer with:

- Links sections
- Copyright
- Newsletter signup (optional)

### ThemeToggle

**Location:** `src/components/layout/ThemeToggle.tsx`

Dark/light mode toggle using `next-themes`.

## Auth Components (RBAC)

### RoleGate (Server Component)

**Location:** `src/components/auth/RoleGate.tsx`

Conditionally render content based on user role in Server Components.

```typescript
import { RoleGate } from "@/components/auth";

<RoleGate allowedRoles={["admin"]}>
  <AdminContent />
</RoleGate>
```

### RoleGateClient (Client Component)

**Location:** `src/components/auth/RoleGateClient.tsx`

Client-side role-based rendering with session hook.

```typescript
import { RoleGateClient } from "@/components/auth";

<RoleGateClient allowedRoles={["editor", "admin"]}>
  <EditorTools />
</RoleGateClient>
```

## Dashboard Components

### DashboardNav

**Location:** `src/components/dashboard/DashboardNav.tsx`

Dynamic navigation that adapts to user role:

- All users: Overview, Profile
- Editor/Admin: Blog, Newsletter, Contacts
- Admin only: Users

## Common Components

### Section

**Location:** `src/components/common/Section.tsx`

Consistent page sections with optional container and variants.

```typescript
import { Section } from "@/components/common";

<Section variant="muted" container>
  <h2>Section Title</h2>
  <p>Content...</p>
</Section>
```

**Variants:** `default`, `muted`, `accent`

### PageHeader

**Location:** `src/components/common/PageHeader.tsx`

Page title component with optional description and actions.

```typescript
import { PageHeader } from "@/components/common";

<PageHeader
  title="Dashboard"
  description="Welcome back"
>
  <Button>Action</Button>
</PageHeader>
```

## Feature Components

Components organized by feature in `src/features/`:

- **ContactForm** (`features/contact/`) - Public contact form
- **NewsletterForm** (`features/newsletter/`) - Newsletter signup
- **PostForm** (`features/blog/`) - Create/edit blog posts
- **EditProfileForm** (`features/profile/`) - User profile editor
- **RoleSelector** (`app/dashboard/users/`) - Admin role assignment
- **DeletePostButton** (`app/dashboard/blog/`) - Post deletion

## Styling

All components use:

- **Tailwind CSS** for styling
- **CSS variables** for theming (defined in `globals.css`)
- **cn()** utility from `lib/utils.ts` for class merging
- **Dark mode** via `next-themes`

## Adding New Components

### From shadcn/ui

```bash
pnpm dlx shadcn@latest add [component-name]
```

### Custom Component

Follow existing patterns:

1. Use TypeScript interfaces for props
2. Export from component file directly
3. Use `cn()` for className merging
4. Add to appropriate category (layout/common/feature)

## See Also

- [shadcn/ui docs](https://ui.shadcn.com) - Component documentation
- [Radix UI](https://www.radix-ui.com) - Primitive components
- [Tailwind CSS](https://tailwindcss.com) - Utility classes
