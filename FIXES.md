# Fixes: Menu Logout + 404 on Reload

Two issues, four files to touch.

---

## Issue 1 — No "Log out" in the hamburger menu

### File: `src/components/MenuDrawer.jsx`

The drawer needs to consume auth state and render a logout button at the bottom.
Add/replace the relevant parts:

```jsx
// ── At the top of MenuDrawer.jsx, add the auth import ──
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Inside the MenuDrawer component function ──
export default function MenuDrawer({ open, onClose }) {
  const { user, signOut } = useAuth();   // ← add this line
  const navigate = useNavigate();         // ← add this line (if not already present)

  const handleLogout = async () => {
    await signOut();
    onClose();          // close the drawer
    navigate('/');       // go home
  };

  // ... existing menu links ...

  return (
    <>
      {/* ... existing backdrop + drawer wrapper ... */}

      {/* ... existing menu link sections (Main, Progress, Data, etc.) ... */}

      {/* ── ADD THIS BLOCK at the very bottom of the drawer, after all menu links ── */}
      {user && (
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.1)',
          padding: '1rem 1.25rem',
          marginTop: 'auto',          /* push to bottom */
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'none',
              border: '1px solid #e53e3e',
              borderRadius: '0.5rem',
              color: '#e53e3e',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      )}

      {/* ... close drawer wrapper ... */}
    </>
  );
}
```

> **Key points:**
> - `useAuth()` gives you `user` (null when guest) and `signOut`.
> - The button only renders when `user` is truthy (signed in).
> - `onClose` is whatever prop your drawer uses to close itself (check your existing code — it might be `onClose`, `closeMenu`, or `setOpen(false)`).
> - If the drawer body is a flex column, `marginTop: 'auto'` pushes the logout to the bottom. Otherwise wrap it in a spacer or place it after all sections.

### If using CSS Modules (`MenuDrawer.module.css`), add:

```css
/* ── Add to MenuDrawer.module.css ── */
.logoutSection {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 1.25rem;
  margin-top: auto;
}

.logoutButton {
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: 1px solid #e53e3e;
  border-radius: 0.5rem;
  color: #e53e3e;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.logoutButton:active {
  background: rgba(229, 62, 62, 0.08);
}
```

Then in JSX use `className={styles.logoutSection}` / `className={styles.logoutButton}` instead of inline styles.

### Checklist — make sure the drawer container is flex column:

In `MenuDrawer.module.css`, the drawer panel (the inner element that holds all the links) should be:

```css
.drawerPanel {          /* or whatever your class is called */
  display: flex;
  flex-direction: column;
  height: 100%;         /* fill the drawer */
  /* ... your existing styles ... */
}
```

Without `flex-direction: column` + `height: 100%`, the `margin-top: auto` trick won't push the logout to the bottom.

---

## Issue 2 — 404 on page reload (any page except `/`)

This is the classic SPA problem: when the browser requests `/profile` the server has no file there so it returns 404. You need the server to serve `index.html` for **every** route, then React Router handles it client-side.

### Fix A — Vercel: `vercel.json` (project root)

Create or **replace** `vercel.json` in your project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> After adding/editing this file you **must redeploy** (push to git or run `vercel --prod`). Vercel reads this file at deploy time, not at runtime.

### Fix B — Netlify: `public/_redirects`

Create `public/_redirects` (no extension) with exactly this one line:

```
/*    /index.html   200
```

> This goes in `public/` so Vite copies it into `dist/` at build time.

### Fix C — Netlify alternative: `public/_headers` + `netlify.toml`

If `_redirects` doesn't work, create `netlify.toml` in the project root:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Fix D — Apache (`.htaccess` in `public/` or `dist/`):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Fix E — Remove force-redirect-to-home on refresh in `App.jsx`

Your updated README (line 38) says this was already done:
> "Full refresh stays on current page – Removed redirect to home on full page reload"

But if you still have a redirect, look for and **delete** any code like this in `src/App.jsx`:

```jsx
// ❌ DELETE this block if it still exists
useEffect(() => {
  // On full page refresh, go to home
  if (window.performance?.navigation?.type === 1 ||
      performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload') {
    navigate('/', { replace: true });
  }
}, []);
```

Or the simpler version:

```jsx
// ❌ DELETE this too
useEffect(() => {
  navigate('/', { replace: true });
}, []);
```

The app should **not** redirect anywhere on mount. AuthContext restores the Supabase session automatically, so you just stay on whatever URL the browser loaded.

---

## Quick verification

After applying the fixes:

| Test | Expected |
|------|----------|
| Open hamburger menu while signed in | "Log out" button visible at bottom |
| Tap "Log out" in menu | Signs out, drawer closes, navigates to `/` |
| Open hamburger menu while **not** signed in | No "Log out" button |
| Navigate to `/profile`, hit browser refresh | Page reloads on `/profile` (no 404) |
| Navigate to `/library`, hit browser refresh | Page reloads on `/library` (no 404) |
| Hard-refresh on `/data/history` | Page reloads correctly |
| Full refresh while signed in | Auth session is preserved (still signed in) |

---

## README changelog rows to add

```
| Latest | **Fix: Log out in menu** – MenuDrawer now imports useAuth and shows a "Log out" button at the bottom of the drawer when the user is signed in; tap signs out, closes drawer, navigates home. See MenuDrawer.jsx, MenuDrawer.module.css. |
| — | **Fix: 404 on reload** – vercel.json rewrites all routes to index.html; public/_redirects added for Netlify. App.jsx no longer redirects to home on full refresh; current page is preserved. Redeploy after pull. See vercel.json, public/_redirects, App.jsx. |
```
