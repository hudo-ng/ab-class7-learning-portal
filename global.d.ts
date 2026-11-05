import en from "./messages/en.json";
import { locales } from "./i18n/config";

// Typed translation keys: t("typo") becomes a TypeScript error
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof en;
  }
}
