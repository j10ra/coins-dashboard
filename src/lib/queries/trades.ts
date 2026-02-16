import { queryOptions } from "@tanstack/react-query";
import { getTrades } from "@/server/trade.functions";

const keys = {
	all: ["trades"] as const,
	bySymbol: (symbol: string) => [...keys.all, symbol] as const,
};

export const tradeQueries = {
	bySymbol: (symbol: string) =>
		queryOptions({
			queryKey: keys.bySymbol(symbol),
			queryFn: () => getTrades({ data: { symbol } }),
			staleTime: 2 * 60 * 1000,
		}),
};
