import { express } from "../../imports.ts";
import {
	requestMagicLink,
	verifyMagicLink,
	refreshTokens,
	logout,
} from "../controllers/auth.controller.ts";
import { rateLimit } from "../middleware/rateLimit.ts";

export const authRoutes = express.Router();

const TEN_MINUTES_MS = 10 * 60 * 1000;

authRoutes.post("/request", rateLimit(5, TEN_MINUTES_MS), requestMagicLink);
authRoutes.post("/verify", rateLimit(10, TEN_MINUTES_MS), verifyMagicLink);
authRoutes.post("/refresh", refreshTokens);
authRoutes.post("/logout", logout);
