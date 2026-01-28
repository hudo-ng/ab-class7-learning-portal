import { db } from "@/db";
import { users } from "@/db/schema";
import { ConfirmActionButton } from "@/components/admin/ConfirmButton";
import { approveUser } from "@/app/actions/admin/approve-user";

export default async function adminUsersPage() {
  const allUsers = await db.select().from(users);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Approved</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-3">{user.email}</td>
                <td className="p-3 text-center">{user.role}</td>
                <td className="p-3 text-center">
                  {user.isApproved ? "✅" : "❌"}
                </td>
                <td className="p-3 text-right">
                  <form action={approveUser}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="approved"
                      value={String(!user.isApproved)}
                    />
                    <ConfirmActionButton
                      confirmText={
                        user.isApproved
                          ? "Are you sure you want to disable this user?"
                          : "Are you sure you want to approve this user?"
                      }
                    >
                      {user.isApproved ? "Disable" : "Approve"}
                    </ConfirmActionButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
