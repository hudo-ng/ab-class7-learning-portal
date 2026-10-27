import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminSideBar from "@/components/admin/SideBar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    return (
      // logged in, wrong role → explain
      <div className="mx-auto max-w-md mt-20 rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">You don&apos;t have access to this page</p>
        <p className="text-sm text-muted-foreground">
          This area is for administrators only.
        </p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen">
      <AdminSideBar />
      <main className="flex-1 p-6 bg-muted/40">{children}</main>
    </div>
  );
}
