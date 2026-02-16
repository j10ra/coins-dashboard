import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

const WS_BASE = "wss://wsapi.pro.coins.ph/openapi/quote/ws/v3";
const PING_INTERVAL = 4.5 * 60 * 1000; // 4.5 min
const MAX_BACKOFF = 30_000;

type Status = "connecting" | "connected" | "error";

export function useTickerSocket({ symbol }: { symbol: string }) {
	const queryClient = useQueryClient();
	const wsRef = useRef<WebSocket | null>(null);
	const retryRef = useRef(0);
	const [status, setStatus] = useState<Status>("connecting");

	useEffect(() => {
		let alive = true;
		let pingTimer: ReturnType<typeof setInterval>;
		let retryTimer: ReturnType<typeof setTimeout>;

		function connect() {
			if (!alive) return;

			const stream = `${symbol.toLowerCase()}@miniTicker`;
			const ws = new WebSocket(`${WS_BASE}/${stream}`);
			wsRef.current = ws;

			ws.onopen = () => {
				retryRef.current = 0;
				setStatus("connected");
				pingTimer = setInterval(() => {
					if (ws.readyState === WebSocket.OPEN) ws.send("ping");
				}, PING_INTERVAL);
			};

			ws.onmessage = (ev) => {
				if (ev.data === "pong") return;
				try {
					const msg = JSON.parse(ev.data);
					if (msg.e === "24hrMiniTicker" && msg.c) {
						queryClient.setQueryData(["ticker", symbol], {
							symbol,
							price: Number(msg.c),
						});
					}
				} catch {
					// ignore malformed messages
				}
			};

			ws.onclose = () => {
				clearInterval(pingTimer);
				if (!alive) return;
				setStatus("error");
				const delay = Math.min(1000 * 2 ** retryRef.current, MAX_BACKOFF);
				retryRef.current++;
				retryTimer = setTimeout(connect, delay);
			};

			ws.onerror = () => ws.close();
		}

		connect();

		return () => {
			alive = false;
			clearInterval(pingTimer);
			clearTimeout(retryTimer);
			wsRef.current?.close();
		};
	}, [symbol, queryClient]);

	return { status };
}
