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

export interface ExportRow {
  Date: string;
  Type: string;
  Category: string;
  Account: string;
  Amount: number;
  Method: string;
  Remarks: string;
}

export function ExportMenu({
  rows,
  fileName = "finora-transactions",
}: {
  rows: ExportRow[];
  fileName?: string;
}) {
  const t = useT();

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 16 },
      { wch: 12 },
      { wch: 10 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Finora — Transactions", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Exported ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Type", "Category", "Account", "Amount (Rs.)", "Method", "Remarks"]],
      body: rows.map((r) => [
        r.Date,
        r.Type,
        r.Category,
        r.Account,
        r.Amount.toLocaleString("en-IN"),
        r.Method,
        r.Remarks,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 36, 84] },
    });

    doc.save(`${fileName}.pdf`);
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
