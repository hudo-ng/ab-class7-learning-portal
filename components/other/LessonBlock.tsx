import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Hash, TriangleAlert } from "lucide-react";
import type { topicContent } from "@/db/schema";
import type { TopicAccent } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

// Wide tables scroll sideways inside their own box on small screens
const markdownComponents: Components = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  ),
};

// Shared typography for lesson text; min-w-0 lets tables scroll instead of widening the page
const PROSE =
  "prose prose-slate max-w-none min-w-0 prose-p:leading-relaxed prose-li:my-1 prose-table:text-sm prose-th:bg-slate-50 prose-th:px-3 prose-td:px-3";

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}

type Block = Pick<
  typeof topicContent.$inferSelect,
  "type" | "title" | "body" | "imgUrl" | "gallery"
>;

/**
 * Diagrams at their natural size, shrunk only to fit the column, so labels
 * stay readable. Several sit side by side from sm up.
 */
function Diagrams({ paths, title }: { paths: string[]; title: string }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        paths.length > 1 && "sm:grid-cols-2 sm:items-start",
      )}
    >
      {paths.map((src, i) => (
        <figure
          key={src}
          className="flex justify-center overflow-hidden rounded-xl border bg-white p-2 sm:p-3"
        >
          <img
            src={src}
            alt={
              paths.length > 1 ? `${title} (${i + 1}/${paths.length})` : title
            }
            loading="lazy"
            className="h-auto w-auto max-w-full"
          />
        </figure>
      ))}
    </div>
  );
}

/** Grid of sign images with their (translated) names underneath. */
function SignGallery({
  signs,
  signNames,
}: {
  signs: string[];
  signNames: Record<string, string>;
}) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {signs.map((sign) => {
        const name = signNames[sign] ?? sign.replace(/-/g, " ");
        return (
          <li key={sign}>
            <figure className="flex h-full flex-col items-center gap-2 rounded-lg border bg-white p-2 sm:p-3">
              <img
                src={`/signs/${sign}.png`}
                alt={name}
                loading="lazy"
                className="h-16 w-full object-contain sm:h-20"
              />
              <figcaption className="text-center text-xs leading-snug text-slate-700">
                {name}
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  block: Block;
  /** Anchor id for the contents list */
  anchor: string;
  /** Section number shown for ordinary sections */
  number?: number;
  accent: TopicAccent;
  /** Translated sign names, keyed by image file name */
  signNames: Record<string, string>;
}

export function LessonBlock({
  block,
  anchor,
  number,
  accent,
  signNames,
}: Props) {
  // Gallery entries starting with "/" are diagram paths; the rest are sign names
  const gallery = block.gallery ?? [];
  const diagrams = [
    ...(block.imgUrl ? [block.imgUrl] : []),
    ...gallery.filter((g) => g.startsWith("/")),
  ];
  const signs = gallery.filter((g) => !g.startsWith("/"));

  switch (block.type) {
    case "intro":
      return (
        <section
          id={anchor}
          className={cn(
            "scroll-mt-6 rounded-xl border p-5 sm:p-6",
            accent.soft,
          )}
        >
          <div className={PROSE}>
            <Markdown>{block.body}</Markdown>
          </div>
        </section>
      );

    case "concept":
    case "visual":
      return (
        <section id={anchor} className="scroll-mt-6 space-y-4">
          <h2 className="flex items-start gap-3 text-xl sm:text-2xl font-semibold leading-snug text-slate-900">
            {number !== undefined && (
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  accent.icon,
                )}
                aria-hidden="true"
              >
                {number}
              </span>
            )}
            <span>{block.title}</span>
          </h2>
          <div className={PROSE}>
            <Markdown>{block.body}</Markdown>
          </div>
          {diagrams.length > 0 && (
            <Diagrams paths={diagrams} title={block.title} />
          )}
          {signs.length > 0 && (
            <SignGallery signs={signs} signNames={signNames} />
          )}
        </section>
      );

    case "rules":
      return (
        <section
          id={anchor}
          className="scroll-mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
        >
          <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-amber-900">
            <Hash className="size-5" aria-hidden="true" />
            {block.title}
          </h2>
          <div className={cn(PROSE, "prose-th:bg-amber-100/60")}>
            <Markdown>{block.body}</Markdown>
          </div>
        </section>
      );

    case "mistakes":
      return (
        <section
          id={anchor}
          className="scroll-mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 sm:p-6"
        >
          <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-rose-900">
            <TriangleAlert className="size-5" aria-hidden="true" />
            {block.title}
          </h2>
          <div className={PROSE}>
            <Markdown>{block.body}</Markdown>
          </div>
        </section>
      );

    default:
      return null;
  }
}
