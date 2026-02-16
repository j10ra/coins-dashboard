import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type { CoinsCredentials } from "@/lib/coins.server";
import { coinsGet } from "@/lib/coins.server";
import { decrypt } from "@/lib/crypto.server";
import { db } from "@/lib/db";
import { userKeys } from "@/lib/db/schema";
import { requireAuthMiddleware } from "@/middleware/requireAuth";

interface Balance {
	asset: string;
	free: string;
	locked: string;
}

export interface AccountInfo {
	accountType: string;
	balances: Balance[];
	canDeposit: boolean;
	canTrade: boolean;
	canWithdraw: boolean;
	updateTime: number;
}

async function getUserCredentials(userId: string): Promise<CoinsCredentials> {
	const row = await db
		.select({
			encryptedApiKey: userKeys.encryptedApiKey,
			apiKeyIv: userKeys.apiKeyIv,
			apiKeyTag: userKeys.apiKeyTag,
			encryptedSecret: userKeys.encryptedSecret,
			secretIv: userKeys.secretIv,
			secretTag: userKeys.secretTag,
		})
		.from(userKeys)
		.where(eq(userKeys.userId, userId))
		.then((rows) => rows[0]);

	if (!row) throw new Error("API keys not configured");

	return {
		apiKey: decrypt({
			data: row.encryptedApiKey,
			iv: row.apiKeyIv,
			tag: row.apiKeyTag,
		}),
		secretKey: decrypt({
			data: row.encryptedSecret,
			iv: row.secretIv,
			tag: row.secretTag,
		}),
	};
}

export const getAccount = createServerFn({ method: "GET" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		const credentials = await getUserCredentials(context.user.id);
		return coinsGet<AccountInfo>("/openapi/v1/account", credentials);
	});
