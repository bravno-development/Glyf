import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { resetAccount } from "../controllers/admin.controller.ts";

export const adminRoutes = express.Router();

adminRoutes.use(authMiddleware);
adminRoutes.post("/reset", resetAccount);
