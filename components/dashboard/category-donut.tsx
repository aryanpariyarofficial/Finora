"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/finance";
import { useT } from "@/components/locale-provider";
import type { CategoryTotal } from "@/lib/data";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const config = { total: { label: "Spent" } } satisfies ChartConfig;

/** Top 5 categories; the rest fold into "Other". */
function fold(data: CategoryTotal[]) {
  if (data.length <= COLORS.length) return data;
  const top = data.slice(0, COLORS.length - 1);
  const rest = data.slice(COLORS.length - 1);
  return [
    ...top,
    {
      category: "Other",
      total: rest.reduce((acc, r) => acc + r.total, 0),
    },
  ];
}

export function CategoryDonut({ data }: { data: CategoryTotal[] }) {
  const t = useT();
  const folded = fold(data);
  const total = folded.reduce((acc, r) => acc + r.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dash.expenseCategories}</CardTitle>
        <CardDescription>{t.dash.thisMonth}</CardDescription>
      </CardHeader>
      <CardContent>
        {folded.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {t.dash.noExpenses}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ChartContainer config={config} className="h-52 w-52 shrink-0">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="category"
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-2.5 rounded-[2px]"
                              style={{
                                background: item?.payload?.fill,
                              }}
                            />
                            {item?.payload?.category}
                          </div>
                          <span className="font-mono font-medium tabular-nums">
                            {formatMoney(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={folded}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {folded.map((entry, i) => (
                    <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="w-full space-y-2">
              {folded.map((row, i) => (
                <li
                  key={row.category}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {row.category}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(row.total)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {total > 0 ? Math.round((row.total / total) * 100) : 0}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
