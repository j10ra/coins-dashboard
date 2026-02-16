import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, X } from "lucide-react";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { openOrderQueries, useCancelOrder } from "@/lib/queries/open-orders";

export const Route = createFileRoute("/_authenticated/orders")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(openOrderQueries.all()),
	component: OrdersPage,
});

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

function OrdersPage() {
	const { data: orders } = useSuspenseQuery(openOrderQueries.all());
	const cancel = useCancelOrder();

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<Card>
				<CardHeader>
					<CardTitle>Open Orders</CardTitle>
					<CardDescription>
						{orders.length} open order{orders.length !== 1 && "s"}
					</CardDescription>
				</CardHeader>
				<CardContent className="px-0">
					{orders.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Symbol</TableHead>
									<TableHead>Side</TableHead>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">Price</TableHead>
									<TableHead className="text-right">Qty</TableHead>
									<TableHead className="text-right">Filled</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="pr-6" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((o) => (
									<TableRow key={o.orderId}>
										<TableCell className="pl-6 font-medium">
											{o.symbol}
										</TableCell>
										<TableCell>
											<Badge
												variant={o.side === "BUY" ? "default" : "secondary"}
											>
												{o.side}
											</Badge>
										</TableCell>
										<TableCell>{o.type}</TableCell>
										<TableCell className="text-right tabular-nums">
											₱{fmtNum(o.price, 2)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{fmtNum(o.origQty)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{fmtNum(o.executedQty)}
										</TableCell>
										<TableCell>
											<Badge variant="outline">{o.status}</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{fmtDate(o.time)}
										</TableCell>
										<TableCell className="pr-6">
											<CancelButton
												orderId={o.orderId}
												cancel={cancel}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<p className="px-6 text-sm text-muted-foreground">
							No open orders.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function CancelButton({
	orderId,
	cancel,
}: {
	orderId: number;
	cancel: ReturnType<typeof useCancelOrder>;
}) {
	const isPending =
		cancel.isPending &&
		cancel.variables?.data?.orderId === orderId;

	return (
		<Button
			variant="ghost"
			size="icon"
			className="size-7"
			disabled={isPending}
			onClick={() => cancel.mutate({ data: { orderId } })}
		>
			{isPending ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<X className="size-4" />
			)}
		</Button>
	);
}
