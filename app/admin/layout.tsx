import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminSideBar from "@/components/admin/SideBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return (
    <div className="flex min-h-screen">
      <AdminSideBar />
      <main className="flex-1 p-6 bg-muted/40">{children}</main>
    </div>
  );
}
