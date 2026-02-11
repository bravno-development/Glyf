# Glyf - Development Guide

## Project Overview
Multi-script learning platform w/ stroke order animations & spaced repetition.

## Architecture
- **Monorepo**: API (Deno) + UI (Svelte)
- **Offline-first**: IndexedDB for local storage
- **Minimal backend**: PostgreSQL for user data & sync

## Quick Start
```bash
# Start everything w/ Docker
docker-compose up

# Or run individually:
cd api && deno task dev
cd ui && pnpm dev
```

## Key Technologies
- Backend: Deno 2.x, Express, PostgreSQL
- Frontend: Svelte 5, SvelteKit, IndexedDB (Dexie)
- Styling: Tailwind CSS v4, design tokens in `ui/src/app.css`
- Deployment: Docker, Docker Compose

## Development Workflow
1. Make changes in `api/` or `ui/`
2. Test locally w/ Docker Compose
3. Run migrations: `deno task migrate`
4. Sync logic runs on frontend, backend is just persistence

## Styling Rules
- Tailwind v4 only — no inline styles, no component-scoped `<style>` blocks for layout/colour
- All colours via CSS variables: `bg-[var(--primary)]`, `text-[var(--foreground)]`
- Never hardcode hex values — use design tokens from `docs/globals.css`
- See `docs/style-guide.md` for component reference

## Data Sources
- Character data: KanjiVG (Japanese), Makemeahanzi (Chinese)
- Sentences: Tatoeba, manually curated
