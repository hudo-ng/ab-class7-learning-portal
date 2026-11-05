import type en from "@/messages/en.json";

type NavItem = {
  labelKey: keyof (typeof en)["Nav"];
  href: string;
  auth?: "guest" | "user" | "admin";
};

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "learn", href: "/learn" },
  { labelKey: "practice", href: "/practice", auth: "user" },
  { labelKey: "mockExam", href: "/mock-exam", auth: "user" },
  { labelKey: "admin", href: "/admin", auth: "admin" },
];
