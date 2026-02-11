# Glyf Style Guide

Extracted from `docs/ui.pen` — **halo** design system.

Tailwind v4 implementation reference. All tokens are defined in [`globals.css`](./globals.css).

---

## Theming

| Axis | Values |
|------|--------|
| Mode | `Light` (default), `Dark` (`.dark` class on root) |

Toggle dark mode by adding `class="dark"` to `<html>` or a wrapper element.

---

## Colours

Use CSS variables via Tailwind arbitrary values: `bg-[var(--primary)]`, `text-[var(--foreground)]`, etc.

### Core palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `#FFFFFF` | `#131124` | Page background |
| `--foreground` | `#2A2933` | `#E8E8EA` | Default text |
| `--card` | `#FFFFFF` | `#1A182E` | Card surfaces |
| `--card-foreground` | `#2A2933` | `#FFFFFF` | Card text |
| `--primary` | `#5749F4` | `#5749F4` | Primary actions, buttons |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `--secondary` | `#D9D9DB` | `#403F51` | Secondary buttons, tabs |
| `--secondary-foreground` | `#2A2933` | `#FFFFFF` | Text on secondary |
| `--destructive` | `#CC3314` | `#CC3314` | Destructive actions |
| `--destructive-foreground` | `#FFFFFF` | `#FFFFFF` | Text on destructive |
| `--muted` | `#F5F5F5` | `#2E2E2E` | Muted backgrounds |
| `--muted-foreground` | `#616167` | `#888799` | Secondary/caption text |
| `--accent` | `#F5F5F5` | `#131124` | Subtle highlights |
| `--accent-foreground` | `#2A2933` | `#F2F3F0` | Text on accent |
| `--tile` | `#F5F5F5` | `#1A182E` | Tile/card alt surface |
| `--input` | `#C5C5CB` | `#2B283D` | Input borders |
| `--border` | `#C5C5CB` | `#2B283D` | General borders |
| `--ring` | `#E1E2E5` | `#666666` | Focus rings |
| `--popover` | `#FFFFFF` | `#1A182E` | Dropdowns, tooltips |
| `--popover-foreground` | `#2A2933` | `#FFFFFF` | Text in popovers |
| `--text-tertiary` | `#9C9B99` | `#6D6C6A` | Tertiary/hint text |

### Semantic colours

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-info` / `--color-info-foreground` | `#C9D6F0` / `#001133` | `#404562` / `#B2CCFF` | Info alerts |
| `--color-success` / `--color-success-foreground` | `#A1E5A1` / `#003300` | `#3B4748` / `#A1E5A1` | Success alerts, labels |
| `--color-warning` / `--color-warning-foreground` | `#FFD9B2` / `#4D2700` | `#53484F` / `#FFD9B2` | Warning alerts |
| `--color-error` / `--color-error-foreground` | `#FFBFB2` / `#590F00` | `#53424F` / `#FFBFB2` | Error alerts |

### Accent specials

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-light-green` | `#C8F0D8` | Decorative green accent |
| `--accent-warm` | `#D89575` | Warm decorative accent |

### Sidebar colours

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `#FFFFFF` | `#1A182E` |
| `--sidebar-foreground` | `#939399` | `#ACABB2` |
| `--sidebar-accent` | `#F5F5F5` | `#2B283D` |
| `--sidebar-accent-foreground` | `#2A2933` | `#E8E8EA` |
| `--sidebar-border` | `#D9D9DB` | `#2B283D` |
| `--sidebar-primary` | `#F5F5F5` | `#0F5FFE` |
| `--sidebar-primary-foreground` | `#2A2933` | `#E8E8EA` |

---

## Typography

| Role | Family | Tailwind class |
|------|--------|----------------|
| Primary (headings, labels, buttons) | Inter | `font-primary` |
| Secondary (body, captions, inputs) | Inter | `font-secondary` |

### Scale reference (from components)

| Element | Size | Weight | Line height |
|---------|------|--------|-------------|
| Modal title | 20px | 500 | 1.4 |
| Card title | 18px | 500 | 1.56 |
| Body / input labels | 16px | 400–500 | 1.5 |
| Button text | 14px | 500 | 1.43 |
| Caption / breadcrumb | 14px | 400 | 1.43 |
| Label badge | 14px | 500 | 1.14 |
| Small / list title | 12px | 500 | 1.33 |
| Stat number | 32px | 400 | 1.5 |

---

## Border Radius

| Token | Value | Tailwind |
|-------|-------|----------|
| `--radius-none` | `0px` | `rounded-none` |
| `--radius-xs` | `6px` | `rounded-[var(--radius-xs)]` |
| `--radius-m` | `24px` | `rounded-[var(--radius-m)]` |
| `--radius-l` | `40px` | `rounded-[var(--radius-l)]` |
| `--radius-pill` | `999px` | `rounded-[var(--radius-pill)]` or `rounded-full` |

Most interactive elements (buttons, inputs, tabs, avatars) use **pill** radius.
Cards use **large** (`--radius-l`). Tooltips, dropdowns & checkboxes use **medium** (`--radius-m`).

---

## Shadows

| Token | CSS value | Usage |
|-------|-----------|-------|
| `--shadow-card` | `0 10px 8.75px -1px rgba(0,0,0,0.04)` | Cards |
| `--shadow-tooltip` | `0 2px 3.5px -1px rgba(0,0,0,0.06)` | Tooltips, dropdowns, active tabs |
| `--shadow-sidebar` | `0 4px 5.25px -2px rgba(16,24,40,0.03)` | Sidebar panel |

Usage: `shadow-[var(--shadow-card)]`

---

## Icons

The design system uses [Lucide](https://lucide.dev/) icons via icon fonts.

```html
<span class="font-primary" style="font-family: 'lucide'">chevron-down</span>
```

For implementation, prefer the `lucide-react` (or `lucide-svelte`) package:
```tsx
import { ChevronDown } from "lucide-react";
<ChevronDown className="w-4 h-4" />
```

Common icon sizes: `16px` (inline), `20px` (buttons), `24px` (standalone).

---

## Components Reference

All components below are defined in the halo design system. Refer to these patterns when building w/ Tailwind.

### Button

| Variant | Background | Text colour | Border |
|---------|------------|-------------|--------|
| Default | `--primary` | `--primary-foreground` | none |
| Secondary | `--secondary` | `--secondary-foreground` | none |
| Destructive | `--destructive` | `--destructive-foreground` | none |
| Outline | transparent | `--foreground` | `1px --input` |
| Ghost | `--accent` | `--foreground` | none |

**Sizes:**
- Regular: `padding: 10px 16px`, `font-size: 14px`, `gap: 6px`
- Large: `padding: 16px 24px`, `font-size: 14px`, `gap: 6px`
- Icon-only: square padding (`10px` regular, `16px` large)

All buttons use `rounded-full` (pill), `font-weight: 500`, centred content.

### Input

- Background: `--accent`
- Border: `1px solid var(--input)`, `rounded-full`
- Padding: `18px 24px`
- Label gap: `6px` above input
- Font: 14px secondary for labels, 16px for input value

### Select

Same dimensions & styling as Input, w/ trailing chevron icon.

### Textarea

- Background: `--accent`
- Border: `1px solid var(--border)`, `rounded-[var(--radius-m)]`
- Padding: `16px 24px`
- Height: `80px` default

### Card

- Background: `--card`, border: `1px solid var(--border)`
- Radius: `--radius-l` (40px)
- Shadow: `--shadow-card`
- Slots: header, content, actions (each `padding: 40px`)
- Variant **Card Plain** uses `--tile` background, `--radius-m`
- Variant **Card Image** includes an image placeholder slot at top

### Alert

- Radius: `--radius-m`, left border `2px`
- Padding: `16px 24px`, gap `12px`
- Variants: Info / Success / Warning / Error (each w/ matching `--color-*` bg & fg)
- Contains icon (24px) + title + description

### Dialog

- Built on Card (header + actions, no content slot)
- Title: 18px/500, description: 14px/400 muted

### Modal

- Built on Card w/ full header, content description, & action buttons
- Variants: Left-aligned, Centre-aligned, Icon (w/ decorative icon above title)
- Action buttons are full-width stacked (primary + secondary)

### Tabs

- Container: `--card` bg, `1px solid var(--input)`, `rounded-full`, `padding: 8px`
- Active tab: `--secondary` bg, shadow, `rounded-full`, `padding: 10px 24px`
- Inactive tab: `--white` bg, no shadow

### Sidebar

- Width: `256px`
- Background: `--sidebar`, border: `1px solid var(--sidebar-border)`
- Radius: `--radius-m`, shadow: `--shadow-sidebar`
- Section title: `14px/600`, `padding: 8px`
- Active item: `--sidebar-accent` bg, `rounded-[24px]`, `padding: 12px 16px 12px 24px`
- Default item: transparent bg, same padding

### Checkbox & Radio

- Size: `16px` square/circle
- Checked: `--primary` bg (checkbox `--radius-xs`, radio `8px` full)
- Unchecked: `--background` bg, `1px solid var(--input)`

### Switch

- Track: `40px` wide, pill shape, `padding: 4px`
- Checked: `--primary` bg, thumb right
- Unchecked: `--input` bg, thumb left

### Label / Badge

- Pill shape, `padding: 8px 12px`
- Variants use semantic colours (success, warning, info) or `--secondary`
- Font: 14px/500

### Tooltip

- Background: `--popover`, border: `1px solid var(--border)`
- Radius: `--radius-m`, shadow: `--shadow-tooltip`
- Padding: `6px 12px`, font: 14px/500

### Pagination

- Items: `40px` square, `rounded-full`
- Active: `--background` bg, `1px solid var(--border)`
- Default: transparent, no border
- Navigation: outline buttons ("Previous" / "Next")

### Data Table

- Header: search input + action button, `gap: 16px`
- Column headers: `padding: 12px`, 14px muted text
- Cells: `padding: 12px`, bottom border
- Footer: record count text + pagination
- Table container: `--background`, `1px solid var(--border)`, `--radius-m`

### Accordion

- Trigger: `padding: 16px 0`, space-between layout
- Open: content visible below, bottom border
- Closed: content hidden, chevron-down icon

### Dropdown / List

- Container: `--popover` bg, `--radius-m`, `--shadow-tooltip`, `padding: 8px`
- Width: `240px`
- List item: `padding: 10px 16px`, pill radius
- Checked item shows checkmark icon
- Divider: `1px solid var(--border)`, `padding: 4px 0`
- Search box: `padding: 6px 16px`, pill radius

### Avatar

- Size: `40px` square, fully round (`--radius-pill`)
- Text variant: `--secondary` bg, 14px/500 initials
- Image variant: image fill, same shape

### Breadcrumb

- Items: 14px, muted for non-current, `--foreground` for current
- Separator: chevron-right icon
- Ellipsis: 3-dot icon in `20px` container

### Progress

- Track: `--secondary` bg, `360px` wide, `16px` tall, pill radius
- Fill: `--primary` bg, stretches to indicate progress
