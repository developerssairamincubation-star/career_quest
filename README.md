# Career House Quest

Career discovery for Grades 9–12 in the Sairam Grand House Alliance. Next.js 16 + Supabase.
The original static prototype is kept untouched at `~/Downloads/AI/career/career-quest`.
Agreed scope: [docs/FEATURES.md](docs/FEATURES.md).

## Phase 1 (this release)
- Email + password sign-in; roles: student, teacher, counsellor, admin. No public sign-up.
- Level 1 assessment with autosave, resume on any device, and retakes (points count once).
- Fair scoring on the server (`src/lib/scoring.ts`, tested in `src/lib/__tests__`): fixed weights, no cap, no default answers, ties shown as ties.
- Results page showing how each match score was built up; print to PDF.
- Staff: house standings, per-class progress, student results, CSV import of students, staff accounts, teacher-to-class assignment, password reset.

## Levels 2–5
- Each level opens once the previous one is sent to the teacher (Level 2 once Level 1 is done). Enforced in the database by `level_unlocked()`.
- Write-ups autosave; they're locked while waiting for review. Teachers approve (adds 100 points) or send back with feedback at **Reviews**.
- Level 4's scholarship checker runs in the browser only; category, income and disability answers are never saved.

## Setup
1. Supabase Dashboard → SQL Editor → paste and run `supabase/migrations/0001_phase1.sql`, then `0002_levels.sql`.
2. `.env` holds the public URL and anon key. `.env.local` must contain `SUPABASE_SERVICE_ROLE_KEY=...` (see `.env.example`).
3. `npm install`
4. Create the school and first admin:
   `node --env-file=.env --env-file=.env.local scripts/bootstrap-admin.mjs "School name" CODE admin@school.edu "Admin Name"`
5. `npm run dev`, sign in as the admin, then **Add students** (CSV template in the app) and **Classes and staff**.

`npm test` runs the scoring tests.
