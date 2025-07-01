"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

interface DashboardStatsProps {
    totalProjects: number;
    totalFeatures: number;
    totalScenarios: number;
}

export default function DashboardStats({ totalProjects, totalFeatures, totalScenarios }: DashboardStatsProps) {
    const chartData = [
        { name: "پروژه‌ها", total: totalProjects, fill: "var(--color-projects)" },
        { name: "ویژگی‌ها", total: totalFeatures, fill: "var(--color-features)" },
        { name: "سناریوها", total: totalScenarios, fill: "var(--color-scenarios)" },
    ]

    const chartConfig = {
        total: {
            label: "تعداد",
        },
        projects: {
            label: "پروژه‌ها",
            color: "hsl(var(--chart-1))",
        },
        features: {
            label: "ویژگی‌ها",
            color: "hsl(var(--chart-2))",
        },
        scenarios: {
            label: "سناریوها",
            color: "hsl(var(--chart-3))",
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>نمای کلی فعالیت‌ها</CardTitle>
                <CardDescription>خلاصه‌ای از موجودیت‌های تعریف شده در حساب شما</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig as any}>
                    <BarChart accessibilityLayer data={chartData} layout="vertical">
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <XAxis dataKey="total" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="total" layout="vertical" radius={5} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    آمار کلی پروژه شما <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    نمایش تعداد کل پروژه‌ها، ویژگی‌ها و سناریوها
                </div>
            </CardFooter>
        </Card>
    )
}