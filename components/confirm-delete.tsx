"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useT } from "@/components/locale-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Reusable "are you sure?" delete button. Runs `action` (a server action)
 * only after the user confirms, and toasts success/error.
 */
export function ConfirmDelete({
  action,
  successMessage,
  title,
  description,
  trigger,
  ariaLabel,
}: {
  action: () => Promise<{ error?: string } | void>;
  successMessage: string;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  ariaLabel?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res = await action();
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(successMessage);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={ariaLabel ?? t.confirm.delete}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t.confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t.confirm.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.confirm.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? t.confirm.deleting : t.confirm.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
