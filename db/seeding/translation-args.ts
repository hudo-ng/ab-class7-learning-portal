const KINDS = ["lessons", "questions"] as const;
export type TranslationKind = (typeof KINDS)[number];

// <locale> [lessons|questions] [--dry-run]; no kind means both
export function translationArgs() {
  const [locale, kind] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (kind && !KINDS.includes(kind as TranslationKind)) {
    throw new Error(`Unknown kind "${kind}", use ${KINDS.join(" or ")}`);
  }
  const kinds: readonly TranslationKind[] = kind ? [kind as TranslationKind] : KINDS;
  return { locale, kinds };
}
