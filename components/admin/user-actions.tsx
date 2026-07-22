"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Ban, RotateCcw, Trash2 } from "lucide-react";
import { deleteUserAccount, setUserActive } from "@/lib/actions/billing";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";

/**
 * Deactivate / reactivate / delete controls for one row of the admin user
 * table. The server actions and the DB both refuse to touch the caller's own
 * account or another super admin, so this only hides the buttons — it isn't
 * the security boundary.
 */
export function UserActions({
  userId,
  name,
  deactivated,
}: {
  userId: string;
  name: string;
  deactivated: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setUserActive(userId, deactivated);
      if (result?.error) toast.error(result.error);
      else toast.success(deactivated ? "Account reactivated" : "Account deactivated");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="outline" disabled={pending} onClick={toggle}>
        {deactivated ? (
          <>
            <RotateCcw className="mr-1 size-3.5" /> Activate
          </>
        ) : (
          <>
            <Ban className="mr-1 size-3.5" /> Deactivate
          </>
        )}
      </Button>

      <ConfirmDelete
        action={() => deleteUserAccount(userId)}
        successMessage="Account deleted"
        title={`Delete ${name}?`}
        description="This permanently removes the account and every transaction, account, budget, loan, investment and goal belonging to it. This cannot be undone."
        ariaLabel={`Delete ${name}`}
        trigger={
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
    </div>
  );
}
