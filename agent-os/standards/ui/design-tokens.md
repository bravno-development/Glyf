# UI Design Tokens

- **All UI colour, radius, and shadow go through tokens.** Tokens are defined in
  `ui/src/app.css` (`:root` with `light-dark()`). Use Tailwind arbitrary values:
  `bg-[var(--background)]`, `text-[var(--muted-foreground)]`,
  `rounded-[var(--radius-m)]`, `shadow-[var(--shadow-card)]`.
- **No hardcoded hex or px for those.** When touching a file that still has
  hex/raw values, migrate them to the matching token (or add a token if needed).
  See `docs/style-guide.md` for the full set.
- **Theme:** Light and dark follow the user's OS/browser preference via the
  native `light-dark()` CSS function. Dark palette is from Hangul Learning
  Dashboard in `docs/ui.pen`. No JavaScript toggle.
