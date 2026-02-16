import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { OrderForm } from "@/components/order-form";
import { CHART_RANGES, PriceChart } from "@/components/price-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeAsset } from "@/hooks/use-realtime-asset";
import { accountQueries } from "@/lib/queries/account";
import { tickerQueries } from "@/lib/queries/ticker";
import { tradeQueries } from "@/lib/queries/trades";
import type { Trade } from "@/server/trade.functions";

export const Route = createFileRoute("/_authenticated/asset/$asset")({
	loader: ({ context, params }) => {
		const symbol = `${params.asset}PHP`;
		context.queryClient.prefetchQuery(tradeQueries.bySymbol(symbol));
		context.queryClient.prefetchQuery(accountQueries.portfolio());
		context.queryClient.prefetchQuery(tickerQueries.price(symbol));
	},
	component: AssetDetail,
});

const PERIODS = [
	{ value: "30", label: "30D", days: 30 },
	{ value: "90", label: "90D", days: 90 },
	{ value: "365", label: "1Y", days: 365 },
	{ value: "all", label: "All", days: 0 },
] as const;

function cutoff(days: number) {
	if (days === 0) return 0;
	return Date.now() - days * 24 * 60 * 60 * 1000;
}

function fmtNum(value: string | number, decimals = 8) {
	const n = Number(value);
	if (n === 0) return "0.00";
	return n.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	});
}

function fmtDate(ts: number) {
	return new Date(ts).toLocaleDateString("en-PH", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function computeStats(trades: Trade[]) {
	const buys = trades.filter((t) => t.isBuyer);
	const sells = trades.filter((t) => !t.isBuyer);
	const buyQty = buys.reduce((s, t) => s + Number(t.qty), 0);
	const buyCost = buys.reduce((s, t) => s + Number(t.quoteQty), 0);
	const sellQty = sells.reduce((s, t) => s + Number(t.qty), 0);
	const sellCost = sells.reduce((s, t) => s + Number(t.quoteQty), 0);
	const avgPrice = buyQty > 0 ? buyCost / buyQty : 0;
	return { buyQty, buyCost, sellQty, sellCost, avgPrice };
}

function AssetDetail() {
	const { asset } = Route.useParams();
	const symbol = `${asset}PHP`;
	const { isLive } = useRealtimeAsset({ symbol });
	const { data: allTrades = [] } = useQuery(tradeQueries.bySymbol(symbol));
	const { data: portfolio } = useQuery(accountQueries.portfolio());
	const { data: ticker } = useQuery(tickerQueries.price(symbol));
	const [period, setPeriod] = useState<string>("all");
	const [chartRange, setChartRange] = useState("365");
	const [orderSheet, setOrderSheet] = useState<{
		open: boolean;
		side: "BUY" | "SELL";
	}>({ open: false, side: "BUY" });

	const price = ticker?.price ?? 0;
	const balance = portfolio?.balances.find((b) => b.asset === asset);
	const holding = balance ? Number(balance.free) + Number(balance.locked) : 0;
	const holdingPhp = holding * price;
	const phpBalance = portfolio?.balances.find((b) => b.asset === "PHP");
	const phpFree = phpBalance ? Number(phpBalance.free) : 0;

	const days = PERIODS.find((p) => p.value === period)?.days ?? 0;
	const trades = useMemo(() => {
		const c = cutoff(days);
		return c === 0 ? allTrades : allTrades.filter((t) => t.time >= c);
	}, [allTrades, days]);

	const allStats = computeStats(allTrades);
	const filtered = computeStats(trades);
	const boughtValueNow = allStats.buyQty * price;
	const pnl = boughtValueNow - allStats.buyCost;
	const pnlPct = allStats.buyCost > 0 ? (pnl / allStats.buyCost) * 100 : 0;

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/">
						<ArrowLeft className="size-4" />
						Back
					</Link>
				</Button>
				<Tabs value={period} onValueChange={setPeriod}>
					<TabsList>
						{PERIODS.map((p) => (
							<TabsTrigger key={p.value} value={p.value}>
								{p.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				<div className="ml-auto">
					<Tabs value={chartRange} onValueChange={setChartRange}>
						<TabsList>
							{CHART_RANGES.map((r) => (
								<TabsTrigger key={r.value} value={r.value}>
									{r.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-1.5">
							{asset} Balance
							{isLive && (
								<span className="relative flex size-2">
									<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
								</span>
							)}
						</CardDescription>
						<CardTitle className="text-3xl font-bold tabular-nums">
							₱{fmtNum(holdingPhp, 2)}
						</CardTitle>
						<CardDescription className="tabular-nums">
							{fmtNum(holding)} {asset}
						</CardDescription>
						<div className="flex gap-2 pt-2">
							<Button
								size="sm"
								className="flex-1 bg-emerald-600 hover:bg-emerald-700"
								onClick={() => setOrderSheet({ open: true, side: "BUY" })}
							>
								Buy
							</Button>
							<Button
								size="sm"
								variant="destructive"
								className="flex-1"
								onClick={() => setOrderSheet({ open: true, side: "SELL" })}
							>
								Sell
							</Button>
						</div>
					</CardHeader>
				</Card>
				<PriceChart symbol={symbol} range={chartRange} />
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-1.5">
							Current Price
							{isLive && (
								<span className="relative flex size-2">
									<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
								</span>
							)}
						</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							₱{fmtNum(price, 2)}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Avg Buy Price</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							₱{fmtNum(allStats.avgPrice, 2)}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Unrealized P&L</CardDescription>
						<CardTitle
							className={`text-2xl tabular-nums ${pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
						>
							{pnl >= 0 ? "+" : ""}₱{fmtNum(pnl, 2)}
						</CardTitle>
						<CardDescription className="tabular-nums">
							{pnl >= 0 ? "+" : ""}
							{fmtNum(pnlPct, 2)}%
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Total Cost</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							₱{fmtNum(allStats.buyCost, 2)}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardDescription>Total Bought</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							₱{fmtNum(filtered.buyCost, 2)}
						</CardTitle>
						<CardDescription className="tabular-nums">
							{fmtNum(filtered.buyQty)} {asset}
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Total Sold</CardDescription>
						<CardTitle className="text-2xl tabular-nums">
							₱{fmtNum(filtered.sellCost, 2)}
						</CardTitle>
						<CardDescription className="tabular-nums">
							{fmtNum(filtered.sellQty)} {asset}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{asset} Trades</CardTitle>
					<CardDescription>
						{trades.length} trade{trades.length !== 1 && "s"} on {symbol}
					</CardDescription>
				</CardHeader>
				<CardContent className="px-0">
					{trades.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Date</TableHead>
									<TableHead>Side</TableHead>
									<TableHead>Source</TableHead>
									<TableHead className="text-right">Price</TableHead>
									<TableHead className="text-right">Qty</TableHead>
									<TableHead className="text-right">Total</TableHead>
									<TableHead className="text-right pr-6">Fee</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{trades.map((t) => (
									<TableRow key={t.id}>
										<TableCell className="pl-6 text-muted-foreground">
											{fmtDate(t.time)}
										</TableCell>
										<TableCell>
											<Badge variant={t.isBuyer ? "default" : "secondary"}>
												{t.isBuyer ? "Buy" : "Sell"}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{t.source === "convert" ? "Convert" : "Exchange"}
											</Badge>
										</TableCell>
										<TableCell className="text-right tabular-nums">
											₱{fmtNum(t.price, 2)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{fmtNum(t.qty)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											₱{fmtNum(t.quoteQty, 2)}
										</TableCell>
										<TableCell className="text-right pr-6 tabular-nums text-muted-foreground">
											{fmtNum(t.commission)} {t.commissionAsset}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<p className="px-6 text-sm text-muted-foreground">
							No trades found for this period.
						</p>
					)}
				</CardContent>
			</Card>
			<Sheet
				open={orderSheet.open}
				onOpenChange={(open) => setOrderSheet((prev) => ({ ...prev, open }))}
			>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>
							{orderSheet.side === "BUY" ? "Buy" : "Sell"} {asset}
						</SheetTitle>
						<SheetDescription>
							Place a {orderSheet.side === "BUY" ? "buy" : "sell"} order on{" "}
							{symbol}
						</SheetDescription>
					</SheetHeader>
					<OrderForm
						symbol={symbol}
						asset={asset}
						side={orderSheet.side}
						price={price}
						balance={holding}
						phpBalance={phpFree}
						onSuccess={() => setOrderSheet({ open: false, side: orderSheet.side })}
					/>
				</SheetContent>
			</Sheet>
		</div>
	);
}
