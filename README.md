# AB Class 7 Learning Portal

A study portal for the Alberta Class 7 learner's knowledge test. Students read
lessons by topic, practise questions with instant feedback, and take a timed
mock exam. Admins manage topics, questions, lesson content and user approvals.

Built with Next.js (App Router), NextAuth (credentials + JWT sessions),
Drizzle ORM on Postgres (Neon), Vercel Blob for images, and Tailwind/shadcn.

## Features

- **Learn** (`/learn`): lesson content per topic, public.
- **Practice** (`/practice/[slug]`): 5 random questions per topic, answer
  checked on the server with an explanation.
- **Mock exam** (`/mock-exam`): 30 random questions, 30-minute timer,
  80% to pass, graded on the server.
- **Admin** (`/admin`): dashboard stats, create/edit topics and questions,
  image upload, approve or disable users.

Practice and the mock exam require an account that an admin has approved.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

| Variable                | Required | Purpose                                                                |
| ----------------------- | -------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`          | yes      | Postgres connection string                                             |
| `NEXTAUTH_SECRET`       | yes      | Signs session tokens. Generate with `openssl rand -base64 32`           |
| `NEXTAUTH_URL`          | prod     | Public URL of the site, e.g. `https://your-app.vercel.app`              |
| `BLOB_READ_WRITE_TOKEN` | uploads  | Vercel Blob token, needed for admin image uploads                      |

`.env` is gitignored. Never commit it.

### 3. Database

```bash
npm run db:migrate   # apply migrations in db/migrations
npm run db:seed      # optional: sample data
```

After changing `db/schema.ts`, create a new migration with
`npm run db:generate`, review the SQL it writes to `db/migrations/`, then run
`npm run db:migrate`.

### 4. Create the first admin

Register an account at `/register`, then promote it in the database:

```sql
UPDATE users SET role = 'ADMIN', is_approved = true WHERE email = 'you@example.com';
```

Changes to a user's role or approval apply on their next page load; no
re-login is needed.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | What it does                         |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start the dev server                 |
| `npm run build`       | Production build                     |
| `npm run start`       | Run the production build             |
| `npm run lint`        | ESLint                               |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate`  | Apply pending migrations             |
| `npm run db:seed`     | Seed sample data                     |

## Project structure

```
app/
  actions/          server actions (grading, answer checks, registration)
    admin/          admin-only actions; each calls requireAdmin()
  admin/            admin pages (layout checks the ADMIN role)
  learn/ practice/ mock-exam/ login/ register/
  api/auth/         NextAuth config
components/
  other/            app components
  ui/               shadcn/ui primitives
db/
  schema.ts         Drizzle schema
  queries/          read queries used by pages
  migrations/       generated SQL migrations
lib/
  auth.ts           requireAdmin() / requireApprovedUser()
proxy.ts            redirects logged-out users away from practice/mock exam
```

## Security notes

- Every server action is a public endpoint. Admin actions must start with
  `await requireAdmin()`, student actions with `await requireApprovedUser()`.
- Answers are graded on the server; the correct choice is never sent to the
  browser before the student answers.
- Image uploads are admin-only, limited to PNG/JPEG/WebP/GIF up to 4 MB.
