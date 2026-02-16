import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		ENCRYPTION_KEY: z.string().length(64),
		DATABASE_URL: z.string().url(),
	},

	clientPrefix: "VITE_",

	client: {
		VITE_SUPABASE_URL: z.string().url(),
		VITE_SUPABASE_ANON_KEY: z.string().min(1),
	},

	runtimeEnv: {
		...import.meta.env,
		...(typeof process !== "undefined" ? process.env : {}),
	},

	emptyStringAsUndefined: true,
});
