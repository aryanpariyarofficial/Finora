"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Braces, FileSpreadsheet, Loader2 } from "lucide-react";
import { getAllUserData, type ExportBundle } from "@/lib/actions/export";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

function flattenTx(bundle: ExportBundle) {
  return (bundle.transactions as Record<string, unknown>[]).map((t) => ({
    Date: t.occurred_on,
    Type: t.type,
    Amount: t.amount,
    Category:
      (t.category as { name?: string } | null)?.name ??
      (t.type === "transfer"
        ? `${(t.account as { name?: string } | null)?.name ?? ""} → ${(t.counter_account as { name?: string } | null)?.name ?? ""}`
        : ""),
    Account: (t.account as { name?: string } | null)?.name ?? "",
    Method: t.payment_method ?? "",
    Remarks: t.description ?? "",
  }));
}

export function DataExport({ canExport }: { canExport: boolean }) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  function run(format: "json" | "xlsx") {
    startTransition(async () => {
      const result = await getAllUserData();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const bundle = result.data;
      const stamp = bundle.exportedAt.slice(0, 10);

      if (format === "json") {
        const blob = new Blob([JSON.stringify(bundle, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `finora-backup-${stamp}.json`);
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(flattenTx(bundle)),
          "Transactions",
        );
        const sheets: [string, unknown[]][] = [
          ["Accounts", bundle.accounts],
          ["Budgets", bundle.budgets],
          ["Loans", bundle.loans],
          ["Investments", bundle.investments],
          ["Recurring", bundle.recurring],
          ["Goals", bundle.goals],
        ];
        for (const [name, rows] of sheets) {
          if (rows.length) {
            XLSX.utils.book_append_sheet(
              wb,
              XLSX.utils.json_to_sheet(rows as object[]),
              name,
            );
          }
        }
        XLSX.writeFile(wb, `finora-backup-${stamp}.xlsx`);
      }
      toast.success(t.dataExport.done);
    });
  }

  if (!canExport) {
    return (
      <p className="text-sm text-muted-foreground">{t.dataExport.premium}</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={pending} onClick={() => run("xlsx")}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="size-4" />
        )}
        {t.dataExport.excel}
      </Button>
      <Button variant="outline" disabled={pending} onClick={() => run("json")}>
        <Braces className="size-4" /> {t.dataExport.json}
      </Button>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
