import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CoinsCredentials } from "@/lib/coins.server";
import { coinsGet, coinsPost } from "@/lib/coins.server";
import { getUserCredentials } from "@/lib/credentials.server";
import { requireAuthMiddleware } from "@/middleware/requireAuth";

export interface Trade {
	symbol: string;
	id: number;
	orderId: number;
	price: string;
	qty: string;
	quoteQty: string;
	commission: string;
	commissionAsset: string;
	time: number;
	isBuyer: boolean;
	isMaker: boolean;
	isBestMatch: boolean;
	source: "exchange" | "convert";
}

interface RawTrade {
	symbol: string;
	id: number;
	orderId: number;
	price: string;
	qty: string;
	quoteQty: string;
	commission: string;
	commissionAsset: string;
	time: number;
	isBuyer: boolean;
	isMaker: boolean;
	isBestMatch: boolean;
}

interface ConvertOrder {
	id: string;
	orderId: string;
	sourceCurrency: string;
	targetCurrency: string;
	sourceAmount: string;
	targetAmount: string;
	price: string;
	inversePrice: string;
	status: string;
	createdAt: string;
}

interface ConvertResponse {
	status: number;
	data: ConvertOrder[];
	total: number;
}

async function fetchExchangeTrades(
	symbol: string,
	credentials: CoinsCredentials,
): Promise<Trade[]> {
	const batch = await coinsGet<RawTrade[]>(
		"/openapi/v1/myTrades",
		credentials,
		{ symbol, limit: "1000" },
	);
	return batch.map((t) => ({ ...t, source: "exchange" as const }));
}

function toConvertTrade(c: ConvertOrder, asset: string): Trade | null {
	const isBuy = c.targetCurrency === asset && c.sourceCurrency === "PHP";
	const isSell = c.sourceCurrency === asset && c.targetCurrency === "PHP";
	if (!isBuy && !isSell) return null;

	const qty = isBuy ? c.targetAmount : c.sourceAmount;
	const phpAmount = isBuy ? c.sourceAmount : c.targetAmount;
	// Buy (PHP→asset): inversePrice = asset/PHP (added Apr 2024), fallback to computing from amounts
	// Sell (asset→PHP): price = PHP/asset
	const price = isBuy
		? (c.inversePrice ?? String(Number(c.sourceAmount) / Number(c.targetAmount)))
		: c.price;

	return {
		symbol: `${asset}PHP`,
		id: Number(c.orderId) || Number(c.createdAt),
		orderId: Number(c.orderId) || 0,
		price,
		qty,
		quoteQty: phpAmount,
		commission: "0",
		commissionAsset: "PHP",
		time: Number(c.createdAt),
		isBuyer: isBuy,
		isMaker: false,
		isBestMatch: false,
		source: "convert",
	};
}

async function fetchConvertTrades(
	asset: string,
	credentials: CoinsCredentials,
): Promise<Trade[]> {
	const all: Trade[] = [];
	const SIZE = "200";
	let page = 1;

	while (true) {
		const res = await coinsPost<ConvertResponse>(
			"/openapi/convert/v1/query-order-history",
			credentials,
			{ page: String(page), size: SIZE, status: "SUCCESS" },
		);

		if (!res.data || res.data.length === 0) break;

		for (const c of res.data) {
			const trade = toConvertTrade(c, asset);
			if (trade) all.push(trade);
		}

		if (res.data.length < Number(SIZE)) break;
		page++;
	}

	return all;
}

const tradesSchema = z.object({
	symbol: z.string().min(1),
});

export const getTrades = createServerFn({ method: "GET" })
	.middleware([requireAuthMiddleware])
	.inputValidator(tradesSchema)
	.handler(async ({ context, data }) => {
		const credentials = await getUserCredentials(context.user.id);
		const asset = data.symbol.replace("PHP", "");

		const [exchange, convert] = await Promise.all([
			fetchExchangeTrades(data.symbol, credentials),
			fetchConvertTrades(asset, credentials),
		]);

		const all = [...exchange, ...convert];
		return all.sort((a, b) => b.time - a.time);
	});
