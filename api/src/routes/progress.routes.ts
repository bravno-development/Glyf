import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import {
	submitAttempts,
	getDue
} from "../controllers/progress.controller.ts";

export const progressRoutes = express.Router();
progressRoutes.use(authMiddleware);

progressRoutes.post("/attempts", submitAttempts);
progressRoutes.get("/due", getDue);
