import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/session.server";
import { createSupabaseServer } from "@/lib/supabase.server";
import { hasKeys } from "@/server/keys.functions";

const getUser = createServerFn({ method: "GET" }).handler(async () => {
	try {
		return await getSession();
	} catch {
		return null;
	}
});

const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const supabase = createSupabaseServer();
	await supabase.auth.signOut();
});

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location }) => {
		const user = await getUser();

		if (!user) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		const { configured } = await hasKeys();

		if (!configured && location.pathname !== "/setup-keys") {
			throw redirect({ to: "/setup-keys" });
		}

		if (configured && location.pathname === "/setup-keys") {
			throw redirect({ to: "/" });
		}

		return { user, keysConfigured: configured };
	},
	component: AuthenticatedLayout,
	pendingComponent: WorkspaceLoader,
});

function WorkspaceLoader() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-500" />
				<p className="text-sm text-slate-400">Loading workspace...</p>
			</div>
		</div>
	);
}

function AuthenticatedLayout() {
	const { user } = Route.useRouteContext();
	const router = useRouter();

	const handleLogout = async () => {
		await logoutFn();
		router.navigate({ to: "/login" });
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<header className="border-b border-slate-700/50 px-6 py-3">
				<div className="mx-auto flex max-w-3xl items-center justify-between">
					<span className="text-sm font-medium text-slate-300">{user.email}</span>
					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
					>
						<LogOut className="h-4 w-4" />
						Logout
					</button>
				</div>
			</header>
			<Outlet />
		</div>
	);
}
