import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./auth";

export const requireAuthMiddleware = createMiddleware()
	.middleware([authMiddleware])
	.server(async ({ next, context }) => {
		if (!context.user) {
			throw redirect({ to: "/login" });
		}

		return next({
			context: { user: context.user },
		});
	});
