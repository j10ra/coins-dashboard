import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";

interface Encrypted {
	data: string;
	iv: string;
	tag: string;
}

function getKey(): Buffer {
	return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

export function encrypt(plaintext: string): Encrypted {
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, getKey(), iv);

	let data = cipher.update(plaintext, "utf8", "hex");
	data += cipher.final("hex");
	const tag = cipher.getAuthTag().toString("hex");

	return { data, iv: iv.toString("hex"), tag };
}

export function decrypt({ data, iv, tag }: Encrypted): string {
	const decipher = createDecipheriv(
		ALGORITHM,
		getKey(),
		Buffer.from(iv, "hex"),
	);
	decipher.setAuthTag(Buffer.from(tag, "hex"));

	let plaintext = decipher.update(data, "hex", "utf8");
	plaintext += decipher.final("utf8");

	return plaintext;
}
