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
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <AdminSideBar />
      {/* min-w-0 lets wide content scroll inside instead of widening the page */}
      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
