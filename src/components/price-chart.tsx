import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useId } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { tickerQueries } from "@/lib/queries/ticker";

export const CHART_RANGES = [
	{ value: "180", label: "6M", days: 180 },
	{ value: "365", label: "1Y", days: 365 },
	{ value: "730", label: "2Y", days: 730 },
	{ value: "0", label: "All", days: 0 },
] as const;

function fmtPrice(value: number) {
	return `₱${value.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function fmtAxisDate(ts: number) {
	return new Date(ts).toLocaleDateString("en-PH", {
		month: "short",
		year: "2-digit",
	});
}

function fmtTooltipDate(ts: number) {
	return new Date(ts).toLocaleDateString("en-PH", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function PriceChart({
	symbol,
	range,
}: {
	symbol: string;
	range: string;
}) {
	const gradientId = useId();
	const days = CHART_RANGES.find((r) => r.value === range)?.days ?? 365;
	const { data = [] } = useQuery({
		...tickerQueries.klines(symbol, days),
		placeholderData: keepPreviousData,
	});

	return (
		<Card className="flex flex-col">
			<CardContent className="pt-4 pb-4">
				<ResponsiveContainer width="100%" height={110}>
					<AreaChart
						data={data}
						margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
					>
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-primary)"
									stopOpacity={0.2}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-primary)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<XAxis
							dataKey="time"
							tickFormatter={fmtAxisDate}
							tick={{ fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							minTickGap={40}
						/>
						<YAxis
							domain={["auto", "auto"]}
							tickFormatter={(v: number) => `₱${v.toLocaleString()}`}
							tick={{ fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							width={70}
						/>
						<Tooltip
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const { time, price } = payload[0].payload as {
									time: number;
									price: number;
								};
								return (
									<div className="rounded-md border bg-popover px-3 py-1.5 text-sm shadow-md">
										<p className="text-muted-foreground">
											{fmtTooltipDate(time)}
										</p>
										<p className="font-medium tabular-nums">
											{fmtPrice(price)}
										</p>
									</div>
								);
							}}
						/>
						<Area
							type="monotone"
							dataKey="price"
							stroke="var(--color-primary)"
							strokeWidth={1.5}
							fill={`url(#${gradientId})`}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
