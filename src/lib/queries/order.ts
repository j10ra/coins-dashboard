import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeOrder } from "@/server/order.functions";

export function useCreateOrder(symbol: string) {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: placeOrder,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["account", "portfolio"] });
			qc.invalidateQueries({ queryKey: ["ticker", symbol] });
			qc.invalidateQueries({ queryKey: ["trades", symbol] });
		},
	});
}
