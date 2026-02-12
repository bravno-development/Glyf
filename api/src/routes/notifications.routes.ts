import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { listNotifications, markRead, markAllRead } from "../controllers/notifications.controller.ts";

export const notificationsRoutes = express.Router();

notificationsRoutes.use(authMiddleware);

notificationsRoutes.get("/", listNotifications);
notificationsRoutes.patch("/:id/read", markRead);
notificationsRoutes.post("/read-all", markAllRead);
