import { Pool } from "../../imports.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not set");
}

export const pool = new Pool(DATABASE_URL, 10, true);

export async function query(text: string, params?: unknown[]) {
	const client = await pool.connect();
	try {
		const result = await client.queryObject(text, params);
		return result;
	} finally {
		client.release();
	}
}
