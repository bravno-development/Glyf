import { express } from "../../imports.ts";
import { requestMagicLink, verifyMagicLink } from "../controllers/auth.controller.ts";

export const authRoutes = express.Router();

authRoutes.post("/request", requestMagicLink);
authRoutes.post("/verify", verifyMagicLink);
