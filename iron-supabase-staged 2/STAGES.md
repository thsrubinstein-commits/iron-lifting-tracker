# Iron — Staged Auth + Database Rollout

This project lands the auth/database story in **four staged drops** so each
deploy is small, reversible, and verifiable. The live Vercel deployment and
Supabase project are **not yet touched** — Stages 2–4 do that work, in order.

---

## Stage 1 — Foundation (✅ done in this repo)

Goal: an editable, modern source tree that visually matches
`iron-lifting-tracker.vercel.app` and is *ready* to wire Supabase into.

What's in place:

- **Vite + React 18 + TypeScript + Tailwind v3** source project (no minified
  bundle). Run `npm install` and `npm run dev` to iterate.
- **Routes**: `/`, `/log`, `/history`, `/prs`, `/goals`, `/plan`,
  `/nutrition`, `/profile` (React Router DOM v6). 404s redirect home.
- **Layout**: desktop top pill-nav, mobile top bar + 5-icon bottom nav,
  matching the warm/minimal direction (cream surfaces, ink text, rust accent).
- **Theme**: `ThemeProvider` toggles `class="dark"` on `<html>`. Defaults to
  system preference; persists in `localStorage` when available.
- **Auth scaffolding** (`src/context/AuthContext.tsx`):
  - Wraps `@supabase/supabase-js` v2 auth state.
  - When `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` are present,
    real auth is live (just no DB writes yet — Stage 3).
  - When env vars are missing, falls back to an in-memory "demo lifter" so
    the app shell renders. Stage 2 deletes this fallback path's
    "Skip — explore as a demo lifter" button or it can simply stop firing
    once env vars are set.
- **Auth screen** (`src/components/AuthScreen.tsx`): logged-out sign in /
  sign up surface, styled to match the home hero.
- **App shell** (`src/components/AppShell.tsx`): page container, navs, page
  header primitive.
- **Mock data** (`src/data/mock.ts`): hard-coded workouts, PRs, goals,
  nutrition, plan — wired into every page. Numbers match the live home
  dashboard reference (1 session, 8,150 lb volume, best e1RM 260 on
  pull-up, latest Pull session, top goal "Bench 275 × 1").
- **Migration draft**: `supabase/migrations/001_initial_schema.sql` defines
  `profiles`, `workouts`, `workout_sets`, `goals`, `nutrition_entries`,
  `exercise_prs`, `plans`, all user-scoped with RLS policies. **Not yet
  applied to the live Supabase project.**

Untouched on purpose: the Vercel project, the Supabase project, and the
currently-deployed app. Stage 1 lives only in source.

---

## Stage 2 — Connect Supabase Auth

Goal: replace the demo-mode fallback with real Supabase Auth on the live
domain.

Tasks:

1. In the existing Supabase project, ensure **Email/Password** auth is on
   (Authentication → Providers).
2. Set the **Site URL** to `https://iron-lifting-tracker.vercel.app` and add
   `http://localhost:5173` to **Additional redirect URLs**.
3. Copy the project's **Project URL** and **publishable (anon) key** into:
   - Vercel → Project → Settings → Environment Variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Local `.env.local` (copy `.env.example`).
4. Redeploy from `main`. The auth screen now goes through Supabase; the
   demo skip button disappears automatically (`hasSupabaseEnv()` returns
   `true`).
5. Sanity check: sign up with a fresh email, confirm the inbox flow,
   verify Profile page shows `Mode: supabase` and the real email.

No code changes in this stage. If you want to delete the demo fallback
entirely after Stage 2 ships, remove `enterDemoMode` and the
`mode === 'demo'` branches from `AuthContext.tsx` and `AuthScreen.tsx`.

---

## Stage 3 — Apply DB migration + wire workouts/history

Goal: persist workouts to Supabase and read them back on Home + History.

Tasks:

1. **Apply the migration**:
   ```bash
   # Option A — Supabase CLI (recommended)
   supabase link --project-ref <ref>
   supabase db push   # applies supabase/migrations/001_initial_schema.sql

   # Option B — psql
   psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
   ```
   Verify the seven tables exist and RLS is ON (`select * from pg_tables ...`).
2. Replace `mockWorkouts` reads with Supabase queries:
   - New file `src/data/workouts.ts` exporting:
     - `listWorkouts()` → `select * from workouts order by performed_at desc`
     - `getWorkoutWithSets(id)` → workouts + workout_sets join
     - `createWorkout(input)` → inserts workout + workout_sets in a
       transaction (use a Postgres function `create_workout(workout jsonb, sets jsonb[])`
       to keep it atomic).
   - Update `Home.tsx` (last 7 days summary, latest session) and
     `History.tsx` to use these queries via React state (or
     `@tanstack/react-query` if you'd like to add it now).
3. Wire the **Save session** button in `Log.tsx` to `createWorkout`.
4. Keep the seven-day summary math (`summarizeLastSevenDays`) — it now runs
   over the real workout rows.

Stage 3 ships the moment a fresh signup can: log a workout → see it on
History → see updated counts on Home.

---

## Stage 4 — Wire PRs, Goals, Nutrition, Profile

Goal: every page reads/writes its real table.

Tasks:

1. **exercise_prs**: add a trigger on `workout_sets` insert that
   recomputes the PR row per exercise (Brzycki or Epley e1RM, your call).
   Replace `mockPRs` in `PRs.tsx`. The Home dashboard's "Best e1RM" tile
   reads from the same source.
2. **goals**: CRUD on `Goals.tsx` (add, edit, pin, archive). Home's
   "Top goal" tile reads the pinned row.
3. **nutrition_entries**: replace `mockNutrition` in `Nutrition.tsx`. Add
   an upsert form using the `(owner_id, entry_date)` unique constraint
   so the day row updates rather than duplicates.
4. **plans**: replace `mockPlan` in `Plan.tsx`. Store `days_json` as
   structured JSON; the page already maps over an array, so the data
   shape stays the same.
5. **profiles**: `Profile.tsx` reads/writes `display_name`, `unit_system`,
   `bodyweight_lb`. Bonus: pipe `unit_system` into the formatters so
   metric users see kg.
6. Optional: drop `src/data/mock.ts` entirely once every page is wired,
   or keep it as a fixture file for tests.

After Stage 4, the app is fully migrated. The Vercel deployment URL stays
the same throughout.

---

## File map (Stage 1 outputs)

```
iron-supabase-staged/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── .env.example
├── STAGES.md                                 ← you are here
├── public/favicon.svg
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql            ← draft, not applied
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── lib/supabaseClient.ts                 ← env-driven Supabase client
    ├── context/
    │   ├── AuthContext.tsx                   ← real + demo modes
    │   └── ThemeContext.tsx                  ← light/dark
    ├── components/
    │   ├── AppShell.tsx
    │   ├── AuthScreen.tsx
    │   ├── Logo.tsx
    │   └── Nav.tsx                           ← TopNav + MobileBottomNav
    ├── data/mock.ts                          ← placeholder data, Stage 3+ removes
    └── pages/
        ├── Home.tsx        Log.tsx           History.tsx     PRs.tsx
        ├── Goals.tsx       Plan.tsx          Nutrition.tsx   Profile.tsx
```

## Conventions used downstream

- All Supabase tables are scoped by `owner_id uuid references auth.users(id)`.
  `profiles` is the one exception (`id` *is* the auth uid).
- Every query goes through a thin data module under `src/data/<table>.ts`
  exporting typed functions, never raw client calls in components.
- Env vars are read once in `lib/supabaseClient.ts` — never sprinkle
  `import.meta.env` across the app.
- Hash-prefixed (`VITE_`) env vars only on the frontend. The
  publishable/anon key is safe to ship; the service-role key never enters
  this repo.
- Theme + auth state stay in React context. No global stores yet.
