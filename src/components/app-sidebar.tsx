import {
	ArrowLeftRight,
	Coins,
	HelpCircle,
	KeyRound,
	LayoutDashboard,
	Settings,
} from "lucide-react";
import { type NavItem, NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const secondaryItems = [
	{ title: "Settings", url: "#", icon: Settings },
	{ title: "Help", url: "#", icon: HelpCircle },
];

export function AppSidebar({
	user,
	keysConfigured,
	...props
}: {
	user: { email: string };
	keysConfigured: boolean;
} & React.ComponentProps<typeof Sidebar>) {
	const navItems: NavItem[] = [
		{ title: "Dashboard", url: "/", icon: LayoutDashboard },
		...(keysConfigured
			? [{ title: "Orders", url: "/orders", icon: ArrowLeftRight }]
			: [{ title: "Setup Keys", url: "/setup-keys", icon: KeyRound }]),
	];

	return (
		<Sidebar collapsible="offcanvas" variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="/">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Coins className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">Coins.ph</span>
									<span className="truncate text-xs">Dashboard</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navItems} />
				<NavSecondary
					items={secondaryItems}
					className="mt-auto"
					extra={<ThemeToggle />}
				/>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
