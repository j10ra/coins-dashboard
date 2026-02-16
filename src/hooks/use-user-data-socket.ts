import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	createListenKey,
	deleteListenKey,
	refreshListenKey,
} from "@/server/stream.functions";

const WS_BASE = "wss://wsapi.pro.coins.ph/openapi/ws";
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 min
const MAX_BACKOFF = 30_000;

type Status = "connecting" | "connected" | "error";

export function useUserDataSocket() {
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<Status>("connecting");
	const wsRef = useRef<WebSocket | null>(null);
	const keyRef = useRef<string | null>(null);
	const retryRef = useRef(0);

	const updatePortfolioCache = useCallback(
		(balances: Array<{ a: string; f: string; l: string }>) => {
			queryClient.setQueryData(
				["account", "portfolio"],
				(
					prev:
						| {
								balances: Array<{
									asset: string;
									free: string;
									locked: string;
								}>;
								phpRates: Record<string, number>;
								totalPhp: number;
						  }
						| undefined,
				) => {
					if (!prev) return prev;

					const updated = prev.balances.map((b) => {
						const match = balances.find((u) => u.a === b.asset);
						return match ? { ...b, free: match.f, locked: match.l } : b;
					});

					// add new assets not in the existing balances
					for (const u of balances) {
						if (!updated.some((b) => b.asset === u.a)) {
							updated.push({ asset: u.a, free: u.f, locked: u.l });
						}
					}

					let totalPhp = 0;
					for (const b of updated) {
						const amount = Number(b.free) + Number(b.locked);
						if (b.asset === "PHP") {
							totalPhp += amount;
						} else {
							const rate = prev.phpRates[`${b.asset}PHP`] ?? 0;
							totalPhp += amount * rate;
						}
					}

					return { ...prev, balances: updated, totalPhp };
				},
			);
		},
		[queryClient],
	);

	useEffect(() => {
		let alive = true;
		let refreshTimer: ReturnType<typeof setInterval>;
		let retryTimer: ReturnType<typeof setTimeout>;

		async function connect() {
			if (!alive) return;

			try {
				const { listenKey } = await createListenKey();
				if (!alive) return;
				keyRef.current = listenKey;

				const ws = new WebSocket(`${WS_BASE}/${listenKey}`);
				wsRef.current = ws;

				ws.onopen = () => {
					retryRef.current = 0;
					setStatus("connected");

					refreshTimer = setInterval(async () => {
						try {
							if (keyRef.current) {
								await refreshListenKey({
									data: { listenKey: keyRef.current },
								});
							}
						} catch {
							// refresh failed — WS will eventually disconnect and reconnect
						}
					}, REFRESH_INTERVAL);
				};

				ws.onmessage = (ev) => {
					try {
						const msg = JSON.parse(ev.data);
						if (msg.e === "outboundAccountPosition" && msg.B) {
							updatePortfolioCache(msg.B);
						}
					} catch {
						// ignore malformed messages
					}
				};

				ws.onclose = () => {
					clearInterval(refreshTimer);
					if (!alive) return;
					setStatus("error");
					const delay = Math.min(1000 * 2 ** retryRef.current, MAX_BACKOFF);
					retryRef.current++;
					retryTimer = setTimeout(connect, delay);
				};

				ws.onerror = () => ws.close();
			} catch {
				if (!alive) return;
				setStatus("error");
				const delay = Math.min(1000 * 2 ** retryRef.current, MAX_BACKOFF);
				retryRef.current++;
				retryTimer = setTimeout(connect, delay);
			}
		}

		connect();

		return () => {
			alive = false;
			clearInterval(refreshTimer);
			clearTimeout(retryTimer);
			wsRef.current?.close();

			// fire-and-forget cleanup
			if (keyRef.current) {
				deleteListenKey({ data: { listenKey: keyRef.current } }).catch(
					() => {},
				);
			}
		};
	}, [updatePortfolioCache]);

	return { status };
}
