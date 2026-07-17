"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { calculateEMI, formatMoney } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScheduleRow {
  month: number;
  emi: number;
  interest: number;
  principal: number;
  balance: number;
}

function buildSchedule(
  principal: number,
  ratePct: number,
  months: number,
): ScheduleRow[] {
  const emi = calculateEMI(principal, ratePct, months);
  const monthlyRate = ratePct / 12 / 100;
  const rows: ScheduleRow[] = [];
  let balance = principal;

  for (let m = 1; m <= months && balance > 0.005; m++) {
    const interest = balance * monthlyRate;
    const principalPart = Math.min(emi - interest, balance);
    balance -= principalPart;
    rows.push({
      month: m,
      emi,
      interest,
      principal: principalPart,
      balance: Math.max(0, balance),
    });
  }
  return rows;
}

export function AmortizationDialog({
  lender,
  principal,
  ratePct,
  months,
}: {
  lender: string;
  principal: number;
  ratePct: number;
  months: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rows = open ? buildSchedule(principal, ratePct, months) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="size-4" /> {t.loans.schedule}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t.loans.amortization} — {lender}
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.loans.month}</TableHead>
              <TableHead className="text-right">EMI</TableHead>
              <TableHead className="text-right">{t.loans.interest}</TableHead>
              <TableHead className="text-right">
                {t.loans.principalCol}
              </TableHead>
              <TableHead className="text-right">{t.loans.balance}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.month}>
                <TableCell>{r.month}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(r.emi)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(r.interest)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(r.principal)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(r.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
