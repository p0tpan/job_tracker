# Job Tracker

A board for tracking job applications from wishlist to offer. Drag cards
between stages, keep notes and links on each one, and see how your search is
going at a glance.

Built with Next.js 16 (App Router, Server Actions, Partial Prerendering),
React 19, TypeScript, Tailwind CSS, and Drizzle ORM on SQLite/libSQL.

## Features

- Kanban board with five stages: Wishlist, Applied, Interview, Offer, Rejected
- Drag and drop between stages, with a dropdown fallback for keyboard and touch
- Instant (optimistic) updates that sync to the database in the background
- Add, edit and delete applications with server-side validation
- Applied date is stamped automatically the first time a card leaves Wishlist
- Stats: applications sent, in progress, interview rate

## Running locally

```bash
npm install
npm run db:migrate   # create the local SQLite database (local.db)
npm run db:seed      # optional: load sample applications
npm run dev
```

Then open http://localhost:3000.

## Automatic job finder

`scripts/find-jobs.mjs` reads your resume PDF, searches job APIs, scores each
posting by keyword overlap with your skills, and adds matches to the Wishlist
with an "Auto · NN%" badge. It writes to the database directly, so the dev
server does not need to be running.

1. Copy `job-search.config.example.json` to `job-search.config.json` and fill in
   your resume path, job titles, location, `minScore` and `excludeTitleWords`.
   (The real config is gitignored because it holds a path to your resume.)
2. Optional but recommended: get a free key at developer.adzuna.com and add
   `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` to `.env.local`. Without it only
   RemoteOK is searched.
3. `npm run jobs:profile` re-reads the resume (do this after you update it),
   then `npm run jobs:find` runs a search.
4. Schedule it daily with cron (`crontab -e`):
   ```
   0 8 * * * cd /path/to/job-tracker && /path/to/node scripts/find-jobs.mjs >> jobs.log 2>&1
   ```
   Output goes to `jobs.log`. Every URL it adds is remembered in `seen_jobs`,
   so cards you delete don't come back.

## How it's built

| Piece | Where | Notes |
|---|---|---|
| Data model | `src/db/schema.ts` | One `applications` table, defined in TypeScript with Drizzle |
| Migrations | `drizzle/` | Generated with `npm run db:generate` after schema changes |
| Reads | `src/app/page.tsx` | A Server Component queries the database on each request inside `<Suspense>`, so the page shell is prerendered and the board streams in |
| Writes | `src/app/actions.ts` | Server Actions validate input and call `refresh()` so the page shows the new data |
| UI | `src/components/` | Client components for the board, cards and the add/edit dialog |

The database URL comes from `DATABASE_URL` (default `file:local.db`), so the
same code can point at a hosted libSQL database such as Turso in production.

## Roadmap

1. **Board MVP.** Track applications, drag between stages, basic stats. ✅
2. **AI job-post parsing.** Paste a posting and have the company, role,
   location, salary and key skills filled in automatically.
3. **Accounts and deployment.** Sign-in so each user sees only their own
   applications, then deploy free on Vercel + Turso.
4. **Reminders and insights.** Follow-up reminders for stale applications,
   charts of activity over time and response rate by source.
