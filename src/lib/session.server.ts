import { createSupabaseServer } from "./supabase.server";

export interface SessionUser {
	id: string;
	email: string;
}

export async function getSession(): Promise<SessionUser | null> {
	const supabase = createSupabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) return null;

	return { id: user.id, email: user.email };
}
