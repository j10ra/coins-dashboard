import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session.server";
import { hasKeys } from "@/server/keys.functions";

const getUser = createServerFn({ method: "GET" }).handler(async () => {
	try {
		return await getSession();
	} catch {
		return null;
	}
});

let cachedAuth: {
	user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
	keysConfigured: boolean;
} | null = null;

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location }) => {
		if (cachedAuth) return cachedAuth;

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

		cachedAuth = { user, keysConfigured: configured };
		return cachedAuth;
	},
	component: AuthenticatedLayout,
	pendingComponent: WorkspaceLoader,
});

function WorkspaceLoader() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
				<p className="text-sm text-muted-foreground">Loading workspace...</p>
			</div>
		</div>
	);
}

function AuthenticatedLayout() {
	const { user, keysConfigured } = Route.useRouteContext();

	return (
		<SidebarProvider
			defaultOpen={true}
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
				} as React.CSSProperties
			}
		>
			<AppSidebar user={user} keysConfigured={keysConfigured} />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
