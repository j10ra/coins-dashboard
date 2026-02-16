import { queryOptions } from "@tanstack/react-query";
import { getKlines, getTickerPrice } from "@/server/ticker.functions";

const keys = {
	all: ["ticker"] as const,
	price: (symbol: string) => [...keys.all, symbol] as const,
	klines: (symbol: string, days: number) =>
		[...keys.all, symbol, "klines", days] as const,
};

const INTERVALS: Record<string, number> = { "1d": 1, "3d": 3, "1w": 7 };

function klinesParams(days: number) {
	const interval = days <= 365 ? "1d" : days <= 730 ? "3d" : "1w";
	const limit = days > 0 ? Math.ceil(days / INTERVALS[interval]) : 1000;
	return { interval, limit: limit.toString() };
}

export const tickerQueries = {
	price: (symbol: string) =>
		queryOptions({
			queryKey: keys.price(symbol),
			queryFn: () => getTickerPrice({ data: { symbol } }),
			staleTime: 60_000,
		}),

	klines: (symbol: string, days: number) =>
		queryOptions({
			queryKey: keys.klines(symbol, days),
			queryFn: () => {
				const { interval, limit } = klinesParams(days);
				const startTime =
					days > 0 ? (Date.now() - days * 24 * 60 * 60 * 1000).toString() : "0";
				return getKlines({
					data: { symbol, interval, startTime, limit },
				});
			},
			staleTime: 5 * 60_000,
		}),
};
