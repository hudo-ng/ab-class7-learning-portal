import type { LucideIcon } from "lucide-react";

/** Consistent title row for admin pages; actions wrap under the title on phones. */
export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
