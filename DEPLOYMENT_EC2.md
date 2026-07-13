# Production deployment on EC2 (Docker + nginx + Let's Encrypt)

This is the EC2 alternative to `DEPLOYMENT.md` (which covers Vercel). The
app runs as a long-lived Docker container behind nginx, with certbot
handling TLS. Everything below assumes **Ubuntu 22.04/24.04** on the
instance and that it already has an **Elastic IP** attached.

## 0. Buy a domain

Any registrar works (Namecheap, Porkbun, Cloudflare Registrar). You need
DNS control, so avoid anything that doesn't give you a real DNS zone
editor (dynamic-DNS services like DuckDNS won't work — Clerk's production
setup requires adding several CNAME/TXT records under your domain).

## 1. Point DNS at the instance

In your registrar's DNS panel, add:

- **A record**: `@` (or `www`) → your EC2 Elastic IP
- Wait for propagation (`dig yourdomain.com` should return the IP —
  usually minutes, occasionally up to an hour).

## 2. EC2 security group

Inbound rules needed:

| Port | Source    | Purpose          |
|------|-----------|------------------|
| 22   | your IP   | SSH              |
| 80   | 0.0.0.0/0 | HTTP / ACME challenge |
| 443  | 0.0.0.0/0 | HTTPS            |

## 3. Install Docker on the instance

SSH in, then:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# run docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Clone the repo and configure secrets

```bash
git clone git@github.com-personal:BhaskarJoshi2001/annotation-web-app.git
cd annotation-web-app
cp .env.example .env.production
```

Edit `.env.production` and fill in real values, **plus add one new line
not in `.env.example`**:

```
DOMAIN=yourdomain.com
```

For the first deploy, leave the Clerk keys as your existing `pk_test_`/
`sk_test_` ones so you can confirm the stack works end-to-end — you'll
swap in `pk_live_`/`sk_live_` in step 6 once the domain is live (test
keys work on any origin, just with Clerk's dev-mode banner).

## 5. First-time TLS bootstrap

```bash
./init-letsencrypt.sh you@example.com
```

This creates a temporary self-signed cert so nginx can start, brings up
`app` + `nginx`, requests the real Let's Encrypt certificate over HTTP-01
(webroot), reloads nginx with it, then starts the `certbot` renewal
sidecar. Renewals after this are fully automatic — `certbot` checks every
12h and renews when <30 days remain; `nginx` reloads every 6h to pick up
the new cert. No cron job needed.

If it fails, the most common cause is DNS not pointing at the instance
yet, or the security group blocking port 80.

## 6. Clerk — switch to a production instance

1. Clerk dashboard → your app → create the **Production** instance.
2. Add `yourdomain.com`; follow Clerk's DNS instructions (CNAME records
   for `clerk`, `accounts`, `clkmail`, DKIM — add these at your registrar
   alongside the `A` record from step 1).
3. Copy the `pk_live_...`/`sk_live_...` keys into `.env.production`.
4. In **SSO connections**, re-enable Google OAuth for production (needs
   your own Google OAuth client credentials — Clerk walks you through it).
5. **Rebuild and restart** (Clerk's publishable key is a `NEXT_PUBLIC_*`
   var, baked into the JS bundle at build time — a plain restart won't
   pick up the change):

   ```bash
   docker compose --env-file .env.production up -d --build app
   ```

## 7. R2 — CORS for the production domain

Cloudflare dashboard → R2 → `annotation-images` → Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Without this, uploads and the annotation canvas fail in production.

## 8. fal.ai

1. Confirm the account has balance (SAM calls fail at $0).
2. Set a **spending limit** at fal.ai/dashboard/billing.
3. **Rotate the API key** — treat the current one as compromised since it
   was shared outside this deployment — and put the new one in
   `.env.production`. This is a server-only secret, so a plain restart
   (no rebuild) is enough:

   ```bash
   docker compose --env-file .env.production up -d app
   ```

## 9. Database

Neon already works as-is — no change needed. Optionally create a
separate `production` branch later and point `DATABASE_URL` at it.

## 10. Redeploying after code changes

```bash
git pull
docker compose --env-file .env.production up -d --build
```

(`--build` is only strictly required when `NEXT_PUBLIC_*` vars or
dependencies changed, but it's cheap to always include — Docker layer
caching keeps it fast.)

## 11. Post-deploy smoke test

- [ ] `https://yourdomain.com/landing` renders logged-out, valid padlock/cert
- [ ] Sign up with email → arrives at `/onboarding` → project + upload work
- [ ] Google OAuth sign-in works
- [ ] Dashboard shows the project; dataset gallery loads thumbnails
- [ ] Workspace: draw a bbox, reload, it persisted
- [ ] AI select: click an object, polygon appears
- [ ] Export COCO from the dataset page; row appears in `/exports`
- [ ] Sidebar usage widget shows real counts
- [ ] `http://yourdomain.com` redirects to `https://`

## 12. Recommended next (not launch-blocking)

- `docker compose logs -f app` / `nginx` for live logs
- `ufw` (allow 22, 80, 443; deny everything else) as a second firewall
  layer on top of the security group
- Sentry (`npx @sentry/wizard@latest -i nextjs`) for error tracking
- PostHog for product analytics
- Unattended-upgrades on the instance for OS security patches
- A swap file if the instance is small (t3.micro/small) — the Next.js
  build step is memory-hungry
