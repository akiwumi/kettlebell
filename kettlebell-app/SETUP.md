# Quick setup

Get the Kettlebell Gym app running locally in a few minutes.

---

## Prerequisites

- **Node.js** 18 or newer (LTS recommended)
- **npm** (comes with Node) or yarn/pnpm

Check versions:

```bash
node -v   # v18.x or higher
npm -v
```

---

## 1. Clone and install

```bash
cd kettlebell-app
npm install
```

If you see lockfile or engine warnings, they can usually be ignored for local development. For a clean install:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 2. Environment (optional)

The app runs **without a database**. All core features (daily rotation, timer, library) work with no configuration. To persist workout history in Supabase:

1. **Copy the example env file**
   ```bash
   cp .env.example .env
   ```

2. **Create a [Supabase](https://supabase.com) project**  
   Sign up, create a project, and wait for it to be ready.

3. **Get your keys**  
   In Supabase: **Settings → API** copy:
   - **Project URL** → use for `VITE_SUPABASE_URL`
   - **anon public** key → use for `VITE_SUPABASE_ANON_KEY`

4. **Paste into `.env`**
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

5. **Create the table**  
   Open **SQL Editor** in the Supabase dashboard, paste the contents of `supabase-schema.sql`, and run it.

If you skip this step, the app still works; completed sessions simply won’t be saved to a database.

---

## 3. Run the app

```bash
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`). You should see the home screen with today’s rotation and links to **Start session** and **Exercise library**.

---

## 4. Build for production

```bash
npm run build
```

Output is in the `dist/` folder. To test the production build locally:

```bash
npm run preview
```

Then open the URL printed (e.g. `http://localhost:4173`). This serves the same assets you’d get after deploying.

---

## Optional: Run without Supabase

You can develop and build without ever creating a `.env` file. The app will:

- Show today’s rotation and the library.
- Run full timer sessions and show the completion screen.
- Omit only the step of writing completed sessions to Supabase (no errors; the save is skipped when the client is not configured).

---

## Troubleshooting

- **Port in use** – Vite will offer another port (e.g. 5174). Use that, or set `PORT=3000` and run `npm run dev` if your tooling supports it.
- **Blank page** – Open devtools (F12) and check the Console for errors. Ensure you’re using a modern browser and that `npm run build` completes without errors.
- **Supabase not saving** – Confirm `.env` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, that you restarted the dev server after adding them, and that `supabase-schema.sql` was run in the Supabase SQL Editor.

### Where to go next

- **README.md** – Project structure, tech stack, data model, and scripts.
- **FEATURES.md** – Full feature list and component reference.
- **DEPLOY.md** – How to deploy to Vercel, Netlify, Cloudflare Pages, and others.
