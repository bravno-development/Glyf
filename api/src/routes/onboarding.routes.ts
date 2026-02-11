import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { getStatus, complete } from "../controllers/onboarding.controller.ts";

export const onboardingRoutes = express.Router();

onboardingRoutes.use(authMiddleware);

onboardingRoutes.get("/status", getStatus);
onboardingRoutes.post("/complete", complete);
