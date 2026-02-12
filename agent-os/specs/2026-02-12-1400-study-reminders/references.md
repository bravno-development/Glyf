# References for Study Reminders

## Similar Implementations

### User controller

- **Location:** `api/src/controllers/user.controller.ts`
- **Relevance:** GET profile (SELECT from users, return camelCase); auth via req.userId; query() usage; 404/500 error shape.
- **Key patterns:** Extend SELECT to include reminder columns; add PATCH handler for reminder settings with validation.

### Email service

- **Location:** `api/src/services/email.ts`
- **Relevance:** SMTP via nodemailer; sendMagicLinkEmail pattern; APP_URL, console fallback when SMTP not configured.
- **Key patterns:** Add sendStudyReminderEmail(email, appUrl); same transporter and fallback.

### Progress tracker spec

- **Location:** `agent-os/specs/2026-02-11-1200-progress-tracker/`
- **Relevance:** Migration layout (new tables, indexes, CASCADE); controller/routes patterns; standards.md/references.md shape.
- **Key patterns:** Migration file naming 00X_*.sql; types in models/types.ts; auth on router.
