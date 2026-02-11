import type { Request, Response, NextFunction } from "../../imports.ts";

export function errorHandler(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	console.error("Error:", err);

	const isDev = Deno.env.get("DENO_ENV") === "development";

	res.status(500).json({
		error: "Internal server error",
		...(isDev && { message: err.message, stack: err.stack })
	});
}
