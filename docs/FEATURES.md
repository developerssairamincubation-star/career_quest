# Career House Quest v2: Agreed Feature List

Reference prototype: `~/Downloads/AI/career/career-quest` (static HTML/CSS/JS, kept untouched).
Decisions (2026-10-12): Next.js + Supabase on Vercel · teacher approve/reject for L2–5 · email + password login.

## A. Fair evaluation
1. Career match score: each part gets a fixed share, so the total is out of 100 with no capping. Interest 50, RIASEC fit 25, working style 15, archetype 10. Ties broken by RIASEC fit, then interest. Fixes the cap and tie bug at app.js:1442.
2. Working-style and archetype ties: show both styles when they tie, instead of the first in list order (app.js:787).
3. No default answers: every slider and RIASEC item must be touched. Unanswered items are recorded as "not answered", not as 50 or 2.
4. L2–5 submissions go to `pending`. A teacher approves (fixed 100 points) or rejects with feedback. The student can resubmit after a rejection.
5. Scores and points are computed on the server, in a Postgres function or server action, never trusted from the browser. Scoring rules are shown to students.

## B. Accounts and roles
6. Email + password login (Supabase Auth). Teachers or admins bulk-create student accounts from CSV, so there's no public student sign-up.
7. Roles: student, teacher (own classes), counsellor (whole school), admin.
8. Row-level security: students see only their own rows, and teachers see only their classes.

## C. Saving progress
9. Autosave each stage and each write-up (with a short delay). Students can resume on any device.
10. Each assessment attempt is stored separately, so students can retake and see their history.

## D. Teacher and counsellor dashboard
11. Review queue for L2–5: approve or reject, with feedback.
12. Live house leaderboard (from `points_ledger`), plus progress by grade and section.
13. Class insights: archetypes, RIASEC codes, top streams, drop-off by level.
14. CSV export and PDF reports for a whole class.

## E. Content and admin
15. Careers, scholarships, exams and 2030 jobs move from data.js into the database, with an admin editor.

## F. Privacy (DPDP Act 2023, students are minors)
16. Parental-consent step before the first assessment.
17. L4 sensitive fields (category, income, disability) are optional and not stored by default.

## G. Performance and hosting
18. 44 MB video moved to YouTube (unlisted) or re-encoded to about 6 MB. House PNGs converted to WebP.
19. Deploy on Vercel, add error tracking, and load-test with about 2,000 students at once before rollout.

## H. Design
20. Redesign using frontend-design, theme-factory, impeccable and GSAP. Keeps the house identity (Varunaa, Vaaranam, Veera, Vimaana and Leo), works on phones first, and meets WCAG AA.

## Data model
schools · classes (grade, section) · profiles (role, house, class) · assessments (answers JSON, computed scores, attempt no.) · submissions (level, body, status, reviewer, feedback) · points_ledger (inserted only on approval) · content tables (careers, scholarships, exams, jobs_2030) · consents
