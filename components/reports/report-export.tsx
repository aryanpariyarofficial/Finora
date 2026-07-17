"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryTotal } from "@/lib/data";

interface ReportExportProps {
  periodLabel: string;
  income: number;
  expense: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
}

export function ReportExport({
  periodLabel,
  income,
  expense,
  incomeByCategory,
  expenseByCategory,
}: ReportExportProps) {
  const t = useT();

  const summaryRows = [
    { Item: "Income", Amount: income },
    { Item: "Expense", Amount: expense },
    { Item: "Net savings", Amount: income - expense },
  ];

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const summary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, summary, "Summary");

    const incomeSheet = XLSX.utils.json_to_sheet(
      incomeByCategory.map((r) => ({ Category: r.category, Amount: r.total })),
    );
    XLSX.utils.book_append_sheet(wb, incomeSheet, "Income by category");

    const expenseSheet = XLSX.utils.json_to_sheet(
      expenseByCategory.map((r) => ({ Category: r.category, Amount: r.total })),
    );
    XLSX.utils.book_append_sheet(wb, expenseSheet, "Expense by category");

    XLSX.writeFile(wb, `finora-report.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Finora — Report", 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(periodLabel, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Summary", "Amount (Rs.)"]],
      body: summaryRows.map((r) => [r.Item, r.Amount.toLocaleString("en-IN")]),
      headStyles: { fillColor: [30, 36, 84] },
    });

    autoTable(doc, {
      head: [["Income by category", "Amount (Rs.)"]],
      body: incomeByCategory.map((r) => [
        r.category,
        r.total.toLocaleString("en-IN"),
      ]),
      headStyles: { fillColor: [30, 36, 84] },
    });

    autoTable(doc, {
      head: [["Expense by category", "Amount (Rs.)"]],
      body: expenseByCategory.map((r) => [
        r.category,
        r.total.toLocaleString("en-IN"),
      ]),
      headStyles: { fillColor: [30, 36, 84] },
    });

    doc.save(`finora-report.pdf`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download /> {t.tx.export}
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
  );
}
