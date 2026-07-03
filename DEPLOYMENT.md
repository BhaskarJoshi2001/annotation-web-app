# Production deployment checklist (Vercel)

## 1. Vercel project

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo. Framework
   preset: **Next.js** (auto-detected). No custom build settings needed.
3. Add **all** environment variables from `.env.example` under
   Project → Settings → Environment Variables (Production). Copy real
   values from your local `.env.local`, with the exceptions below.

## 2. Clerk — switch to a production instance

Dev keys (`pk_test_/sk_test_`) only work on localhost.

1. Clerk dashboard → your app → **Production** instance (create it).
2. Add your production domain; follow Clerk's DNS instructions (CNAME).
3. Copy the `pk_live_...` / `sk_live_...` keys into Vercel env vars.
4. In **SSO connections**, re-enable Google OAuth for production (needs
   your own Google OAuth credentials in prod — Clerk walks you through it).

## 3. R2 — CORS for the production domain

Cloudflare dashboard → R2 → `annotation-images` → Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://YOUR-DOMAIN.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Without this, uploads and the annotation canvas fail in production.

## 4. fal.ai

1. Make sure the account has balance (SAM calls fail on $0).
2. Set a **spending limit** at fal.ai/dashboard/billing.
3. Rotate the API key if it was ever shared, and use the new one in Vercel.

## 5. Database

`npm run db:push` has already been run against Neon — the same database
works in production. For a cleaner setup later, create a separate Neon
branch (`production`) and point the Vercel `DATABASE_URL` at it.

## 6. Post-deploy smoke test

- [ ] `/landing` renders logged-out
- [ ] Sign up with email → arrives at `/onboarding` → project + upload work
- [ ] Google OAuth sign-in works
- [ ] Dashboard shows the project; dataset gallery loads thumbnails
- [ ] Workspace: draw a bbox, reload, it persisted
- [ ] AI select: click an object, polygon appears
- [ ] Export COCO from the dataset page; row appears in `/exports`
- [ ] Sidebar usage widget shows real counts

## 7. Recommended next (not launch-blocking)

- **Sentry** (`npx @sentry/wizard@latest -i nextjs`) — error tracking
- **PostHog** — product analytics; both have generous free tiers
- **Vercel Firewall** rate-limit rule on `/api/*` as a belt-and-braces
  layer on top of the app's own quotas
- Playwright smoke tests for the flows in section 6
