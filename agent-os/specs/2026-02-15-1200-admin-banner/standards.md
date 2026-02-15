# Standards for Admin Banner

The following standards from `agent-os/standards/` apply to this work.

- **api/route-layout** — New router `admin.routes.ts` mounted at `/api/admin`; auth middleware on router.
- **api/error-responses** — 403 + `{ error }` for non-localhost; 500 + `{ error }` on reset failure.
- **api/auth-middleware** — Admin routes use authMiddleware; controller uses `req.userId` for DELETEs.
- **ui/design-tokens** — Banner and buttons use CSS variables only (`--muted`, `--foreground`, `--destructive`, `--secondary`, `--radius-xs`); see `docs/style-guide.md`.
- **ui/api-client** — Single fetchApi; Bearer from localStorage; `api.admin.reset()` added.
- **ui/services-structure** — `admin.ts` and adminTime store are stateless; use api/db/localStorage only.

Full standard content: see `agent-os/standards/index.yml` and the referenced files under `api/` and `ui/`.
