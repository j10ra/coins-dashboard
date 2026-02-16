import type { LucideIcon } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
};

export function NavSecondary({
	items,
	extra,
	...props
}: {
	items: NavItem[];
	extra?: React.ReactNode;
} & React.ComponentProps<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild>
								<a href={item.url}>
									<item.icon />
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
					{extra && <SidebarMenuItem>{extra}</SidebarMenuItem>}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
