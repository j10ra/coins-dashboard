import { createHmac } from "node:crypto";

const BASE_URL = "https://api.pro.coins.ph";

export interface CoinsCredentials {
	apiKey: string;
	secretKey: string;
}

function sign(queryString: string, secretKey: string): string {
	return createHmac("sha256", secretKey).update(queryString).digest("hex");
}

function assertNoApiError(data: unknown): void {
	if (data && typeof data === "object" && "code" in data && "msg" in data) {
		const err = data as { code: number; msg: string };
		if (err.code < 0) {
			throw new Error(`Coins API error ${err.code}: ${err.msg}`);
		}
	}
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

	const data = await res.json();
	assertNoApiError(data);
	return data as T;
}

export async function coinsPost<T>(
	path: string,
	credentials: CoinsCredentials,
	params: Record<string, string> = {},
): Promise<T> {
	const timestamp = Date.now().toString();
	const body = new URLSearchParams({ ...params, timestamp });
	const signature = sign(body.toString(), credentials.secretKey);
	body.set("signature", signature);

	const res = await fetch(`${BASE_URL}${path}`, {
		method: "POST",
		headers: {
			"X-COINS-APIKEY": credentials.apiKey,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Coins API ${res.status}: ${text}`);
	}

	const data = await res.json();
	assertNoApiError(data);
	return data as T;
}

export async function coinsPut<T>(
	path: string,
	credentials: CoinsCredentials,
	params: Record<string, string> = {},
): Promise<T> {
	const timestamp = Date.now().toString();
	const body = new URLSearchParams({ ...params, timestamp });
	const signature = sign(body.toString(), credentials.secretKey);
	body.set("signature", signature);

	const res = await fetch(`${BASE_URL}${path}`, {
		method: "PUT",
		headers: {
			"X-COINS-APIKEY": credentials.apiKey,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Coins API ${res.status}: ${text}`);
	}

	const putData = await res.json();
	assertNoApiError(putData);
	return putData as T;
}

export async function coinsDelete(
	path: string,
	credentials: CoinsCredentials,
	params: Record<string, string> = {},
): Promise<void> {
	const timestamp = Date.now().toString();
	const body = new URLSearchParams({ ...params, timestamp });
	const signature = sign(body.toString(), credentials.secretKey);
	body.set("signature", signature);

	const res = await fetch(`${BASE_URL}${path}`, {
		method: "DELETE",
		headers: {
			"X-COINS-APIKEY": credentials.apiKey,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: body.toString(),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Coins API ${res.status}: ${text}`);
	}
}

export async function coinsPublicGet<T>(
	path: string,
	params: Record<string, string> = {},
): Promise<T> {
	const searchParams = new URLSearchParams(params);
	const res = await fetch(`${BASE_URL}${path}?${searchParams}`);

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Coins API ${res.status}: ${body}`);
	}

	const pubData = await res.json();
	assertNoApiError(pubData);
	return pubData as T;
}
