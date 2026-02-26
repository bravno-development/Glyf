if (!Deno.env.get("JWT_SECRET")) {
	throw new Error("JWT_SECRET environment variable is required");
}

export const JWT_SECRET = Deno.env.get("JWT_SECRET")!;
