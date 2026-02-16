import { queryOptions } from "@tanstack/react-query";
import { hasKeys } from "@/server/keys.functions";

const keyKeys = {
	all: ["keys"] as const,
	status: () => [...keyKeys.all, "status"] as const,
};

export const keyQueries = {
	status: () =>
		queryOptions({
			queryKey: keyKeys.status(),
			queryFn: () => hasKeys(),
			staleTime: Number.POSITIVE_INFINITY,
		}),
};
