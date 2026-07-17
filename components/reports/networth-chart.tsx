"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import type { NetWorthPoint } from "@/lib/data";

const config = {
  netWorth: { label: "Net worth", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.reports.netWorth}</CardTitle>
        <CardDescription>{t.reports.netWorthDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 12 }}>
            <defs>
              <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={56}
              tickFormatter={(v: number) => formatMoney(v, { compact: true })}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {formatMoney(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="netWorth"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#nwFill)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
