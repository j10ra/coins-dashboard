import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ThemeToggle() {
	const [dark, setDark] = useState(true);

	useEffect(() => {
		const stored = localStorage.getItem("theme");
		const isDark = stored ? stored === "dark" : true;
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);

	const toggle = () => {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	};

	return (
		<SidebarMenuButton onClick={toggle}>
			{dark ? <Sun /> : <Moon />}
			<span>{dark ? "Light mode" : "Dark mode"}</span>
		</SidebarMenuButton>
	);
}
