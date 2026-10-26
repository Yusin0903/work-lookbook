# Lookbook

A lookbook site for a 3D-printing portfolio. Public gallery for clients and friends to browse, with a simple admin backend for uploading photos and videos.

## Stack

- Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- Cloudflare R2 (S3-compatible object storage) for photos/videos
- iron-session for admin login

## Local development

1. Start a local PostgreSQL (or put any PostgreSQL connection string in `.env`):
   ```bash
   docker run -d --name lookbook-postgres -e POSTGRES_USER=lookbook -e POSTGRES_PASSWORD=lookbook -e POSTGRES_DB=lookbook -p 55432:5432 postgres:16-alpine
   ```
2. Copy `.env.example` to `.env` and fill in the R2 settings and admin credentials (see "Setting up Cloudflare R2" below).
3. Install dependencies and run the database migration:
   ```bash
   npm install
   npx prisma migrate deploy
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Public site: http://localhost:3000, admin: http://localhost:3000/admin

## Setting up Cloudflare R2

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/) → R2 → create a bucket (e.g. `lookbook`).
2. Enable Public Access in the bucket settings to get a public URL (`R2_PUBLIC_URL`), or attach a custom domain.
3. R2 → Manage API tokens → create an Access Key scoped to just this bucket, with "Object Read & Write" permission (not an account-wide Admin token), to get `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`. Scoping it narrowly limits the blast radius if the key ever leaks.
4. The Account ID is in the right sidebar of the Cloudflare dashboard; use it for `R2_ACCOUNT_ID`.
5. Put these four values plus `R2_BUCKET` into `.env` (local) or Railway's environment variables (production).

R2's free tier (10GB storage + 1 million Class A operations/month, with no egress fees) is enough for photos and videos.

R2 itself has no hard storage cap, only usage alerts, so the app enforces its own ceiling: before accepting an upload, it sums the size of everything already stored and rejects the upload if it would push the total past `R2_STORAGE_LIMIT_BYTES` (defaults to 9GiB, just under the free tier). This protects against normal usage accidentally filling the bucket through the site; it does not protect against a leaked API key being used to write to R2 directly, bypassing the app entirely — that's what scoping the token narrowly (above) and Cloudflare's usage alerts are for.

## Automated tests

The project runs Playwright end-to-end tests (login, upload, publish/hide, delete) against a disposable test PostgreSQL, with a local S3-compatible stand-in (`s3rver`) standing in for R2:

```bash
docker compose -f docker-compose.test.yml up -d   # start the dedicated test database (port 55433)
npm run test:e2e
```

Before each run, the test database is reset to a clean schema (`prisma migrate reset`); this never touches the local dev database in `.env`. GitHub Actions (`.github/workflows/ci.yml`) runs this full suite on every push and PR.

## Deploying to Railway

1. Push this repo to GitHub, then in your Railway project use "Deploy from GitHub repo" to add a service from it, and enable Railway's auto-deploy (by default, a push to the connected branch or a PR merged into it triggers a redeploy).
2. Add a PostgreSQL service to the Railway project; Railway generates `DATABASE_URL` automatically.
3. On the web service's environment variables:
   - Reference the Postgres service's `DATABASE_URL` (Railway supports reference syntax like `${{Postgres.DATABASE_URL}}`)
   - Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
   - Set `ADMIN_USERNAME`, `ADMIN_PASSWORD` (your own admin credentials)
   - Set `SESSION_SECRET` (a random string at least 32 characters, e.g. `openssl rand -base64 32`)
4. Build and deploy commands come from `railway.json` in this repo: build uses Nixpacks' default (`npm run build`), and before every deploy Railway runs `npx prisma migrate deploy` automatically (the `preDeployCommand`) before starting `npm run start`. This applies any new migrations on every push/merge, so there's no manual migration step. If Railway doesn't pick up `railway.json` for some reason, set the same pre-deploy command manually under the service's Settings → Deploy.
5. Media files live in R2, so they don't consume Railway's disk; the Railway side only needs to run the app and talk to the database, which the Hobby plan's included usage normally covers.

## Using the admin backend

Log in at `/admin`. Once logged in you can:

- Create a work (title, description, upload multiple photos/videos)
- Edit a work (change title/description, add media, toggle "published")
- Delete a work (also deletes its media from R2)
- Delete an individual media item

Visiting any `/admin` page while logged out redirects to the login page. The public homepage only shows works marked "published".

Uploaded photos (JPEG/PNG/WebP, not GIF) are automatically resized to a 2000px max dimension and re-encoded as WebP at quality 85 before being stored — the original file you uploaded isn't kept. This is a deliberate tradeoff: true lossless recompression barely shrinks an already-lossy JPEG, while this visually-lossless-for-display conversion typically cuts file size 50-80%, which matters for staying under R2's free tier. Animated GIFs are stored as-is so their animation isn't lost. Videos are stored as-is for now; compressing them would need `ffmpeg` as a system dependency and adds real CPU cost on upload, so it's deferred until it's actually needed.
