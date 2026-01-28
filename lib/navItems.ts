type NavItem = {
    label: string;
    href: string;
    auth?: "guest" | "user" | "admin";
}

export const NAV_ITEMS: NavItem[] = [
    {label: "Learn", href: "/learn", },
    {label: "Practice", href: "/practice", auth: "user"},
    {label: "Mock Exam", href: "/mock-exam", auth: "user" },
    {label: "Admin", href: "/admin", auth: "admin" },   
]