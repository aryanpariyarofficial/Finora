"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
import { useT } from "@/components/locale-provider";
import { formatMoney } from "@/lib/finance";
import type { MonthPoint } from "@/lib/data";

const config = {
  net: { label: "Net savings", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SavingsTrend({ data }: { data: MonthPoint[] }) {
  const t = useT();
  const points = data.map((d) => ({ label: d.label, net: d.income - d.expense }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.reports.net}</CardTitle>
        <CardDescription>{t.reports.trend}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-56 w-full">
          <LineChart data={points} margin={{ left: 4, right: 12 }}>
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
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {formatMoney(Number(value), { signed: true })}
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey="net"
              type="monotone"
              stroke="var(--color-net)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
