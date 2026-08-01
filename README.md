# MusclOrg

MusclOrg is a strength-training programming and tracking app. It lets you build structured, periodized training programs (blocks-of-exercises style), follow them through a guided workout mode, log your real performance, and see your progress over time per exercise.

It was built to solve a specific gap: most fitness apps are either rigid templates or plain logbooks. MusclOrg is meant to sit in between — a **programming tool** (build your own periodization, mesocycles, weeks, sessions, exercise blocks with real set strategies) **and** a **training companion** (guided workout mode, rest timer, performance logging, history charts).

## Core concepts

The data model mirrors how a program is actually structured:

```
Program
 └─ Phase (mesocycle, e.g. "Block 1 — Strength")
     └─ Week (microcycle, can be marked as a deload)
         └─ Session (a single workout, e.g. "Push Day", optionally tied to a day of the week)
             └─ Session Block (one exercise instance within that session)
```

A **Session Block** is deliberately decoupled from the **Exercise** it references. An exercise (e.g. "Bench Press") is just a catalog entry — a movement, a muscle group, an optional personal record. How it's actually executed (sets, reps, weight, rest, set strategy) lives entirely on the block, so the same exercise can be programmed completely differently from one session to the next.

### Weight resolution
A block's working weight can be either:
- **Fixed** — a plain kg value, or
- **% of PR** — a percentage of the exercise's recorded personal record (weight + reps), computed automatically.

Either mode can also be overridden **per individual set** (fixed or %PR), for cases like a top set followed by manually-tuned back-off sets.

### Set strategies
Each block has a set strategy that actually drives the generated set-by-set breakdown (reps/weight per set), not just a label:

`straight` · `pyramid up/down` · `back-off` · `drop set` · `rest-pause` · `cluster` · `AMRAP last set` · `myo-reps`

Each strategy has its own editable parameters (e.g. number of top sets, back-off %, drop count, mini-set count) and the resulting sets are computed live by a pure function (`lib/computeSets.ts`) — no strategy logic lives in the UI components.

## Features

- **Auth** — Supabase email/password auth.
- **Exercise library** — per-user exercises with multiple muscle groups, optional warm-up flag, optional PR (weight + reps), optional "suggested" defaults (kept clearly separate from actual block configuration).
- **Program builder** — drag-and-drop board (dnd-kit): drag exercises from a library panel onto sessions to create blocks, reorder blocks within a session, phases/weeks/sessions collapsible for screen space.
- **Copy/paste** — duplicate a whole mesocycle into another program, a session into another week, or a single block into another session.
- **Home dashboard** — current week's sessions at a glance, week navigator (auto-opens the week you last logged performance on), quick stats.
- **Guided training mode** (`/train/:sessionId`) — one set at a time, shows the current set, a preview of the next one, remaining sets/exercises count, a rest timer that keeps counting (and turns red) past the planned rest instead of stopping, and an end-of-session summary of any reps/weight that deviated from plan with a shortcut back to the program editor.
- **Workout view** (`/workout/:sessionId`) — read/log view of a session: planned vs. actual side by side, per set.
- **History / progress** (`/history`) — per-exercise progress chart, switchable between "weight only" and "weight × reps (volume)", every logged set plotted individually (not averaged/collapsed per day).
- **Profile** — height, weight, wingspan, sex, age, sports practiced, training start month/year, goal, experience level.
- Retro 16-bit visual theme (pixel fonts, hard corners, pixel-art button bevels) — purely cosmetic, layered on top of the above via CSS custom properties and a couple of shared UI components.

## Tech stack

**Frontend**
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/), built with [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`, no separate PostCSS config)
- [react-router-dom](https://reactrouter.com/) for routing
- [dnd-kit](https://dndkit.com/) (`core` + `sortable`) for the drag-and-drop program board
- [Recharts](https://recharts.org/) for the progress charts

**Backend**
- [Supabase](https://supabase.com/) — Postgres database, auth, and auto-generated REST API (PostgREST) via `@supabase/supabase-js`. No custom backend server; the frontend talks to Supabase directly, with all access control enforced by Postgres Row Level Security.

**Hosting**
- [Vercel](https://vercel.com/) — auto-deploys on push to `main`.

## Database

All tables live in the `public` schema and are protected by Row Level Security — a user can only see/modify their own data (and, in future, data explicitly shared with them via `friendships`).

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. Pseudo, body stats, sports, goal, experience level. Auto-created via trigger on signup. |
| `exercises` | The user's exercise catalog. Muscle groups (array), optional PR (weight + reps), optional suggested defaults, optional warm-up config. |
| `programs` | Top-level container. Has a `locked_by`/`locked_at` pair reserved for future collaborative editing. |
| `phases` | Mesocycles within a program. Periodization type (`linear`/`oscillating`/`flat`/`custom`), order. |
| `weeks` | Microcycles within a phase. Week number, deload flag. |
| `sessions` | A single workout within a week. Name, day of week, order. |
| `session_blocks` | One exercise instance within a session: sets/reps, weight (fixed or %PR + per-set overrides), rest, set strategy + its config (jsonb), superset grouping. |
| `friendships` | Scaffolding for future sharing (read/write permission between users). Not yet exposed in the UI. |
| `workout_logs` | One row per session actually performed on a given date. |
| `set_logs` | Real reps/weight/completion logged per set, tied to a `workout_log` and the planned `session_block`. This is what powers the history charts. |

Key design decisions worth knowing if you're extending the schema:
- `get_program_access(program_id, user_id)` is a `SECURITY DEFINER` function (with `SET row_security = off` to avoid RLS self-recursion) used by the SELECT/UPDATE policies on `programs`/`phases`/`weeks`/`sessions`/`session_blocks` — it returns `'owner'`, `'read'`, `'write'`, or `null`.
- The `programs` SELECT policy short-circuits on `owner_id = auth.uid()` before calling that function, specifically to avoid an RLS recursion issue that shows up on `INSERT ... RETURNING` (the insert's own `RETURNING` clause re-triggers the SELECT policy on the just-inserted row).
- Migrations are plain `.sql` files (no migration tool/CLI) — see below.

## Project structure

```
src/
├── components/
│   ├── dashboard/       # Home page widgets (week overview, set tables)
│   ├── exercices/       # Exercise form/card
│   ├── programs/        # Program board: phases, weeks, sessions, blocks, drag-and-drop, copy pickers
│   └── ui/               # Shared primitives: Button, Input, Select, ChipMultiSelect, icons
├── hooks/                # One hook per data concern (usePrograms, useProgramDetail, useWorkoutLog, useExerciseHistory, ...)
├── lib/
│   ├── computeSets.ts    # Pure function: block config → list of {reps, weight} per set
│   └── supabase.ts       # Supabase client
├── pages/                # One component per route
└── types/                # Shared TypeScript types, one file per domain concept
```

`lib/computeSets.ts` is intentionally the only place that knows how to turn a set strategy + config into an actual list of sets — every screen that needs "what should this set look like" (the program editor, the read-only workout view, the guided training mode) goes through it, so the three stay consistent by construction.

## Running locally

```bash
npm install
npm run dev
```

You need a `.env` file at the project root (not committed) with:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

### Database setup

There's no migration runner — SQL files are meant to be pasted into the Supabase SQL editor, in roughly chronological order (the base schema first, then each feature migration). If you're setting up a fresh Supabase project, you'll need the base schema plus every `migration_*.sql` that was generated while building this out (set strategies, PR tracking, muscle group arrays, weight modes, workout logs, extended profile fields, etc.).

## Deployment

Connected to Vercel; every push to `main` triggers a build (`tsc -b && vite build`) and deploy. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are set in the Vercel project settings, mirroring the local `.env`.
