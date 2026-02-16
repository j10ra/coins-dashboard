import { createMiddleware } from "@tanstack/react-start";
import { getSession } from "@/lib/session.server";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const user = await getSession();

	return next({
		context: { user },
	});
});
