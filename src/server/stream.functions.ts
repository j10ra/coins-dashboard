import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coinsDelete, coinsPost, coinsPut } from "@/lib/coins.server";
import { getUserCredentials } from "@/lib/credentials.server";
import { requireAuthMiddleware } from "@/middleware/requireAuth";

const listenKeySchema = z.object({ listenKey: z.string().min(1) });

export const createListenKey = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		const credentials = await getUserCredentials(context.user.id);
		return coinsPost<{ listenKey: string }>(
			"/openapi/v1/userDataStream",
			credentials,
		);
	});

export const refreshListenKey = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.inputValidator(listenKeySchema)
	.handler(async ({ context, data }) => {
		const credentials = await getUserCredentials(context.user.id);
		await coinsPut("/openapi/v1/userDataStream", credentials, {
			listenKey: data.listenKey,
		});
	});

export const deleteListenKey = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.inputValidator(listenKeySchema)
	.handler(async ({ context, data }) => {
		const credentials = await getUserCredentials(context.user.id);
		await coinsDelete("/openapi/v1/userDataStream", credentials, {
			listenKey: data.listenKey,
		});
	});
