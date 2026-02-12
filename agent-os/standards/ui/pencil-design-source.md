# UI Pencil Design Source

- **Source of truth for the halo design system is `docs/ui.pen`** (Pencil
  format). When building or updating UI, **use the Pencil.dev MCP with
  `docs/ui.pen`** so layout, components, and tokens stay aligned with the design
  and generated code is more structured.
- **Workflow:** Call the Pencil MCP with the design file when creating or
  changing UI (pages, components, layouts). Use the MCP output for structure and
  specs; implement in Svelte with Tailwind and design tokens from
  [design-tokens](design-tokens.md).
- **Existing references:** Tokens and component patterns are documented in
  `docs/style-guide.md`; tokens live in `ui/src/app.css` and use `light-dark()`
  for system-based light/dark switching. Use these for implementation details;
  use the MCP + `docs/ui.pen` to pull the current design in when generating or
  updating code.
