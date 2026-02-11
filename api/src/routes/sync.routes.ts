import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { syncUp, syncDown } from "../controllers/sync.controller.ts";

export const syncRoutes = express.Router();

syncRoutes.use(authMiddleware);

syncRoutes.post("/", syncUp);
syncRoutes.get("/", syncDown);
