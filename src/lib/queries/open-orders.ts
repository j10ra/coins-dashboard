import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, getOpenOrders } from "@/server/order.functions";

const keys = {
	all: ["openOrders"] as const,
};

export const openOrderQueries = {
	all: () =>
		queryOptions({
			queryKey: keys.all,
			queryFn: () => getOpenOrders(),
			staleTime: 30 * 1000,
		}),
};

export function useCancelOrder() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: cancelOrder,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.all });
			qc.invalidateQueries({ queryKey: ["account", "portfolio"] });
		},
	});
}
