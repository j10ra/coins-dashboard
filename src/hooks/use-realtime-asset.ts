import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTickerSocket } from "@/hooks/use-ticker-socket";
import { useUserDataSocket } from "@/hooks/use-user-data-socket";

const FALLBACK_DELAY = 10_000;
const POLL_INTERVAL = 10_000;

export function useRealtimeAsset({ symbol }: { symbol: string }) {
	const { status: tickerStatus } = useTickerSocket({ symbol });
	const { status: userStatus } = useUserDataSocket();
	const queryClient = useQueryClient();
	const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pollingEnabled = useRef(false);

	const isLive = tickerStatus === "connected" && userStatus === "connected";

	useEffect(() => {
		if (userStatus === "error") {
			fallbackTimer.current = setTimeout(() => {
				pollingEnabled.current = true;
				queryClient.setQueryDefaults(["ticker", symbol], {
					refetchInterval: POLL_INTERVAL,
				});
				queryClient.setQueryDefaults(["account", "portfolio"], {
					refetchInterval: POLL_INTERVAL,
				});
			}, FALLBACK_DELAY);
		} else if (userStatus === "connected" && pollingEnabled.current) {
			pollingEnabled.current = false;
			queryClient.setQueryDefaults(["ticker", symbol], {
				refetchInterval: false,
			});
			queryClient.setQueryDefaults(["account", "portfolio"], {
				refetchInterval: false,
			});
		}

		return () => {
			if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
		};
	}, [userStatus, symbol, queryClient]);

	return { isLive };
}
