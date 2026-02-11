# UI Design Tokens

- **All UI colour, radius, and shadow go through tokens.** Tokens are defined in
  `app.css` (`:root` and `.dark`). Use Tailwind arbitrary values:
  `bg-[var(--background)]`, `text-[var(--muted-foreground)]`,
  `rounded-[var(--radius-m)]`, `shadow-[var(--shadow-card)]`.
- **No hardcoded hex or px for those.** When touching a file that still has
  hex/raw values, migrate them to the matching token (or add a token if needed).
  See `docs/style-guide.md` and `docs/globals.css` for the full set.
- **Theme:** Light by default; dark via `.dark` on root. Toggle by
  adding/removing the class (e.g. on `<html>`).
