# Railway + PostgreSQL Deployment Guide

Complete guide for deploying Next.js + Prisma + PostgreSQL to Railway without the headaches.

---

## Prerequisites

- Railway account
- Railway CLI installed: `npm i -g @railway/cli`
- Project with Prisma + Next.js

---

## The Working Configuration

### 1. Project Files Setup

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Simple. No placeholder. No fallback.
}
```

**DO NOT create `prisma.config.ts`** - It interferes with Railway's environment variable injection.

**package.json:**
```json
{
  "engines": {
    "node": ">=20.9.0"
  },
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "start": "next start"
  }
}
```

**.nvmrc:**
```
20
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma db push --accept-data-loss && npx prisma db seed && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Deployment Steps

### Step 1: Create Railway Project

```bash
# Login to Railway
railway login

# Initialize project (optional - can use dashboard)
railway init
```

Or use Railway Dashboard → New Project → Deploy from GitHub repo

### Step 2: Add PostgreSQL Database

**In Railway Dashboard:**
1. Click "New" → "Database" → "PostgreSQL"
2. Railway automatically creates the database
3. Wait for it to show "Active" status

### Step 3: Configure Environment Variables

**In your web service → Variables tab:**

1. DATABASE_URL should already be set to:
   ```
   ${{Postgres.DATABASE_URL}}
   ```

   This is a **reference variable** that points to your PostgreSQL service.

2. Verify it shows as a reference (purple icon), NOT a hardcoded string

3. If you need to add it manually:
   - Click "New Variable" → "Add Reference"
   - Select PostgreSQL service
   - Choose "DATABASE_URL"

### Step 4: Deploy

**Option A - Auto Deploy (Recommended):**
1. Settings → Ensure "Automatic Deployments" is ON
2. Push to your branch
3. Railway auto-deploys

**Option B - Manual:**
1. Click "Deploy" button in dashboard

### Step 5: Verify Deployment

Watch the deployment logs. You should see:
1. ✅ Build succeeds
2. ✅ `prisma db push` creates tables
3. ✅ `prisma db seed` populates data
4. ✅ App starts successfully

---

## Common Issues & Solutions

### Issue: "Environment variable not found: DATABASE_URL" during build

**Cause:** Trying to use `env("DATABASE_URL")` during build phase

**Solution:**
- Use `prisma generate` (doesn't need DB connection)
- NOT `prisma db push` in build phase
- Database operations go in `startCommand` only

---

### Issue: "Can't reach database server at placeholder:5432"

**Cause:** Using placeholder URLs in schema or config

**Solution:**
- Remove any placeholder URLs
- Use `env("DATABASE_URL")` directly in schema.prisma
- Delete prisma.config.ts if it exists

---

### Issue: "P1001: Can't reach database server" during startup

**Cause:** DATABASE_URL is hardcoded to internal address or not set as reference

**Solution:**
1. Go to Variables tab
2. Delete DATABASE_URL if it's hardcoded
3. Add as reference: `${{Postgres.DATABASE_URL}}`
4. Redeploy

---

### Issue: Database connects but seed fails

**Cause:** `dotenv/config` in prisma.config.ts interfering with Railway's env vars

**Solution:**
- **Delete prisma.config.ts entirely**
- Railway injects environment variables directly - no need for dotenv
- Use env("DATABASE_URL") in schema.prisma only

---

## What NOT To Do

❌ **Don't create prisma.config.ts** - It causes environment variable conflicts

❌ **Don't use placeholder URLs** - Railway provides real DATABASE_URL at runtime

❌ **Don't hardcode DATABASE_URL** - Always use reference syntax `${{Postgres.DATABASE_URL}}`

❌ **Don't use `dotenv/config`** - Railway injects env vars directly

❌ **Don't run migrations in build command** - They need DB connection, run in startCommand

❌ **Don't skip Node.js version** - Next.js 16 requires Node 20+

---

## Production Checklist

Before deploying:

- [ ] Node.js version specified (.nvmrc + package.json engines)
- [ ] schema.prisma uses `env("DATABASE_URL")` directly
- [ ] NO prisma.config.ts file exists
- [ ] NO dotenv imports in config files
- [ ] railway.json has proper startCommand
- [ ] PostgreSQL service added to project
- [ ] DATABASE_URL set as reference variable `${{Postgres.DATABASE_URL}}`
- [ ] Seed script works locally

After first deploy:

- [ ] Database tables created (check in Prisma Studio or psql)
- [ ] Seed data populated
- [ ] App loads without errors
- [ ] Can perform database operations

---

## Branch Strategy

**Recommended approach:**

- `main` branch - SQLite for local development
- `railway-deploy` branch - PostgreSQL for Railway

Keep schema.prisma provider different between branches:
- main: `provider = "sqlite"`
- railway-deploy: `provider = "postgresql"`

This prevents local/production conflicts.

---

## Troubleshooting

### View logs
```bash
railway logs
```

### Connect to production database
```bash
railway connect Postgres
```

### Run commands in production environment
```bash
railway run npx prisma studio  # Open Prisma Studio for production DB
railway run npx prisma db push # Manually push schema
```

---

## The Key Insight

**Railway injects environment variables at runtime, NOT build time.**

This means:
- Build phase: No DATABASE_URL available (use `prisma generate` only)
- Start phase: DATABASE_URL available (run `prisma db push`, `seed`, etc.)
- No need for dotenv, .env files, or config files
- Use env() directly in schema.prisma

**Keep it simple.** The more config/workarounds you add, the more likely it breaks.

---

## Success Pattern

```
Simple schema.prisma with env("DATABASE_URL")
+ Railway reference variable ${{Postgres.DATABASE_URL}}
+ Migrations in startCommand (not build)
+ No prisma.config.ts
= Working deployment
```
