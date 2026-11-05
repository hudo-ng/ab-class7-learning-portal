import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("Footer");
  return (
    <footer className="mt-16 border-t py-6 text-center text-xs text-muted-foreground">
      {t.rich("credit", {
        licence: (chunks) => (
          <a
            href="https://open.alberta.ca/publications/drivers-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {chunks}
          </a>
        ),
      })}
    </footer>
  );
}
