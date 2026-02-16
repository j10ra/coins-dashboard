import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coinsPublicGet } from "@/lib/coins.server";

interface TickerPrice {
	symbol: string;
	price: string;
}

const symbolSchema = z.object({ symbol: z.string().min(1) });

export const getTickerPrice = createServerFn({ method: "GET" })
	.inputValidator(symbolSchema)
	.handler(async ({ data }) => {
		const ticker = await coinsPublicGet<TickerPrice>(
			"/openapi/quote/v1/ticker/price",
			{ symbol: data.symbol },
		);
		return { symbol: ticker.symbol, price: Number(ticker.price) };
	});

const klinesSchema = z.object({
	symbol: z.string().min(1),
	interval: z.string(),
	startTime: z.string(),
	limit: z.string(),
});

type KlineRaw = [
	number, // openTime
	string, // open
	string, // high
	string, // low
	string, // close
	...unknown[],
];

export const getKlines = createServerFn({ method: "GET" })
	.inputValidator(klinesSchema)
	.handler(async ({ data }) => {
		const raw = await coinsPublicGet<KlineRaw[]>(
			"/openapi/quote/v1/klines",
			data,
		);
		return raw.map((k) => ({ time: k[0], price: Number(k[4]) }));
	});
