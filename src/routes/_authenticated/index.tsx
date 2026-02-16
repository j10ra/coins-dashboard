import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { accountQueries } from "@/lib/queries/account";

export const Route = createFileRoute("/_authenticated/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(accountQueries.profile()),
	component: Dashboard,
});

function Dashboard() {
	const { data: account } = useSuspenseQuery(accountQueries.profile());
	const nonZeroBalances = account.balances.filter(
		(b) => Number(b.free) > 0 || Number(b.locked) > 0,
	);

	return (
		<div className="p-6">
			<div className="mx-auto max-w-3xl space-y-6">
				<h1 className="text-3xl font-bold text-white">Account</h1>

				<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
					<dl className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<dt className="text-slate-400">Type</dt>
							<dd className="text-white font-medium">{account.accountType}</dd>
						</div>
						<div>
							<dt className="text-slate-400">Trading</dt>
							<dd className="text-white font-medium">
								{account.canTrade ? "Enabled" : "Disabled"}
							</dd>
						</div>
						<div>
							<dt className="text-slate-400">Deposits</dt>
							<dd className="text-white font-medium">
								{account.canDeposit ? "Enabled" : "Disabled"}
							</dd>
						</div>
						<div>
							<dt className="text-slate-400">Withdrawals</dt>
							<dd className="text-white font-medium">
								{account.canWithdraw ? "Enabled" : "Disabled"}
							</dd>
						</div>
					</dl>
				</div>

				{nonZeroBalances.length > 0 && (
					<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
						<h2 className="mb-4 text-lg font-semibold text-white">Balances</h2>
						<table className="w-full text-sm">
							<thead>
								<tr className="text-slate-400 text-left">
									<th className="pb-2">Asset</th>
									<th className="pb-2 text-right">Available</th>
									<th className="pb-2 text-right">Locked</th>
								</tr>
							</thead>
							<tbody>
								{nonZeroBalances.map((b) => (
									<tr key={b.asset} className="border-t border-slate-700/50">
										<td className="py-2 font-medium text-white">{b.asset}</td>
										<td className="py-2 text-right text-slate-300">{b.free}</td>
										<td className="py-2 text-right text-slate-300">
											{b.locked}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{nonZeroBalances.length === 0 && (
					<p className="text-slate-400 text-center">No balances found.</p>
				)}
			</div>
		</div>
	);
}
