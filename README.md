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
| `ADMIN_EMAIL`           | seeding  | Admin account created by `npm run db:seed`                             |
| `ADMIN_PASSWORD`        | seeding  | Its password (min 8 characters); only used when the admin is created   |

`.env` is gitignored. Never commit it.

### 3. Database

```bash
npm run db:migrate   # apply migrations in db/migrations
```

After changing `db/schema.ts`, create a new migration with
`npm run db:generate`, review the SQL it writes to `db/migrations/`, then run
`npm run db:migrate`.

### 4. Create the admin and load content

Add the admin's login to `.env`:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=at-least-8-characters
```

Then run:

```bash
npm run db:seed -- --dry-run   # preview: reads only, writes nothing
npm run db:seed                # create the admin + import all content
```

`db:seed` is safe to run again at any time. An existing admin is left as is
(password unchanged), and only questions not already in the database are
added. Changes to a user's role or approval apply on their next page load.

| Script                       | What it does                                 |
| ---------------------------- | -------------------------------------------- |
| `npm run db:seed`            | Admin (if env vars are set) + all content    |
| `npm run db:seed-admin`      | Only the admin                               |
| `npm run db:seed-road-signs` | Only `db/data/road-signs.json`               |

Add `-- --dry-run` to any content script to preview it.

#### Adding questions

Questions live in `db/data/<topic-slug>.json`, one file per topic:

```json
{
  "topic": { "slug": "road-signs", "title": "Road Signs" },
  "questions": [
    {
      "prompt": "What does a red octagonal sign indicate?",
      "explanation": "A red octagon always means stop.",
      "imgUrl": "https://... (optional)",
      "choices": [
        { "text": "Yield" },
        { "text": "Stop", "correct": true },
        { "text": "Do Not Enter" }
      ]
    }
  ]
}
```

Each question needs a prompt, an explanation, at least 2 choices and exactly
one `"correct": true`. Files are checked before anything is written, so a
mistake in one file stops the whole import with the file and question number.

Questions are matched by their prompt text. If you edit a prompt in the admin
panel, also update it in the JSON file, or the next import will add the old
version back as a new question.

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
| `npm run db:seed`     | Create the admin and import content  |

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
  data/             question content, one JSON file per topic
  seeding/          import + admin logic used by the db:seed* scripts
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
