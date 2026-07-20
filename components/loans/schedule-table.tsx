"use client";

import { Check, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useFormatDate, useT } from "@/components/locale-provider";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ScheduleRow } from "@/lib/schedule";

export function ScheduleTable({
  rows,
  lender,
}: {
  rows: ScheduleRow[];
  lender: string;
}) {
  const t = useT();
  const formatDate = useFormatDate();

  function statusCell(r: ScheduleRow) {
    if (r.paid) {
      return (
        <Badge className="bg-[var(--success)] text-white">
          <Check className="size-3" /> {t.loans.paidStatus}
        </Badge>
      );
    }
    if (r.daysRemaining == null) return null;
    if (r.daysRemaining < 0) {
      return <Badge variant="destructive">{t.loans.duePassed}</Badge>;
    }
    if (r.daysRemaining === 0) {
      return <Badge className="bg-[var(--warning)] text-white">{t.loans.dueToday}</Badge>;
    }
    return (
      <span className="text-xs text-muted-foreground">
        {r.daysRemaining} {t.loans.daysLeft}
      </span>
    );
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => ({
      "#": r.n,
      "Start date": r.startDate,
      "End date": r.endDate,
      Days: r.days,
      Outstanding: r.outstanding,
      Principal: r.principal,
      Interest: r.interest,
      EMI: r.emi,
      Balance: r.balance,
      Status: r.paid ? "Paid" : "Pending",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, `finora-loan-${lender}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(15);
    doc.text(`Loan schedule — ${lender}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["#", "Start", "End", "Days", "Outstanding", "Principal", "Interest", "EMI", "Balance", "Status"]],
      body: rows.map((r) => [
        r.n,
        r.startDate,
        r.endDate,
        r.days,
        r.outstanding.toLocaleString("en-IN"),
        r.principal.toLocaleString("en-IN"),
        r.interest.toLocaleString("en-IN"),
        r.emi.toLocaleString("en-IN"),
        r.balance.toLocaleString("en-IN"),
        r.paid ? "Paid" : "Pending",
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 36, 84] },
    });
    doc.save(`finora-loan-${lender}.pdf`);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="size-4" /> {t.loans.exportSchedule}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportExcel}>
              <FileSpreadsheet /> {t.tx.exportExcel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPdf}>
              <FileText /> {t.tx.exportPdf}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t.loans.startCol}</TableHead>
              <TableHead>{t.loans.endCol}</TableHead>
              <TableHead className="text-right">{t.loans.daysCol}</TableHead>
              <TableHead className="text-right">{t.loans.outstandingCol}</TableHead>
              <TableHead className="text-right">{t.loans.principalCol}</TableHead>
              <TableHead className="text-right">{t.loans.interest}</TableHead>
              <TableHead className="text-right">{t.loans.totalCol}</TableHead>
              <TableHead className="text-right">{t.loans.balance}</TableHead>
              <TableHead>{t.loans.statusCol}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.n} className={cn(r.paid && "bg-muted/40")}>
                <TableCell className="text-muted-foreground">{r.n}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(r.startDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(r.endDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.days}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <Money value={r.outstanding} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Money value={r.principal} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Money value={r.interest} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Money value={r.emi} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Money value={r.balance} />
                </TableCell>
                <TableCell>{statusCell(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
