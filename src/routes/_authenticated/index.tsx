import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { accountQueries } from "@/lib/queries/account";

export const Route = createFileRoute("/_authenticated/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(accountQueries.portfolio()),
	component: Dashboard,
});

function fmtPhp(value: number) {
	return value.toLocaleString("en-PH", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function fmtCrypto(value: string) {
	const n = Number(value);
	if (n === 0) return "0.00";
	return n.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	});
}

function Dashboard() {
	const { data: portfolio } = useSuspenseQuery(accountQueries.portfolio());

	const nonZeroBalances = portfolio.balances
		.filter((b) => Number(b.free) > 0 || Number(b.locked) > 0)
		.sort((a, b) => Number(b.free) - Number(a.free));

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<Card>
				<CardHeader>
					<CardDescription>Estimated Portfolio Value</CardDescription>
					<CardTitle className="text-3xl font-bold tabular-nums">
						₱{fmtPhp(portfolio.totalPhp)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2">
						<Badge variant={portfolio.canTrade ? "default" : "secondary"}>
							Trading {portfolio.canTrade ? "On" : "Off"}
						</Badge>
						<Badge variant={portfolio.canDeposit ? "default" : "secondary"}>
							Deposits {portfolio.canDeposit ? "On" : "Off"}
						</Badge>
						<Badge variant={portfolio.canWithdraw ? "default" : "secondary"}>
							Withdrawals {portfolio.canWithdraw ? "On" : "Off"}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Balances</CardTitle>
					<CardDescription>
						{nonZeroBalances.length} asset
						{nonZeroBalances.length !== 1 && "s"} with funds
					</CardDescription>
				</CardHeader>
				<CardContent className="px-0">
					{nonZeroBalances.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Asset</TableHead>
									<TableHead className="text-right">Available</TableHead>
									<TableHead className="text-right">Locked</TableHead>
									<TableHead className="text-right pr-6">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{nonZeroBalances.map((b) => {
									const total = Number(b.free) + Number(b.locked);
									const isPhp = b.asset === "PHP";
									const row = (
										<TableRow
											key={b.asset}
											className={isPhp ? "" : "cursor-pointer"}
										>
											<TableCell className="pl-6 font-medium">
												<div className="flex items-center gap-2">
													<Wallet className="size-4 text-muted-foreground" />
													{b.asset}
												</div>
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{fmtCrypto(b.free)}
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{fmtCrypto(b.locked)}
											</TableCell>
											<TableCell className="text-right pr-6 tabular-nums">
												<div className="flex items-center justify-end gap-2">
													<span className="font-medium">
														{fmtCrypto(String(total))}
													</span>
													{!isPhp && (
														<ChevronRight className="size-4 text-muted-foreground" />
													)}
												</div>
											</TableCell>
										</TableRow>
									);
									if (isPhp) return row;
									return (
										<Link
											key={b.asset}
											to="/asset/$asset"
											params={{ asset: b.asset }}
											className="contents"
										>
											{row}
										</Link>
									);
								})}
							</TableBody>
						</Table>
					) : (
						<p className="px-6 text-sm text-muted-foreground">
							No balances found.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
