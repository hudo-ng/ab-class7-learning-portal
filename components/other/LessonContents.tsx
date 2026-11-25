import { ChevronDown, Hash, TriangleAlert } from "lucide-react";
import type { TopicAccent } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

export interface ContentsItem {
  anchor: string;
  title: string;
  type: string;
  number?: number;
}

function Items({
  items,
  accent,
}: {
  items: ContentsItem[];
  accent: TopicAccent;
}) {
  return (
    <ol className="space-y-1">
      {items.map((item) => (
        <li key={item.anchor}>
          <a
            href={`#${item.anchor}`}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                item.type === "rules"
                  ? "bg-amber-100 text-amber-700"
                  : item.type === "mistakes"
                    ? "bg-rose-100 text-rose-700"
                    : accent.icon,
              )}
              aria-hidden="true"
            >
              {item.type === "rules" ? (
                <Hash className="size-3" />
              ) : item.type === "mistakes" ? (
                <TriangleAlert className="size-3" />
              ) : (
                item.number
              )}
            </span>
            <span className="leading-snug">{item.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Folded list at the top of the lesson on phones and tablets. */
export function MobileContents({
  items,
  accent,
  label,
}: {
  items: ContentsItem[];
  accent: TopicAccent;
  label: string;
}) {
  return (
    <details className="group rounded-xl border bg-white lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown
          className="size-4 text-slate-500 transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <nav aria-label={label} className="border-t px-2 py-2">
        <Items items={items} accent={accent} />
      </nav>
    </details>
  );
}

/** Sidebar that stays in view on large screens. */
export function SidebarContents({
  items,
  accent,
  label,
}: {
  items: ContentsItem[];
  accent: TopicAccent;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto lg:block"
    >
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <Items items={items} accent={accent} />
    </nav>
  );
}
