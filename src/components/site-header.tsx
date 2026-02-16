import { useMatches } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function usePageTitle() {
	const matches = useMatches();
	const last = matches[matches.length - 1];
	const asset = (last.params as Record<string, string>).asset;
	return asset ?? "Dashboard";
}

export function SiteHeader() {
	const title = usePageTitle();
	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-2 h-4!" />
			<h1 className="text-base font-medium">{title}</h1>
		</header>
	);
}
