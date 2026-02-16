import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userKeys = pgTable("user_keys", {
	userId: uuid("user_id").primaryKey(),
	encryptedApiKey: text("encrypted_api_key").notNull(),
	apiKeyIv: text("api_key_iv").notNull(),
	apiKeyTag: text("api_key_tag").notNull(),
	encryptedSecret: text("encrypted_secret").notNull(),
	secretIv: text("secret_iv").notNull(),
	secretTag: text("secret_tag").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
