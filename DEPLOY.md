# Deployment guide

Deploy the Kettlebell Gym app as a **static site** (Vite build). Supabase is optional and used only for saving session history.

---

## Build

```bash
npm run build
```

Output is in **`dist/`**. Serve that folder with any static host. No server-side rendering or Node runtime is required.

---

## Environment variables

Only needed if you use Supabase for session history:

| Variable | Description | When to set |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxxx.supabase.co`) | Build time |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Build time |

Vite inlines `import.meta.env.VITE_*` into the client bundle at **build time**. So you must set these in your host’s build environment (e.g. Vercel/Netlify env vars), not only in a server. If they’re missing at build time, the app still runs but won’t save sessions to Supabase.

---

## Hosting examples

### Vercel

1. Connect the repo (GitHub/GitLab/Bitbucket).
2. Framework preset: **Vite** (or Other; build command below).
3. **Build command:** `npm run build`  
   **Output directory:** `dist`
4. Add **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (if using Supabase).
5. **SPA fallback (fixes 404 on reload):** The repo includes `vercel.json` with:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   You **must redeploy after adding or changing this file**. If you deployed before it existed, Vercel won’t apply it until you push and redeploy.
6. Deploy. Vercel will run `npm run build` and serve `dist/`.

### Netlify

1. **New site from Git** → choose repo.
2. **Build command:** `npm run build`  
   **Publish directory:** `dist`
3. **Site settings → Build & deploy → Environment**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if needed.
4. **SPA fallback (fixes 404 on reload):** You need `public/_redirects` in the repo containing:
   ```
   /*    /index.html   200
   ```
   This file is already in the repo and is copied to `dist/` during build. Redeploy after adding or changing it so Netlify picks it up.
5. Trigger a deploy. Netlify runs the build and serves `dist/`.

### Cloudflare Pages

1. **Pages → Create project → Connect to Git** → select repo.
2. **Framework preset:** Vite (or None).  
   **Build command:** `npm run build`  
   **Build output directory:** `dist`
3. Add env vars in **Settings → Environment variables** (for Production and/or Preview).
4. Save and deploy. Cloudflare runs the build and serves the output directory.

### GitHub Pages (static)

1. In the repo: **Settings → Pages** → Source: **GitHub Actions** (or upload `dist/` from a workflow).
2. Use a workflow that runs `npm run build` and uploads `dist/` (e.g. `actions/upload-pages-artifact` and `actions/deploy-pages`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets if you use Supabase.
3. After the workflow runs, the site is available at `https://<user>.github.io/<repo>/`. If the app is not at the root, set `base` in `vite.config.js` (e.g. `base: '/kettlebell-app/'`) and rebuild.

### Other static hosts

Any host that can run `npm run build` and serve the `dist/` directory will work. Ensure:

- Build command: `npm run build`
- Publish/root directory: `dist`
- Env vars for Supabase (if used) are set for the build step.

**Examples:** Render (static site), Firebase Hosting, AWS S3 + CloudFront, Azure Static Web Apps. Use the same pattern: run the build, upload or sync `dist/`, and configure SPA fallback to `index.html` for client-side routes.

---

## Database (Supabase)

If you use Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor**.
3. Paste the contents of **`supabase-schema.sql`** from this repo and run it.
4. In **Settings → API**, copy the Project URL and anon key into your host’s env vars as above.

No migrations are required for the current schema. One-time setup is enough.

---

## Post-deploy checklist

- [ ] `npm run build` succeeds locally (and in the host’s build logs).
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in the host’s build environment if you use Supabase.
- [ ] Supabase project has the `workout_sessions` table (run `supabase-schema.sql` once).
- [ ] Publish/output directory is **`dist`**.
- [ ] Opening the deployed URL shows the app (home screen with “Today’s rotation”).
- [ ] Optional: complete a workout and confirm a row appears in Supabase **Table Editor** for `workout_sessions`.

---

## Custom domain and HTTPS

Most hosts (Vercel, Netlify, Cloudflare Pages) provide HTTPS and custom domain setup in their dashboard. Point your domain’s DNS to the host as instructed; no extra config is needed in the app.

---

## Vite build configuration

The project uses default Vite settings. If you need a custom base path (e.g. for GitHub Pages under a subpath), add to `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',  // trailing slash for subpath
});
```

Rebuild and deploy; all asset paths will use that base.

---

## Troubleshooting

- **404 on refresh / direct URL** – Single-page apps need the server to serve `index.html` for all routes. Configure the host to redirect (or rewrite) missing paths to `index.html` (e.g. Netlify `_redirects`, Vercel `rewrites`).
- **Env vars not applied** – They must be set for the **build** step and prefixed with `VITE_`. Restart or redeploy after changing them.
- **Supabase CORS** – If you see CORS errors when saving sessions, check Supabase **Settings → API** and ensure your deployed origin is allowed if you’ve restricted allowed origins.
- **Build fails on host** – Ensure Node version is 18+ (many hosts let you set `NODE_VERSION` or use an `.nvmrc` file). Run `npm run build` locally first to confirm.
