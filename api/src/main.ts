import { express, cors } from "../imports.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { authRoutes } from "./routes/auth.routes.ts";
import { syncRoutes } from "./routes/sync.routes.ts";
import { userRoutes } from "./routes/user.routes.ts";
import { onboardingRoutes } from "./routes/onboarding.routes.ts";
import { progressRoutes } from "./routes/progress.routes.ts";

const app = express();
const PORT = Deno.env.get("PORT") || 8000;

// Middleware
app.use(cors({
	origin: Deno.env.get("DENO_ENV") === "production"
		? "https://yourapp.com"
		: "http://localhost:5173",
	credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/user", userRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/progress", progressRoutes);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`API server running on http://localhost:${PORT}`);
});
