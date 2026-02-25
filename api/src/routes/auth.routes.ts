import { express } from "../../imports.ts";
import {
	requestMagicLink,
	verifyMagicLink,
	refreshTokens,
	logout,
} from "../controllers/auth.controller.ts";

export const authRoutes = express.Router();

authRoutes.post("/request", requestMagicLink);
authRoutes.post("/verify", verifyMagicLink);
authRoutes.post("/refresh", refreshTokens);
authRoutes.post("/logout", logout);
