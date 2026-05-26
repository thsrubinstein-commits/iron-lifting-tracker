# Iron — Lifting Tracker (staged Supabase rebuild)

Editable Vite + React + Tailwind source for the Iron lifting tracker, set up
for a staged migration to Supabase. Stage 1 (this commit) ships the
foundation: the visual shell, auth scaffolding, and a draft migration. See
[`STAGES.md`](./STAGES.md) for what Stages 2 / 3 / 4 do.

## Quickstart

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # → dist/
npm run preview
```

Without env vars, the app boots into **demo mode** (in-memory mock user, all
pages render from `src/data/mock.ts`). To go live with real Supabase Auth:

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
```

## What's here

- `src/App.tsx` — routes + auth gate.
- `src/components/AppShell.tsx`, `Nav.tsx` — desktop top pill-nav, mobile
  bottom 5-icon nav, page header primitive.
- `src/components/AuthScreen.tsx` — logged-out sign-in / sign-up surface.
- `src/context/AuthContext.tsx` — Supabase auth state with a demo fallback.
- `src/context/ThemeContext.tsx` — light/dark toggle.
- `src/lib/supabaseClient.ts` — lazy Supabase client; reads
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `src/data/mock.ts` — placeholder workouts/PRs/goals/nutrition/plan that
  Stage 3+ replaces with real queries.
- `supabase/migrations/001_initial_schema.sql` — DB schema draft (not
  applied). Tables: `profiles`, `workouts`, `workout_sets`, `goals`,
  `nutrition_entries`, `exercise_prs`, `plans`. All RLS-protected.

## Design references

Visual direction follows the live deployment at
`iron-lifting-tracker.vercel.app`: warm cream surfaces, ink text, a single
rust accent, pill-shaped CTAs, mono uppercase eyebrows, generous rounded
cards. Numbers shown on the home dashboard mirror the live example (1
session this week, 8,150 lb volume, best e1RM 260 pull-up).
