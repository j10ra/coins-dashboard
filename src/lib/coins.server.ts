import { createHmac } from "node:crypto";

const BASE_URL = "https://api.pro.coins.ph";

export interface CoinsCredentials {
	apiKey: string;
	secretKey: string;
}

function sign(queryString: string, secretKey: string): string {
	return createHmac("sha256", secretKey).update(queryString).digest("hex");
}

export async function coinsGet<T>(
	path: string,
	credentials: CoinsCredentials,
	params: Record<string, string> = {},
): Promise<T> {
	const timestamp = Date.now().toString();
	const searchParams = new URLSearchParams({ ...params, timestamp });
	const queryString = searchParams.toString();
	const signature = sign(queryString, credentials.secretKey);
	searchParams.set("signature", signature);

	const res = await fetch(`${BASE_URL}${path}?${searchParams}`, {
		headers: { "X-COINS-APIKEY": credentials.apiKey },
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Coins API ${res.status}: ${body}`);
	}

	return res.json() as Promise<T>;
}
