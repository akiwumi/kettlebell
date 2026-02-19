# Kettlebell Gym — Design System

Clean, modern fitness-app aesthetic: light backgrounds, rounded cards, subtle shadows, and a clear hierarchy. Use this doc and the CSS variables in `src/index.css` to keep the UI consistent.

---

## Design tokens

All tokens are defined as CSS custom properties in `src/index.css` under `:root`. Use them in component styles via `var(--token-name)`.

### Surfaces

| Token | Value | Use |
|-------|--------|-----|
| `--bg-page` | `#f8fafc` | Page / app background |
| `--bg-card` | `#ffffff` | Cards, list items, inputs |
| `--bg-card-soft` | `#f1f5f9` | Muted card areas |
| `--bg-accent-card` | `#f3e8ff` | Soft purple accent cards (optional) |

### Text

| Token | Value | Use |
|-------|--------|-----|
| `--text-primary` | `#1e293b` | Headings, primary copy |
| `--text-secondary` | `#64748b` | Labels, descriptions |
| `--text-muted` | `#94a3b8` | Tertiary text, placeholders |
| `--text-on-accent` | `#ffffff` | Text on indigo/orange (e.g. hero, primary CTA) |
| `--text-on-orange` | `#1e293b` | Text on orange buttons (dark for contrast) |

### Accents

| Token | Value | Use |
|-------|--------|-----|
| `--accent-orange` | `#f59e0b` | Primary actions, highlights, “Today” badge |
| `--accent-orange-hover` | `#ea580c` | Hover state for orange |
| `--accent-indigo` | `#4f46e5` | Hero block, key CTAs (e.g. “Back to home”) |
| `--accent-indigo-dark` | `#3730a3` | Indigo hover |
| `--accent-teal` | `#0d9488` | Progress, optional accents |
| `--accent-purple-soft` | `#e9d5ff` | Soft purple UI (optional) |

### Borders and shadows

| Token | Value | Use |
|-------|--------|-----|
| `--border` | `#e2e8f0` | Card borders, dividers |
| `--border-focus` | `#f59e0b` | Focus ring on inputs/buttons |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Buttons, pills |
| `--shadow-card` | (see index.css) | Default card shadow |
| `--shadow-card-hover` | (see index.css) | Card hover state |

### Radii

| Token | Value | Use |
|-------|--------|-----|
| `--radius-sm` | `8px` | Badges, inputs |
| `--radius-md` | `12px` | Cards, list items |
| `--radius-lg` | `16px` | Buttons, hero block |
| `--radius-full` | `9999px` | Pills (e.g. filter chips) |

---

## Typography

- **Font stack:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Headings:** Bold (700), dark (`--text-primary`). Use `letter-spacing: -0.02em` for large titles.
- **Body:** Regular weight, `--text-primary` for main copy, `--text-secondary` for supporting text.
- **Labels / meta:** Smaller size (0.85–0.9rem), `--text-secondary` or `--text-muted`.
- **Metrics / numbers:** Bold, tabular-nums for timers and stats.

---

## Component patterns

### Cards

- Background: `var(--bg-card)`
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-md)` or `var(--radius-lg)`
- Shadow: `var(--shadow-card)`; hover: `var(--shadow-card-hover)`

### Buttons

- **Primary:** `--accent-orange` background, `--text-on-orange` text, `--radius-lg`, `--shadow-sm`; hover: `--accent-orange-hover`, `--shadow-card`.
- **Secondary:** `--bg-card` background, `--border` border, `--text-primary`; hover: border and text `--accent-orange`.

### Links

- Default: `--accent-orange`.
- Hover: underline (or same color for icon/back links).
- “Back” / secondary links: `--text-secondary`; hover: `--accent-orange`.

### Form inputs

- Background: `--bg-card`
- Border: `1px solid var(--border)`
- Focus: border `--border-focus`, optional ring `0 0 0 3px rgba(245, 158, 11, 0.15)`
- Border-radius: `var(--radius-sm)`

### Pills / filters

- Inactive: `--bg-card`, `--border`, `--text-secondary`, `--radius-full`, `--shadow-sm`.
- Active: `--accent-orange` background and border, `--text-on-orange`, font-weight 600.

### Hero / accent block

- Gradient: `linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-dark))`.
- Text: `--text-on-accent`.
- Padding and `--radius-lg`, `--shadow-card`.

---

## Usage in code

Reference tokens in CSS/SCSS modules:

```css
.myCard {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
}

.myCard:hover {
  box-shadow: var(--shadow-card-hover);
}
```

Do not hardcode the hex values in components; use the tokens so the design can be updated in one place (`src/index.css`).

---

## Summary

- **Surfaces:** Light grey page, white cards, optional soft purple.
- **Hierarchy:** Dark text for primary content, grey for secondary, orange for actions and highlights, indigo for hero and key CTAs.
- **Shape:** Rounded corners everywhere (8–16px, full for pills).
- **Depth:** Light shadows on cards and buttons; slightly stronger on hover.
