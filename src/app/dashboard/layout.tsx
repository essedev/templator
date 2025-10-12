import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Separator } from "@/components/ui/separator";

/**
 * Dashboard layout - protegge tutte le route /dashboard/*
 * Richiede autenticazione e mostra navigation basata sui permessi.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <DashboardNav />
        </aside>

        <Separator className="md:hidden" />

        {/* Main content */}
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
