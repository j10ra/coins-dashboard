import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { encrypt } from "@/lib/crypto.server";
import { db } from "@/lib/db";
import { userKeys } from "@/lib/db/schema";
import { requireAuthMiddleware } from "@/middleware/requireAuth";

const keysSchema = z.object({
	apiKey: z.string().min(1),
	secretKey: z.string().min(1),
});

export const saveKeys = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.inputValidator(keysSchema)
	.handler(async ({ data, context }) => {
		const encApiKey = encrypt(data.apiKey);
		const encSecret = encrypt(data.secretKey);

		await db
			.insert(userKeys)
			.values({
				userId: context.user.id,
				encryptedApiKey: encApiKey.data,
				apiKeyIv: encApiKey.iv,
				apiKeyTag: encApiKey.tag,
				encryptedSecret: encSecret.data,
				secretIv: encSecret.iv,
				secretTag: encSecret.tag,
			})
			.onConflictDoUpdate({
				target: userKeys.userId,
				set: {
					encryptedApiKey: encApiKey.data,
					apiKeyIv: encApiKey.iv,
					apiKeyTag: encApiKey.tag,
					encryptedSecret: encSecret.data,
					secretIv: encSecret.iv,
					secretTag: encSecret.tag,
					updatedAt: new Date(),
				},
			});

		return { success: true };
	});

export const hasKeys = createServerFn({ method: "GET" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		const rows = await db
			.select({ userId: userKeys.userId })
			.from(userKeys)
			.where(eq(userKeys.userId, context.user.id))
			.limit(1);

		return { configured: rows.length > 0 };
	});

export const deleteKeys = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		await db.delete(userKeys).where(eq(userKeys.userId, context.user.id));
		return { success: true };
	});
