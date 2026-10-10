# Habit Tracker

A simple daily habit tracker with streaks, a calendar, stats, and **Journey**: an AI-generated, step-by-step roadmap you unlock one step at a time.

Built with Next.js (App Router), PostgreSQL + Prisma, Better Auth, and Claude.

## Features

- **Today**: check off today's habits and see the week at a glance.
- **Habits**: create, edit and delete habits with a goal, frequency, colour and reminder time; each habit has its own history and streaks.
- **Calendar**: month view of which habits were done on each day.
- **Stats**: weekly completion over the last 12 weeks and per-habit completion rates.
- **Journey**: paste text, describe a goal, or upload a PDF, and Claude turns it into 6–25 ordered steps. Each step stays locked until the one before it is done. View it as a winding path or a checklist.
- **Settings**: name, theme (light / dark / system), week start, reminders, account deletion.
- Email + password sign-in, mobile-friendly layout, installable as a PWA.

## Tech stack

| Part | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions), React 19, TypeScript |
| Database | PostgreSQL (hosted on [Neon](https://neon.tech)) via [Prisma 7](https://www.prisma.io) |
| Auth | [Better Auth](https://www.better-auth.com) (email + password) |
| AI | [Anthropic API](https://docs.anthropic.com) (`@anthropic-ai/sdk`), PDF text via [`unpdf`](https://github.com/unjs/unpdf) |
| Styling | Plain CSS with design tokens in `app/globals.css`, Tailwind v4, Fraunces + DM Sans |

## Getting started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database (a free [Neon](https://neon.tech) project works)
- An [Anthropic API key](https://console.anthropic.com), needed only for the Journey feature

### Setup

```bash
# 1. Install dependencies (this also generates the Prisma client)
npm install

# 2. Create your environment file, then fill in the values
cp .env.example .env

# 3. Create the database tables
npx prisma migrate deploy

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and add your first habit.

### Environment variables

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret used to sign sessions; generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL of the app (`http://localhost:3000` locally, your live URL in production) |
| `ANTHROPIC_API_KEY` | Used on the server to generate Journey roadmaps; never sent to the browser |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (includes type checking) |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npx prisma migrate deploy` | Apply database migrations |
| `npx prisma studio` | Browse the database in your browser |

## Project structure

```
app/                 Routes (each folder is a page)
  home/              Today view
  habits/            Habit list and habit detail (habits/[id])
  Calendar/          Month calendar
  Statistics/        Charts and completion rates
  journey/           Journey roadmap
  Profile/           Settings
  login/             Sign in / sign up
  api/auth/          Better Auth endpoint
components/          UI components (client components draw what the pages load)
lib/
  data.ts            Reads for habits, logs, stats (always scoped to the logged-in user)
  actions.ts         Server Actions for habits and settings
  journey-*.ts       Journey: data, Server Actions, Claude call
  pdf-text.ts        PDF text extraction for Journey
  auth.ts            Better Auth config
  session.ts         requireUser(): the logged-in user, or redirect to /login
  prisma.ts          Prisma client
prisma/
  schema.prisma      Database schema
  migrations/        SQL migrations
proxy.ts             Sends logged-out visitors to /login
```

### Conventions

- **Server pages load data, client components draw it.** Pages in `app/` call functions from `lib/`; components in `components/` receive plain data as props.
- **Every read and write starts with `requireUser()`** and filters by the user's id, so users can only see and change their own data.
- **Derived state over stored state.** For example, whether a Journey step is "locked" is computed from the first unfinished step, not saved in the database.


## Deployment

The app is set up for [Vercel](https://vercel.com):

1. Import this repository in Vercel.
2. Add the four environment variables above. Use a **new** `BETTER_AUTH_SECRET` for production and set `BETTER_AUTH_URL` to your live URL.
3. Run `npx prisma migrate deploy` against the production database before (or right after) the first deploy.

Note: Vercel limits request bodies to about 4.5MB, so large PDF uploads for Journey may be rejected there.

Tip: use a separate database (or a Neon branch) for development, so local testing never touches real users' data.

## License

No license has been chosen yet; all rights reserved by the author.
