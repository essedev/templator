import Link from "next/link";
import { getSession } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import { LayoutDashboard, FileText, Mail, MessageSquare, Users, UserCircle } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    // Nessun permission = disponibile a tutti
  },
  {
    label: "Blog Posts",
    href: "/dashboard/blog",
    icon: FileText,
    permission: "manage_blog",
  },
  {
    label: "Newsletter",
    href: "/dashboard/newsletter",
    icon: Mail,
    permission: "manage_newsletter",
  },
  {
    label: "Contacts",
    href: "/dashboard/contacts",
    icon: MessageSquare,
    permission: "view_contacts",
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
    permission: "manage_users",
  },
];

/**
 * Navigation sidebar per la dashboard.
 * Mostra solo i link che l'utente ha permesso di vedere.
 */
export async function DashboardNav() {
  const session = await getSession();
  const userRole = session?.user?.role;

  // Filtra i nav items in base ai permessi
  const allowedNavItems = navItems.filter((item) => {
    if (!item.permission) return true; // Item senza permessi è visibile a tutti
    return hasPermission(userRole, item.permission);
  });

  return (
    <nav className="space-y-1">
      {allowedNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
