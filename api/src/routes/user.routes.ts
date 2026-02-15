import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { getProfile, getUserScripts, updateDailyGoal, updateReminder } from "../controllers/user.controller.ts";

export const userRoutes = express.Router();

userRoutes.use(authMiddleware);

userRoutes.get("/profile", getProfile);
userRoutes.patch("/reminder", updateReminder);
userRoutes.get("/scripts", getUserScripts);
userRoutes.put("/daily-goal", updateDailyGoal);
