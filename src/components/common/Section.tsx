import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
  variant?: "default" | "muted" | "accent";
}

/**
 * Section component for consistent page sections with optional backgrounds.
 *
 * @example
 * ```tsx
 * <Section variant="muted" container>
 *   <h2>Section Title</h2>
 *   <p>Section content...</p>
 * </Section>
 * ```
 */
export function Section({
  children,
  className,
  container = true,
  variant = "default",
}: SectionProps) {
  const variants = {
    default: "",
    muted: "bg-muted/50",
    accent: "bg-accent/10",
  };

  return (
    <section className={cn("py-12 md:py-16 lg:py-24", variants[variant], className)}>
      {container ? (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
