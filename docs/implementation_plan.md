# Revised Implementation Plan: Glyf

## **MONOREPO STRUCTURE**

```
glyf/
├── docker/
│   ├── api.Dockerfile
│   └── ui.Dockerfile
├── docker-compose.yml
├── .editorconfig
├── tsconfig.json
├── CLAUDE.md
├── .gitignore
├── README.md
│
├── api/                          # Deno + Express backend
│   ├── deno.json
│   ├── imports.ts                # Centralized imports
│   ├── src/
│   │   ├── main.ts              # Entry point
│   │   ├── config/
│   │   │   └── database.ts      # Postgres connection
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT auth middleware
│   │   │   ├── cors.ts          # CORS configuration
│   │   │   └── errorHandler.ts
│   │   ├── services/
│   │   │   └── email.ts         # Magic link email sending
│   │   ├── routes/
│   │   │   ├── auth.routes.ts   # Magic link request & verify
│   │   │   ├── sync.routes.ts   # Sync endpoints
│   │   │   └── user.routes.ts   # User profile, progress
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── sync.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── models/
│   │   │   └── types.ts         # TypeScript interfaces
│   │   └── utils/
│   │       ├── jwt.ts
│   │       └── validator.ts
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_magic_links.sql
│
└── ui/                           # Svelte + SvelteKit frontend
    ├── package.json
    ├── svelte.config.js
    ├── vite.config.ts
    ├── tsconfig.json
    ├── static/
    │   ├── manifest.json
    │   ├── service-worker.js
    │   ├── icons/
    │   └── data/                # Static character/sentence data
    │       ├── japanese_kanji.json
    │       ├── japanese_sentences.json
    │       ├── chinese_hanzi.json
    │       └── korean_hangul.json
    ├── src/
    │   ├── app.html
    │   ├── app.css
    │   ├── routes/
    │   │   ├── +layout.svelte
    │   │   ├── +layout.ts
    │   │   ├── +page.svelte      # Dashboard
    │   │   ├── auth/
    │   │   │   ├── login/+page.svelte
    │   │   │   └── verify/+page.svelte
    │   │   ├── learn/
    │   │   │   ├── +page.svelte  # Script selection
    │   │   │   └── [script]/
    │   │   │       ├── +page.svelte
    │   │   │       └── session/
    │   │   │           └── +page.svelte  # Review session
    │   │   ├── progress/
    │   │   │   └── +page.svelte
    │   │   └── settings/
    │   │       └── +page.svelte
    │   ├── lib/
    │   │   ├── components/
    │   │   │   ├── ReviewCard.svelte
    │   │   │   ├── ProgressChart.svelte
    │   │   │   ├── SyncIndicator.svelte
    │   │   │   └── ScriptSelector.svelte
    │   │   ├── stores/
    │   │   │   ├── user.ts       # User authentication state
    │   │   │   ├── session.ts    # Current review session
    │   │   │   └── sync.ts       # Sync status
    │   │   ├── services/
    │   │   │   ├── api.ts        # API client
    │   │   │   ├── db.ts         # IndexedDB (Dexie)
    │   │   │   ├── srs.ts        # Spaced repetition algorithm
    │   │   │   └── sync.ts       # Sync logic
    │   │   ├── types/
    │   │   │   └── index.ts      # Shared TypeScript types
    │   │   └── utils/
    │   │       ├── date.ts
    │   │       └── storage.ts
    │   └── hooks.server.ts
    └── tests/
        └── unit/
```

---

## **ROOT CONFIG FILES**

### `.editorconfig`
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

### `tsconfig.json` (root - shared base config)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### `CLAUDE.md`
```markdown
# Glyf - Development Guide

## Project Overview
Multi-script learning platform w/ stroke order animations & spaced repetition.

## Architecture
- **Monorepo**: API (Deno) + UI (Svelte)
- **Offline-first**: IndexedDB for local storage
- **Minimal backend**: PostgreSQL for user data and sync

## Quick Start
```bash
# Start everything with Docker
docker-compose up

# Or run individually:
cd api && deno task dev
cd ui && npm run dev
```

## Key Technologies
- Backend: Deno 2.x, Express, PostgreSQL
- Frontend: Svelte 5, SvelteKit, IndexedDB (Dexie)
- Deployment: Docker, Docker Compose

## Development Workflow
1. Make changes in `api/` or `ui/`
2. Test locally with Docker Compose
3. Run migrations: `deno task migrate`
4. Sync logic runs on frontend, backend is just persistence

## Data Sources
- Character data: KanjiVG (Japanese), Makemeahanzi (Chinese)
- Sentences: Tatoeba, manually curated

## Phase Status
- [ ] Phase 1: MVP (Japanese only, local)
- [ ] Phase 2: Backend + Sync
- [ ] Phase 3: Multi-script support
- [ ] Phase 4: Polish + Analytics
```

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: glyf-db
    environment:
      POSTGRES_USER: glyf
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: glyf_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./api/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U glyf"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    container_name: glyf-api
    environment:
      DATABASE_URL: postgresql://glyf:dev_password@postgres:5432/glyf_dev
      JWT_SECRET: dev_jwt_secret_change_in_production
      PORT: 8000
      DENO_ENV: development
    ports:
      - "8000:8000"
    volumes:
      - ./api:/app
    depends_on:
      postgres:
        condition: service_healthy
    command: deno task dev

  ui:
    build:
      context: .
      dockerfile: docker/ui.Dockerfile
    container_name: glyf-ui
    environment:
      VITE_API_URL: http://localhost:8000
      NODE_ENV: development
    ports:
      - "5173:5173"
    volumes:
      - ./ui:/app
      - /app/node_modules
    command: npm run dev -- --host

volumes:
  postgres_data:
```

### `docker/api.Dockerfile`
```dockerfile
FROM denoland/deno:2.1.4

WORKDIR /app

# Copy dependency files
COPY api/deno.json api/imports.ts ./

# Cache dependencies
RUN deno cache imports.ts

# Copy source code
COPY api/ .

# Default command (can be overridden in docker-compose)
CMD ["deno", "task", "start"]
```

### `docker/ui.Dockerfile`
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY ui/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY ui/ .

# Expose Vite dev server port
EXPOSE 5173

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "dev", "--", "--host"]
```

---

## **BACKEND (API) - DENO + EXPRESS**

### `api/deno.json`
```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-env --allow-write --watch src/main.ts",
    "start": "deno run --allow-net --allow-read --allow-env --allow-write src/main.ts",
    "migrate": "deno run --allow-net --allow-read --allow-env migrations/run.ts",
    "test": "deno test --allow-net --allow-read --allow-env"
  },
  "imports": {
    "express": "npm:express@^4.18.2",
    "@types/express": "npm:@types/express@^4.17.21",
    "postgres": "https://deno.land/x/postgres@v0.19.3/mod.ts",
    "nodemailer": "npm:nodemailer@^6.9.0",
    "djwt": "https://deno.land/x/djwt@v3.0.2/mod.ts",
    "cors": "npm:cors@^2.8.5",
    "@types/cors": "npm:@types/cors@^2.8.17"
  },
  "compilerOptions": {
    "lib": ["deno.window", "deno.ns", "esnext"],
    "strict": true
  }
}
```

### `api/imports.ts`
```typescript
// Centralised imports for caching
export { default as express } from "express";
export type { Request, Response, NextFunction } from "express";
export { default as cors } from "cors";
export { Pool } from "postgres";
export { default as nodemailer } from "nodemailer";
export { create, verify } from "djwt";
export type { Payload } from "djwt";
```

### `api/src/main.ts`
```typescript
import { express, cors } from "../imports.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { authRoutes } from "./routes/auth.routes.ts";
import { syncRoutes } from "./routes/sync.routes.ts";
import { userRoutes } from "./routes/user.routes.ts";

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

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
```

### `api/src/config/database.ts`
```typescript
import { Pool } from "../../imports.ts";

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const pool = new Pool(DATABASE_URL, 10, true);

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.queryObject(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

### `api/src/models/types.ts`
```typescript
// Shared types between API and UI
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface ReviewState {
  itemId: string;
  itemType: "character" | "sentence";
  script: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
}

export interface SyncPayload {
  script: string;
  reviews: ReviewState[];
  lastSync: string;
}

export interface UserProgress {
  script: string;
  totalCardsLearned: number;
  totalReviews: number;
  streakDays: number;
  lastReviewDate: string;
}

export interface MagicLink {
  id: string;
  userId: string | null;
  email: string;
  token: string;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}
```

### `api/src/middleware/auth.ts`
```typescript
import type { Request, Response, NextFunction } from "../../imports.ts";
import { verify } from "../../imports.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "change_me_in_production";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const payload = await verify(token, key);
    req.userId = payload.sub as string;
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}
```

### `api/src/middleware/errorHandler.ts`
```typescript
import type { Request, Response, NextFunction } from "../../imports.ts";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Error:", err);
  
  const isDev = Deno.env.get("DENO_ENV") === "development";
  
  res.status(500).json({
    error: "Internal server error",
    ...(isDev && { message: err.message, stack: err.stack })
  });
}
```

### `api/src/routes/auth.routes.ts`
```typescript
import { express } from "../../imports.ts";
import { requestMagicLink, verifyMagicLink } from "../controllers/auth.controller.ts";

export const authRoutes = express.Router();

authRoutes.post("/request", requestMagicLink);
authRoutes.post("/verify", verifyMagicLink);
```

### `api/src/controllers/auth.controller.ts`
```typescript
import type { Request, Response } from "../../imports.ts";
import { create } from "../../imports.ts";
import { query } from "../config/database.ts";
import { sendMagicLinkEmail } from "../services/email.ts";
import type { AuthResponse } from "../models/types.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "change_me_in_production";
const MAGIC_LINK_EXPIRY_MINUTES = 15;

async function generateToken(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return await create(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, exp: Date.now() / 1000 + 7 * 24 * 60 * 60 },
    key
  );
}

// requestMagicLink — generates token + 6-digit code, sends email
export async function requestMagicLink(req: Request, res: Response) { ... }

// verifyMagicLink — accepts { token } or { email, code }, upserts user, returns JWT
export async function verifyMagicLink(req: Request, res: Response) { ... }
```

### `api/src/services/email.ts` (new)
```typescript
// Uses nodemailer for SMTP; falls back to console logging in dev (no SMTP configured)
// Reads SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM from env
// sendMagicLinkEmail(email, token, code) — sends 6-digit code + clickable link
```

### `api/src/routes/sync.routes.ts`
```typescript
import { express } from "../../imports.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { syncUp, syncDown } from "../controllers/sync.controller.ts";

export const syncRoutes = express.Router();

syncRoutes.use(authMiddleware); // All sync routes require auth

syncRoutes.post("/", syncUp);    // Upload local changes to server
syncRoutes.get("/", syncDown);   // Download server state to device
```

### `api/src/controllers/sync.controller.ts`
```typescript
import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";
import type { SyncPayload } from "../models/types.ts";

export async function syncUp(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { script, reviews, lastSync } = req.body as SyncPayload;

    if (!script || !reviews) {
      return res.status(400).json({ error: "Script and reviews required" });
    }

    // Upsert sync state (last-write-wins strategy)
    await query(
      `INSERT INTO user_sync_state (user_id, script, review_data, last_sync)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, script)
       DO UPDATE SET
         review_data = $3,
         last_sync = NOW()`,
      [userId, script, JSON.stringify(reviews)]
    );

    // Update progress stats
    await query(
      `INSERT INTO user_progress (user_id, script, total_reviews)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, script)
       DO UPDATE SET
         total_reviews = user_progress.total_reviews + $3,
         updated_at = NOW()`,
      [userId, script, reviews.length]
    );

    res.json({ success: true, synced: reviews.length });
  } catch (error) {
    console.error("Sync up error:", error);
    res.status(500).json({ error: "Sync failed" });
  }
}

export async function syncDown(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const result = await query(
      `SELECT script, review_data, last_sync
       FROM user_sync_state
       WHERE user_id = $1`,
      [userId]
    );

    const syncData = result.rows.map((row: any) => ({
      script: row.script,
      reviews: JSON.parse(row.review_data),
      lastSync: row.last_sync
    }));

    res.json(syncData);
  } catch (error) {
    console.error("Sync down error:", error);
    res.status(500).json({ error: "Sync failed" });
  }
}
```

### `api/migrations/001_initial_schema.sql`
```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync state (stores compressed review data)
CREATE TABLE IF NOT EXISTS user_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  script VARCHAR(50) NOT NULL,
  last_sync TIMESTAMP DEFAULT NOW(),
  review_data JSONB NOT NULL,
  UNIQUE(user_id, script)
);

-- User progress snapshots
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  script VARCHAR(50) NOT NULL,
  total_cards_learned INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_review_date DATE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, script)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sync_state_user_id ON user_sync_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
```

---

## **FRONTEND (UI) - SVELTE + SVELTEKIT + TAILWIND**

### Styling Approach

- **Tailwind CSS v4** for all styling — no inline styles, no component-scoped `<style>` blocks for layout/colour
- Design tokens extracted from `docs/ui.pen` (halo design system) into CSS custom properties
- See `docs/globals.css` for the full token set & `docs/style-guide.md` for component reference
- Light/dark theming via `.dark` class on root element
- Font: Inter (primary & secondary), loaded via `<link>` tag
- Icons: Lucide (`lucide-svelte` package)
- All colours referenced as `bg-[var(--primary)]`, `text-[var(--foreground)]`, etc. — never hardcoded hex values
- Border radii use design tokens (`--radius-xs` through `--radius-pill`)
- `globals.css` is imported via `@import "tailwindcss";` + `:root` / `.dark` variable blocks

### `ui/package.json`
```json
{
  "name": "glyf-ui",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "tslib": "^2.6.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.20.0"
  },
  "dependencies": {
    "dexie": "^4.0.0",
    "lucide-svelte": "^0.460.0"
  },
  "type": "module"
}
```

### `ui/svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    })
  }
};
```

### `ui/vite.config.ts`
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Glyf',
        short_name: 'Glyf',
        description: 'Learn writing systems with spaced repetition',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ]
});
```

### `ui/src/lib/services/db.ts`
```typescript
import Dexie, { type Table } from 'dexie';

export interface Character {
  id: string;
  script: string;
  character: string;
  meaning: string;
  readings?: string[];
  frequency: number;
  strokes?: any[]; // Stroke data (optional, for future use)
}

export interface Sentence {
  id: string;
  script: string;
  sentence: string;
  translation: string;
  characters: string[];
  difficulty: number;
}

export interface Review {
  id?: number;
  itemId: string;
  itemType: 'character' | 'sentence';
  script: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
}

export interface Session {
  id?: number;
  script: string;
  date: string;
  cardsReviewed: number;
  timeSpent: number;
}

export interface SyncState {
  script: string;
  lastSync: string;
  pendingChanges: boolean;
}

export class GlyfDB extends Dexie {
  characters!: Table<Character>;
  sentences!: Table<Sentence>;
  reviews!: Table<Review>;
  sessions!: Table<Session>;
  syncState!: Table<SyncState>;

  constructor() {
    super('GlyfDB');
    
    this.version(1).stores({
      characters: 'id, script, frequency',
      sentences: 'id, script, difficulty',
      reviews: '++id, itemId, script, [script+nextReview], nextReview',
      sessions: '++id, script, date',
      syncState: 'script'
    });
  }
}

export const db = new GlyfDB();
```

### `ui/src/lib/services/srs.ts`
```typescript
import type { Review } from './db';

export interface GradeResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
}

/**
 * SM-2 Algorithm for spaced repetition
 * @param card Current review state
 * @param grade User's grade (0-5): 0=total fail, 3=pass, 5=perfect
 */
export function calculateNextReview(
  card: Partial<Review>,
  grade: number
): GradeResult {
  let easeFactor = card.easeFactor ?? 2.5;
  let interval = card.interval ?? 0;
  let repetitions = card.repetitions ?? 0;

  if (grade < 3) {
    // Failed - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;

    // Adjust ease factor
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString()
  };
}

/**
 * Get cards due for review
 */
export async function getDueCards(script: string, db: any): Promise<Review[]> {
  const now = new Date().toISOString();
  return await db.reviews
    .where('[script+nextReview]')
    .below([script, now])
    .toArray();
}

/**
 * Get new cards that haven't been reviewed yet
 */
export async function getNewCards(
  script: string,
  limit: number,
  db: any
): Promise<any[]> {
  const characters = await db.characters
    .where('script')
    .equals(script)
    .toArray();

  const reviewedIds = new Set(
    (await db.reviews.where('script').equals(script).toArray()).map(
      (r: Review) => r.itemId
    )
  );

  return characters
    .filter((char: any) => !reviewedIds.has(char.id))
    .slice(0, limit);
}
```

### `ui/src/lib/services/api.ts`
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiError {
  error: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    requestLink: (email: string) =>
      fetchApi<{ message: string }>('/api/auth/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    verify: (payload: { token: string } | { email: string; code: string }) =>
      fetchApi<{ token: string; user: { id: string; email: string } }>(
        '/api/auth/verify',
        { method: 'POST', body: JSON.stringify(payload) }
      )
  },

  sync: {
    upload: (script: string, reviews: any[], lastSync: string) =>
      fetchApi('/api/sync', {
        method: 'POST',
        body: JSON.stringify({ script, reviews, lastSync })
      }),
    download: () => fetchApi('/api/sync')
  }
};
```

### `ui/src/lib/services/sync.ts`
```typescript
import { db } from './db';
import { api } from './api';

export async function syncToServer(): Promise<void> {
  try {
    const syncStates = await db.syncState.toArray();

    for (const state of syncStates) {
      if (!state.pendingChanges) continue;

      const reviews = await db.reviews.where('script').equals(state.script).toArray();

      await api.sync.upload(state.script, reviews, state.lastSync);

      await db.syncState.update(state.script, {
        lastSync: new Date().toISOString(),
        pendingChanges: false
      });
    }
  } catch (error) {
    console.error('Sync to server failed:', error);
    // App continues to work offline
  }
}

export async function syncFromServer(): Promise<void> {
  try {
    const serverData = await api.sync.download() as any[];

    for (const scriptData of serverData) {
      const localState = await db.syncState.get(scriptData.script);

      // Server wins if more recent
      if (
        !localState ||
        new Date(scriptData.lastSync) > new Date(localState.lastSync)
      ) {
        await db.reviews.bulkPut(scriptData.reviews);
        await db.syncState.put({
          script: scriptData.script,
          lastSync: scriptData.lastSync,
          pendingChanges: false
        });
      }
    }
  } catch (error) {
    console.error('Sync from server failed:', error);
  }
}
```

### `ui/src/lib/stores/user.ts`
```typescript
import { writable } from 'svelte/store';

interface User {
  id: string;
  email: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

function createUserStore() {
  const { subscribe, set, update } = writable<UserState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  return {
    subscribe,
    login: (user: User, token: string) => {
      localStorage.setItem('authToken', token);
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('authToken');
      set({ user: null, token: null, isAuthenticated: false });
    },
    init: () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Optionally validate token with server
        update(state => ({ ...state, token, isAuthenticated: true }));
      }
    }
  };
}

export const userStore = createUserStore();
```

### `ui/src/app.css`

This file holds the Tailwind import & all design tokens. Copy from `docs/globals.css`.

```css
@import "tailwindcss";

:root {
  /* All design tokens from docs/globals.css */
  /* See docs/style-guide.md for the full reference */
}

.dark {
  /* Dark mode overrides — see docs/globals.css */
}

@layer base {
  html, body { height: 100%; }
  .font-primary { font-family: "Inter", sans-serif; }
  .font-secondary { font-family: "Inter", sans-serif; }
  body { background-color: var(--background); color: var(--foreground); }
}
```

### `ui/src/routes/+layout.svelte`
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';
  import { syncFromServer, syncToServer } from '$lib/services/sync';
  import '../app.css';

  onMount(() => {
    userStore.init();

    // Initial sync if logged in
    if ($userStore.isAuthenticated) {
      syncFromServer();
    }

    // Periodic background sync (every 5 minutes)
    const syncInterval = setInterval(() => {
      if ($userStore.isAuthenticated) {
        syncToServer();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  });
</script>

<div class="min-h-screen flex flex-col font-primary bg-[var(--background)] text-[var(--foreground)]">
  <slot />
</div>
```

### `ui/src/routes/+page.svelte`
```svelte
<script lang="ts">
  import { userStore } from '$lib/stores/user';
  import { goto } from '$app/navigation';

  function navigateToLearn() {
    goto('/learn');
  }
</script>

<div class="max-w-[800px] mx-auto p-8 text-center">
  <h1 class="text-2xl font-medium text-[var(--foreground)]">Glyf</h1>

  {#if $userStore.isAuthenticated}
    <p class="mt-4 text-[var(--muted-foreground)]">Welcome back, {$userStore.user?.email}!</p>
    <div class="mt-6 flex justify-center gap-3">
      <button
        class="rounded-[var(--radius-pill)] bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm font-medium"
        on:click={navigateToLearn}
      >Start Learning</button>
      <button
        class="rounded-[var(--radius-pill)] bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2.5 text-sm font-medium"
        on:click={() => userStore.logout()}
      >Logout</button>
    </div>
  {:else}
    <p class="mt-4 text-[var(--muted-foreground)]">Please log in to continue</p>
    <div class="mt-6 flex justify-center gap-3">
      <a
        href="/auth/login"
        class="rounded-[var(--radius-pill)] bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm font-medium"
      >Login</a>
      <a
        href="/auth/register"
        class="rounded-[var(--radius-pill)] border border-[var(--input)] text-[var(--foreground)] px-4 py-2.5 text-sm font-medium"
      >Register</a>
    </div>
  {/if}
</div>
```

---

## **DEVELOPMENT PHASES (Revised)**

### Phase 1: MVP Foundation (2-3 weeks)
- [ ] Setup monorepo structure
- [ ] Docker configuration
- [ ] Basic Deno API with auth
- [ ] Svelte UI with IndexedDB
- [ ] SRS algorithm implementation
- [ ] Local-only review flow (no sync yet)
- [ ] Load 50 Japanese kanji from JSON

### Phase 2: Backend Integration (1-2 weeks)
- [ ] Complete sync endpoints
- [ ] Frontend sync service
- [ ] Cross-device testing
- [ ] Error handling & offline support

### Phase 3: Content & Polish (2-3 weeks)
- [ ] Add more character data
- [ ] Progress tracking
- [ ] UI improvements
- [ ] Testing & bug fixes

---

## **NEXT STEPS**

Want me to create any of these files for you? I can start with:

1. **Docker setup** - Get the dev environment running
2. **API skeleton** - Deno + Express with auth
3. **UI foundation** - Svelte + IndexedDB + SRS logic
4. **Database migrations** - PostgreSQL schema

Which would you like to start with?