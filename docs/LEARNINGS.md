# Learnings

This document captures errors encountered during development and their solutions. Update this whenever you resolve a new issue.

---

## SQLite Limitations

### VarChar Not Supported
**Error**: Prisma schema error with `@db.VarChar(2)`

**Cause**: SQLite doesn't support VarChar type annotations

**Solution**: Remove all `@db.VarChar()` annotations from Prisma schema. SQLite treats all strings as TEXT.

```prisma
// Wrong
code String @db.VarChar(2)

// Correct
code String
```

---

### skipDuplicates Not Supported
**Error**: `createMany` with `skipDuplicates: true` fails

**Cause**: SQLite doesn't support the `ON CONFLICT DO NOTHING` clause that `skipDuplicates` uses

**Solution**: Use individual `upsert` calls instead of `createMany`:

```typescript
// Wrong
await prisma.type.createMany({
  data: types,
  skipDuplicates: true,
});

// Correct
for (const type of types) {
  await prisma.type.upsert({
    where: { code: type.code },
    update: {},
    create: type,
  });
}
```

---

## Prisma Client Cache

### Stale Client After Schema Changes
**Error**: "Failed to create inventory item" or column not found errors after schema changes

**Cause**: Prisma client is cached in `.next` directory and doesn't reflect schema changes

**Solution**: Regenerate client and clear Next.js cache:

```bash
npx prisma generate
rm -rf .next
npm run dev
```

Always run these commands after modifying `schema.prisma`.

---

## CSS/Styling Issues

### Text Not Legible (Too Light)
**Error**: Form inputs and text appear too light/unreadable

**Cause**: Tailwind's default dark mode styles or inherited color values

**Solution**: Force black text explicitly in globals.css:

```css
:root {
  --background: #ffffff;
  --foreground: #000000;
}

body {
  background: var(--background);
  color: var(--foreground);
}

input, select, textarea, button {
  color: #000000;
}
```

Remove any `@media (prefers-color-scheme: dark)` blocks if not needed.

---

## Next.js App Router

### Dynamic Route Params
**Pattern**: In Next.js 15+, route params are now a Promise

```typescript
// Current pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  // ...
}
```

---

## npm/Node.js

### workspace:* Protocol Error
**Error**: npm doesn't recognize `workspace:*` protocol

**Cause**: This is a pnpm/yarn workspace syntax, not supported by npm

**Solution**: Use `*` or specific version instead:

```json
// Wrong (pnpm syntax)
"@maro/shared": "workspace:*"

// Correct (npm)
"@maro/shared": "*"
```

---

## Database Directory

### Database File Not Created
**Error**: Cannot create database file

**Cause**: Parent directory doesn't exist

**Solution**: Ensure directory exists before database operations:

```typescript
import fs from 'fs';
import path from 'path';

const dbPath = './prisma/data';
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}
```

---

## Railway Deployment

### Node.js Version Mismatch
**Error**: `EBADENGINE Unsupported engine { required: { node: '>=20.9.0' }, current: { node: 'v18.20.5' } }`

**Cause**: Next.js 16 requires Node.js ≥20.9.0, but Railway defaults to older version

**Solution**: Specify Node.js version in two places:

1. Create `.nvmrc`:
```
20
```

2. Add `engines` to package.json:
```json
{
  "engines": {
    "node": ">=20.9.0"
  }
}
```

---

### Prisma DATABASE_URL Required at Build Time
**Error**: `P1012: Environment variable not found: DATABASE_URL` during `npm run build`

**Cause**: Prisma validates schema.prisma during build, but DATABASE_URL isn't available until runtime in Railway

**Solution**: Use placeholder URL in schema that gets overridden at runtime:

1. In `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  // Placeholder for build-time validation
  url = "postgresql://placeholder:placeholder@placeholder:5432/placeholder"
}
```

2. In `prisma.config.ts`:
```typescript
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    // Real URL from environment overrides schema placeholder
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@placeholder:5432/placeholder",
  },
});
```

3. Add to package.json:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

---

### Database Connection Timeout on Startup
**Error**: `P1001: Can't reach database server at [internal-address]` during Railway deployment start

**Cause**: Start command tries to run database migrations before Railway's internal networking is ready

**Solution**: Simplify start command, run migrations manually after deploy:

1. In `railway.json`:
```json
{
  "deploy": {
    "startCommand": "npm start"
  }
}
```

2. After successful deployment, run migrations via CLI:
```bash
railway link
railway run npx prisma db push
railway run npx prisma db seed
```

**Why this works**: Separating migrations from startup gives Railway time to establish database networking. Future deploys can keep using simple start command since schema is already pushed.

---

### THE SOLUTION - What Actually Works

**Problem:** prisma.config.ts with `import "dotenv/config"` prevents Railway from injecting DATABASE_URL

**Solution:** Delete prisma.config.ts, use env("DATABASE_URL") directly in schema.prisma

**Working configuration:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Simple. No placeholder.
}
```

**Railway Variables:**
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}  // Reference syntax, not hardcoded
```

**railway.json:**
```json
{
  "deploy": {
    "startCommand": "npx prisma db push && npx prisma db seed && npm start"
  }
}
```

**Why this works:**
- Railway injects DATABASE_URL at runtime (not build time)
- No dotenv needed - Railway provides env vars directly
- Migrations run in startCommand where DATABASE_URL is available
- No config file to interfere with environment

**See docs/RAILWAY_POSTGRES_DEPLOYMENT.md for complete guide**

---

## Loyverse API Integration

### Fuzzy Search Returns Wrong Items
**Error**: Items showing as synced but not appearing in Loyverse, or wrong items being matched

**Cause**: Loyverse API `/items?sku=XXX` endpoint does fuzzy/partial matching instead of exact matching. Similar SKUs like `CRBGABSM25111801` and `CRBKANSM25111801` both match the same item.

**Solution**: Verify exact SKU match after search:

```typescript
const searchResponse = await fetch(`${LOYVERSE_API_URL}/items?sku=${item.sku}`);
const searchData = await searchResponse.json();

// Don't trust search results blindly - verify exact match
if (searchData.items?.length > 0) {
  const foundSku = searchData.items[0].variants?.[0]?.sku;
  if (foundSku === item.sku) {
    existingItem = searchData.items[0]; // Only if exact match
  }
}
```

---

### HTTP 405 Method Not Allowed on Item Update
**Error**: `HTTP 405` when trying to update existing items in Loyverse

**Cause**: Loyverse API doesn't support updating items via PUT or PATCH methods

**Solution**: Skip items that already exist (create-only approach):

```typescript
if (existingItem) {
  // Mark as synced since it's already in Loyverse
  await prisma.inventory.update({
    where: { sku: item.sku },
    data: { syncedToLoyverse: true }
  });
  continue; // Skip to next item
}

// Only create new items (POST)
await fetch(`${LOYVERSE_API_URL}/items`, {
  method: 'POST',
  body: JSON.stringify(loyverseItem)
});
```

---

### Unexpected End of JSON Input
**Error**: `SyntaxError: Unexpected end of JSON input` when parsing error responses from Loyverse

**Cause**: Trying to parse empty or non-JSON error responses with `.json()`

**Solution**: Get response as text first, then try parsing:

```typescript
if (!syncResponse.ok) {
  const responseText = await syncResponse.text();
  let errorMessage = `HTTP ${syncResponse.status}`;

  try {
    const errorData = JSON.parse(responseText);
    errorMessage = errorData.errors?.[0]?.details || errorMessage;
  } catch {
    errorMessage = responseText || errorMessage;
  }

  results.errors.push({ sku: item.sku, error: errorMessage });
}
```

---

## Template for New Learnings

```markdown
## [Category]

### [Short Description]
**Error**: [Error message or symptom]

**Cause**: [Root cause]

**Solution**: [How to fix]

\`\`\`[language]
// Code example if applicable
\`\`\`
```
