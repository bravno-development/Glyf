import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { getProfile, getUserScripts } from "../controllers/user.controller.ts";

export const userRoutes = express.Router();

userRoutes.use(authMiddleware);

userRoutes.get("/profile", getProfile);
userRoutes.get("/scripts", getUserScripts);
