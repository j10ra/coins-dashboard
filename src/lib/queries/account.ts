import { queryOptions } from "@tanstack/react-query";
import { getAccount } from "@/server/account.functions";

const keys = {
	all: ["account"] as const,
	profile: () => [...keys.all, "profile"] as const,
};

export const accountQueries = {
	profile: () =>
		queryOptions({
			queryKey: keys.profile(),
			queryFn: () => getAccount(),
			staleTime: 2 * 60 * 1000,
		}),
};
