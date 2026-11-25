import {
  BookOpen,
  Bike,
  Car,
  Gauge,
  IdCard,
  ShieldCheck,
  Signpost,
  Split,
  TrafficCone,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

/*
 * Colour accents for topic cards. Class names are written out in full because
 * Tailwind only generates classes it can find as complete strings in the code.
 */
const ACCENTS = {
  indigo: {
    bar: "border-t-indigo-500",
    soft: "bg-indigo-50 border-indigo-200",
    icon: "bg-indigo-100 text-indigo-700",
    text: "text-indigo-700",
    hover: "hover:border-indigo-300",
  },
  red: {
    bar: "border-t-red-500",
    soft: "bg-red-50 border-red-200",
    icon: "bg-red-100 text-red-700",
    text: "text-red-700",
    hover: "hover:border-red-300",
  },
  amber: {
    bar: "border-t-amber-500",
    soft: "bg-amber-50 border-amber-200",
    icon: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    hover: "hover:border-amber-300",
  },
  sky: {
    bar: "border-t-sky-500",
    soft: "bg-sky-50 border-sky-200",
    icon: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    hover: "hover:border-sky-300",
  },
  emerald: {
    bar: "border-t-emerald-500",
    soft: "bg-emerald-50 border-emerald-200",
    icon: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    hover: "hover:border-emerald-300",
  },
  teal: {
    bar: "border-t-teal-500",
    soft: "bg-teal-50 border-teal-200",
    icon: "bg-teal-100 text-teal-700",
    text: "text-teal-700",
    hover: "hover:border-teal-300",
  },
  blue: {
    bar: "border-t-blue-500",
    soft: "bg-blue-50 border-blue-200",
    icon: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
    hover: "hover:border-blue-300",
  },
  violet: {
    bar: "border-t-violet-500",
    soft: "bg-violet-50 border-violet-200",
    icon: "bg-violet-100 text-violet-700",
    text: "text-violet-700",
    hover: "hover:border-violet-300",
  },
  orange: {
    bar: "border-t-orange-500",
    soft: "bg-orange-50 border-orange-200",
    icon: "bg-orange-100 text-orange-700",
    text: "text-orange-700",
    hover: "hover:border-orange-300",
  },
  slate: {
    bar: "border-t-slate-400",
    soft: "bg-slate-50 border-slate-200",
    icon: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    hover: "hover:border-slate-300",
  },
} as const;

export type TopicAccent = (typeof ACCENTS)[keyof typeof ACCENTS];

/*
 * Suggested study order, icon and colour for each topic on /learn.
 * A topic missing from this list still shows, after these, in slate with a book icon.
 * Descriptions live in messages/*.json under Learn.topics.<slug>.
 */
export const STUDY_ORDER: {
  slug: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
}[] = [
  { slug: "license-information", icon: IdCard, accent: "indigo" },
  { slug: "road-signs", icon: Signpost, accent: "red" },
  { slug: "traffic-lights-and-signals", icon: TrafficCone, accent: "amber" },
  { slug: "intersections-and-turns", icon: Split, accent: "sky" },
  { slug: "basics-of-driving", icon: Car, accent: "emerald" },
  { slug: "share-the-road", icon: Bike, accent: "teal" },
  { slug: "highway-driving", icon: Gauge, accent: "blue" },
  { slug: "responsible-driving", icon: ShieldCheck, accent: "violet" },
  { slug: "emergency-conditions", icon: TriangleAlert, accent: "orange" },
];

/** Sort topics into study order; unknown topics go last, alphabetically. */
export function sortByStudyOrder<T extends { slug: string; title: string }>(
  topics: T[],
) {
  const rank = (slug: string) => {
    const i = STUDY_ORDER.findIndex((t) => t.slug === slug);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...topics].sort(
    (a, b) => rank(a.slug) - rank(b.slug) || a.title.localeCompare(b.title),
  );
}

/** Icon and colour for a topic, with a neutral fallback for new topics. */
export function topicStyle(slug: string): {
  icon: LucideIcon;
  accent: TopicAccent;
} {
  const entry = STUDY_ORDER.find((t) => t.slug === slug);
  return {
    icon: entry?.icon ?? BookOpen,
    accent: ACCENTS[entry?.accent ?? "slate"],
  };
}
