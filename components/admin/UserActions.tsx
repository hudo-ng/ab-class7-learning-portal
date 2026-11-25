"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteUser,
  setUserApproved,
  setUserRole,
  type UserActionResult,
} from "@/app/actions/admin/users";

interface Props {
  user: { id: string; email: string; role: string; isApproved: boolean };
  /** The signed-in admin's own row */
  isSelf: boolean;
  /** True when this user is the only admin left */
  isLastAdmin: boolean;
}

/**
 * Approve / role / delete buttons for one user. The server enforces every
 * rule again; disabled buttons here are only a hint.
 */
export function UserActions({ user, isSelf, isLastAdmin }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"delete" | "role" | null>(null);
  const isAdmin = user.role === "ADMIN";

  function run(action: () => Promise<UserActionResult>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if ("error" in res) setError(res.error);
      setDialog(null);
    });
  }

  const roleLocked = isAdmin && (isSelf || isLastAdmin);
  const deleteLocked = isSelf || (isAdmin && isLastAdmin);
  const lockReason = isSelf
    ? "You can't change your own account here."
    : "This is the only admin. Make another user an admin first.";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {!isAdmin && (
          <Button
            size="sm"
            variant={user.isApproved ? "outline" : "default"}
            disabled={pending}
            className={
              user.isApproved ? "" : "bg-emerald-600 hover:bg-emerald-700"
            }
            onClick={() =>
              run(() => setUserApproved(user.id, !user.isApproved))
            }
          >
            {user.isApproved ? "Disable" : "Approve"}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={pending || roleLocked}
          title={roleLocked ? lockReason : undefined}
          onClick={() => setDialog("role")}
        >
          {isAdmin ? (
            <ShieldOff className="size-4" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-4" aria-hidden="true" />
          )}
          {isAdmin ? "Remove admin" : "Make admin"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={pending || deleteLocked}
          title={deleteLocked ? lockReason : undefined}
          className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          onClick={() => setDialog("delete")}
          aria-label={`Delete ${user.email}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="sm:inline">Delete</span>
        </Button>

        {pending && (
          <MoreHorizontal
            className="size-4 animate-pulse text-slate-400"
            aria-label="Working"
          />
        )}
      </div>

      {(roleLocked || deleteLocked) && isAdmin && (
        <p className="text-xs text-slate-500 md:text-right">{lockReason}</p>
      )}
      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-rose-700 md:text-right"
        >
          {error}
        </p>
      )}

      <Dialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          {dialog === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete this user?</DialogTitle>
                <DialogDescription>
                  <span className="font-medium text-slate-900">
                    {user.email}
                  </span>{" "}
                  will be removed with all of their practice and mock exam
                  history. They will be signed out. This can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={pending}
                  onClick={() => run(() => deleteUser(user.id))}
                >
                  Delete user
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isAdmin ? "Remove admin role?" : "Make this user an admin?"}
                </DialogTitle>
                <DialogDescription>
                  <span className="font-medium text-slate-900">
                    {user.email}
                  </span>{" "}
                  {isAdmin
                    ? "will lose access to the admin pages and become a regular student."
                    : "will get full access to the admin pages, including managing users and questions. Their account is approved automatically."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={pending}
                  onClick={() =>
                    run(() => setUserRole(user.id, isAdmin ? "USER" : "ADMIN"))
                  }
                >
                  {isAdmin ? "Remove admin" : "Make admin"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
