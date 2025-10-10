interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * PageHeader component for consistent page titles across the application.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   description="Welcome to your dashboard"
 * />
 * ```
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="border-b pb-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-lg">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
