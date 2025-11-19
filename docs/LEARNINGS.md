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
