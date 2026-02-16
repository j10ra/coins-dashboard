import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coinsDelete, coinsGet, coinsPost } from "@/lib/coins.server";
import { getUserCredentials } from "@/lib/credentials.server";
import { requireAuthMiddleware } from "@/middleware/requireAuth";

export interface OrderFill {
	price: string;
	qty: string;
	commission: string;
	commissionAsset: string;
}

export interface OrderResponse {
	symbol: string;
	orderId: number;
	clientOrderId: string;
	transactTime: number;
	price?: string;
	origQty?: string;
	executedQty?: string;
	cummulativeQuoteQty?: string;
	status?: string;
	timeInForce?: string;
	type?: string;
	side?: string;
	fills?: OrderFill[];
}

const orderSchema = z.object({
	symbol: z.string().min(1),
	side: z.enum(["BUY", "SELL"]),
	type: z.enum(["MARKET", "LIMIT"]),
	quantity: z.string().optional(),
	quoteOrderQty: z.string().optional(),
	price: z.string().optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.inputValidator(orderSchema)
	.handler(async ({ context, data }) => {
		const credentials = await getUserCredentials(context.user.id);

		const params: Record<string, string> = {
			symbol: data.symbol,
			side: data.side,
			type: data.type,
		};

		if (data.type === "MARKET") {
			if (data.side === "BUY" && data.quoteOrderQty) {
				params.quoteOrderQty = data.quoteOrderQty;
			} else if (data.quantity) {
				params.quantity = data.quantity;
			}
		} else {
			if (data.quantity) params.quantity = data.quantity;
			if (data.price) params.price = data.price;
			params.timeInForce = "GTC";
		}

		return coinsPost<OrderResponse>(
			"/openapi/v1/order",
			credentials,
			params,
		);
	});

export interface OpenOrder {
	symbol: string;
	orderId: number;
	price: string;
	origQty: string;
	executedQty: string;
	cummulativeQuoteQty: string;
	status: string;
	timeInForce: string;
	type: string;
	side: string;
	time: number;
	isWorking: boolean;
}

export const getOpenOrders = createServerFn({ method: "GET" })
	.middleware([requireAuthMiddleware])
	.handler(async ({ context }) => {
		const credentials = await getUserCredentials(context.user.id);
		return coinsGet<OpenOrder[]>("/openapi/v1/openOrders", credentials);
	});

const cancelOrderSchema = z.object({
	orderId: z.number(),
});

export const cancelOrder = createServerFn({ method: "POST" })
	.middleware([requireAuthMiddleware])
	.inputValidator(cancelOrderSchema)
	.handler(async ({ context, data }) => {
		const credentials = await getUserCredentials(context.user.id);
		return coinsDelete("/openapi/v1/order", credentials, {
			orderId: String(data.orderId),
		});
	});
