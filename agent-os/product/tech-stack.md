# Tech Stack

## Frontend

| Technology        | Version | Purpose                             |
| ----------------- | ------- | ----------------------------------- |
| Svelte            | 5.x     | UI framework (runes syntax)         |
| SvelteKit         | 2.x     | App framework & routing             |
| Tailwind CSS      | 4.x     | Utility-first styling               |
| Dexie             | 4.x     | IndexedDB wrapper (offline storage) |
| Lucide            | 0.460+  | Icon library (`lucide-svelte`)      |
| Vite              | 7.x     | Build tool                          |
| vite-plugin-pwa   | 1.x     | PWA / service worker                |
| @tailwindcss/vite | 4.x     | Tailwind Vite plugin (not PostCSS)  |

## Backend

| Technology | Version | Purpose            |
| ---------- | ------- | ------------------ |
| Deno       | 2.x     | Runtime            |
| Express    | 4.x     | HTTP framework     |
| PostgreSQL | 16      | Persistent storage |
| djwt       | 3.x     | JWT auth tokens    |
| Nodemailer | 6.x     | Magic-link emails  |
| cors       | 2.x     | CORS middleware    |

## Database

- **PostgreSQL** — Backend: users, magic_links, user_progress, user_sync_state.
- **IndexedDB (Dexie)** — Frontend: characters, sentences, reviews, sessions,
  syncState. Offline-first; syncs with backend when online.

## Other

- **Docker** — Dockerfiles for api and ui; docker-compose for local stack.
- **Design** — Tokens in `app.css`; reference in `docs/style-guide.md` and
  `docs/globals.css`.
