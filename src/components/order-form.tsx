import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateOrder } from "@/lib/queries/order";
import type { OrderResponse } from "@/server/order.functions";

type OrderType = "MARKET" | "LIMIT";
type Side = "BUY" | "SELL";

interface OrderFormProps {
	symbol: string;
	asset: string;
	side: Side;
	price: number;
	balance: number;
	phpBalance: number;
	onSuccess: () => void;
}

function fmtPrice(n: number) {
	return n.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function fmtQty(value: string) {
	const n = Number(value);
	if (n === 0) return "0";
	return n.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	});
}

const PENDING_STATUSES = ["NEW", "PARTIALLY_FILLED"];

export function OrderForm({
	symbol,
	asset,
	side,
	price,
	balance,
	phpBalance,
	onSuccess,
}: OrderFormProps) {
	const [orderType, setOrderType] = useState<OrderType>("MARKET");
	const [amount, setAmount] = useState("");
	const [qty, setQty] = useState("");
	const [limitPrice, setLimitPrice] = useState("");
	const [result, setResult] = useState<OrderResponse | null>(null);
	const mutation = useCreateOrder(symbol);

	const isBuy = side === "BUY";

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		mutation.reset();

		const params: Parameters<typeof mutation.mutate>[0] = {
			data: { symbol, side, type: orderType },
		};

		if (orderType === "MARKET") {
			if (isBuy) {
				params.data.quoteOrderQty = amount;
			} else {
				params.data.quantity = qty;
			}
		} else {
			params.data.quantity = qty;
			params.data.price = limitPrice;
		}

		mutation.mutate(params, {
			onSuccess: (data) => setResult(data),
		});
	}

	if (result) {
		const isPending = PENDING_STATUSES.includes(result.status ?? "");
		const totalFillQty = result.fills?.reduce((s, f) => s + Number(f.qty), 0) ?? 0;
		const avgFillPrice = totalFillQty > 0
			? result.fills!.reduce((s, f) => s + Number(f.price) * Number(f.qty), 0) / totalFillQty
			: 0;

		return (
			<div className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-2">
					<CheckCircle2 className="size-5 text-emerald-500" />
					<span className="font-medium">Order Placed</span>
				</div>



				<div className="space-y-2 text-sm">
					{result.status && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Status</span>
							<Badge variant={isPending ? "secondary" : "default"}>
								{result.status}
							</Badge>
						</div>
					)}
					<div className="flex justify-between">
						<span className="text-muted-foreground">Side</span>
						<span>{result.side ?? side}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Type</span>
						<span>{result.type ?? orderType}</span>
					</div>
					{result.origQty && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Quantity</span>
							<span className="tabular-nums">{fmtQty(result.origQty)} {asset}</span>
						</div>
					)}
					{result.executedQty && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Filled</span>
							<span className="tabular-nums">{fmtQty(result.executedQty)} {asset}</span>
						</div>
					)}
					{avgFillPrice > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Avg Fill Price</span>
							<span className="tabular-nums">₱{fmtPrice(avgFillPrice)}</span>
						</div>
					)}
				</div>

				<div className="flex flex-col gap-2 pt-2">
					<Button onClick={onSuccess}>Done</Button>
					{isPending && (
						<Button variant="outline" asChild>
							<Link to="/orders">View Orders</Link>
						</Button>
					)}
				</div>
			</div>
		);
	}

	const isValid =
		orderType === "MARKET"
			? isBuy
				? Number(amount) > 0
				: Number(qty) > 0
			: Number(qty) > 0 && Number(limitPrice) > 0;

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
			<div className="text-sm text-muted-foreground">
				Current price: <span className="font-medium text-foreground tabular-nums">₱{fmtPrice(price)}</span>
			</div>

			<Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
				<TabsList className="w-full">
					<TabsTrigger value="MARKET" className="flex-1">Market</TabsTrigger>
					<TabsTrigger value="LIMIT" className="flex-1">Limit</TabsTrigger>
				</TabsList>
			</Tabs>

			{orderType === "MARKET" ? (
				isBuy ? (
					<div className="space-y-2">
						<Label htmlFor="amount">Amount (PHP)</Label>
						<Input
							id="amount"
							type="number"
							step="any"
							min="0"
							placeholder="0.00"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
						<div className="flex items-center justify-between">
							{Number(amount) > 0 && price > 0 && (
								<p className="text-xs text-muted-foreground tabular-nums">
									~{(Number(amount) / price).toFixed(8)} {asset}
								</p>
							)}
							<button
								type="button"
								className="ml-auto text-xs text-primary hover:underline"
								onClick={() => setAmount(String(phpBalance))}
							>
								Avail: ₱{fmtPrice(phpBalance)}
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-2">
						<Label htmlFor="qty">Quantity ({asset})</Label>
						<Input
							id="qty"
							type="number"
							step="any"
							min="0"
							placeholder="0.00000000"
							value={qty}
							onChange={(e) => setQty(e.target.value)}
						/>
						<div className="flex items-center justify-between">
							{Number(qty) > 0 && price > 0 && (
								<p className="text-xs text-muted-foreground tabular-nums">
									~₱{fmtPrice(Number(qty) * price)}
								</p>
							)}
							<button
								type="button"
								className="ml-auto text-xs text-primary hover:underline"
								onClick={() => setQty(String(balance))}
							>
								Max: {balance}
							</button>
						</div>
					</div>
				)
			) : (
				<>
					<div className="space-y-2">
						<Label htmlFor="limit-price">Price (PHP)</Label>
						<Input
							id="limit-price"
							type="number"
							step="any"
							min="0"
							placeholder="0.00"
							value={limitPrice}
							onChange={(e) => setLimitPrice(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="limit-qty">Quantity ({asset})</Label>
						<Input
							id="limit-qty"
							type="number"
							step="any"
							min="0"
							placeholder="0.00000000"
							value={qty}
							onChange={(e) => setQty(e.target.value)}
						/>
						{!isBuy && (
							<button
								type="button"
								className="text-xs text-primary hover:underline"
								onClick={() => setQty(String(balance))}
							>
								Max: {balance}
							</button>
						)}
					</div>
					{Number(qty) > 0 && Number(limitPrice) > 0 && (
						<p className="text-xs text-muted-foreground tabular-nums">
							Total: ₱{fmtPrice(Number(qty) * Number(limitPrice))}
						</p>
					)}
					{isBuy && (
						<p className="text-xs text-muted-foreground tabular-nums">
							Available: ₱{fmtPrice(phpBalance)}
						</p>
					)}
				</>
			)}

			{mutation.error && (
				<p className="text-sm text-destructive">{mutation.error.message}</p>
			)}

			<Button
				type="submit"
				disabled={!isValid || mutation.isPending}
				className={isBuy ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
			>
				{mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
				{isBuy ? "Buy" : "Sell"} {asset}
			</Button>
		</form>
	);
}
