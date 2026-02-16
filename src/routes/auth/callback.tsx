import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServer } from "@/lib/supabase.server";

const exchangeCodeFn = createServerFn({ method: "GET" }).handler(async () => {
	const url = new URL(
		(await import("@tanstack/react-start/server")).getRequestUrl(),
	);
	const code = url.searchParams.get("code");
	const next = url.searchParams.get("next") ?? "/";

	if (code) {
		const supabase = createSupabaseServer();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) throw new Error("Auth failed");
	}

	throw redirect({ href: next });
});

export const Route = createFileRoute("/auth/callback")({
	beforeLoad: () => exchangeCodeFn(),
});
