import { createServerFn } from "@tanstack/react-start";
import { coinsGet, coinsPublicGet } from "@/lib/coins.server";
import { getUserCredentials } from "@/lib/credentials.server";
import { requireAuthMiddleware } from "@/middleware/requireAuth";

interface Balance {
	asset: string;
	free: string;
	locked: string;
}

export interface AccountInfo {
	accountType: string;
	balances: Balance[];
	canDeposit: boolean;
	canTrade: boolean;
	canWithdraw: boolean;
	updateTime: number;
}

export const getAccount = createServerFn({ method: "GET" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		const credentials = await getUserCredentials(context.user.id);
		return coinsGet<AccountInfo>("/openapi/v1/account", credentials);
	});

interface TickerPrice {
	symbol: string;
	price: string;
}

export const getPortfolio = createServerFn({ method: "GET" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		const credentials = await getUserCredentials(context.user.id);
		const account = await coinsGet<AccountInfo>(
			"/openapi/v1/account",
			credentials,
		);

		const nonZero = account.balances.filter(
			(b) => Number(b.free) > 0 || Number(b.locked) > 0,
		);

		const phpBal = nonZero.find((b) => b.asset === "PHP");
		let totalPhp = phpBal
			? Number(phpBal.free) + Number(phpBal.locked)
			: 0;

		const cryptoAssets = nonZero.filter((b) => b.asset !== "PHP");
		const phpRates: Record<string, number> = {};

		if (cryptoAssets.length > 0) {
			const symbols = cryptoAssets.map((b) => `${b.asset}PHP`);
			const prices = await coinsPublicGet<TickerPrice[]>(
				"/openapi/quote/v1/ticker/price",
				{ symbols: JSON.stringify(symbols) },
			);

			for (const p of prices) {
				phpRates[p.symbol] = Number(p.price);
			}

			for (const b of cryptoAssets) {
				const rate = phpRates[`${b.asset}PHP`] ?? 0;
				totalPhp += (Number(b.free) + Number(b.locked)) * rate;
			}
		}

		return { ...account, totalPhp, phpRates };
	});
