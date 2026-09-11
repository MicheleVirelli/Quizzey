# Quizzey — Setup guide

Quizzey is a real-time 1v1 trivia web app built with **Next.js** + **Supabase**,
deployed on **Vercel**. This guide gets the backend connected and the app online.

## 1. Supabase — database

You've already created a Supabase project. Now load the schema and seed data:

1. Open your project at [supabase.com](https://supabase.com) → **SQL Editor**.
2. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and run it. This creates all tables, security rules and triggers.
3. Paste the contents of [`supabase/seed.sql`](supabase/seed.sql) and run it. This adds
   the starter topics (General Knowledge, Istanbul, World Geography, Football) with
   10 questions each.

> Re-running either file is safe — they won't duplicate data.

### Auth settings

In Supabase → **Authentication** → **Providers**, keep **Email** enabled. For the
smoothest testing, under **Authentication → Sign In / Providers → Email**, you can turn
**"Confirm email"** off during development so new sign-ups work instantly.

## 2. Environment variables

The app needs two **public** values (safe to expose in the browser):

| Name | Where to find it | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API keys → publishable key | `sb_publishable_...` |

⚠️ Never use or commit the **secret** key (`sb_secret_...`). It isn't needed for this app.

### Local development

Copy `.env.example` to `.env.local` and fill in both values, then:

```bash
npm install
npm run dev
```

Open <http://localhost:3000/health> — it should say **✅ Connected to Supabase**.

### Vercel (production)

1. In Vercel, open your **project** (not team) → **Settings** → **Environment Variables**.
   On mobile the Settings sub-menu is a dropdown at the top of the page.
2. Add both variables above, selecting **all** environments (Production, Preview,
   Development), and **Save**.
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy) so the new variables take effect.
4. Open `https://<your-deployment>.vercel.app/health` to confirm the connection.

## 3. Development workflow

Because development happens from a phone via Claude Code on the web, the loop is:

> code is pushed to the `claude/quiz-up-app-recreation-s4t1g0` branch → Vercel builds a
> **preview deployment** for that branch → open the preview URL on your phone to try it.

Set the env vars for the **Preview** environment too, so branch previews can reach Supabase.

## 4. Useful commands

```bash
npm run dev     # local dev server
npm run build   # production build
npm run test    # unit tests (scoring rules)
```
