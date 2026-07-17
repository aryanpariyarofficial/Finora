"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/finance";
import { useT } from "@/components/locale-provider";
import type { MonthPoint } from "@/lib/data";

const config = {
  income: { label: "Income", color: "var(--chart-4)" },
  expense: { label: "Expense", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function CashflowChart({
  data,
  title,
  description,
}: {
  data: MonthPoint[];
  title?: string;
  description?: string;
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t.dash.cashflow}</CardTitle>
        <CardDescription>{description ?? t.dash.cashflowDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <BarChart data={data} barGap={2}>
            <CartesianGrid vertical={false} strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => formatMoney(v, { compact: true })}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2.5 rounded-[2px]"
                          style={{ background: item.color }}
                        />
                        {config[name as keyof typeof config]?.label ?? name}
                      </div>
                      <span className="font-mono font-medium tabular-nums">
                        {formatMoney(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expense"
              fill="var(--color-expense)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
