# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A clothing inventory SKU generator system that creates 14-character semantic SKUs encoding item attributes. Integrates with Loyverse POS for sales tracking.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Turbopack)
npm run dev

# Database operations
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed code library data
npm run db:reset     # Reset database and reseed
npm run db:studio    # Open Prisma Studio GUI

# Build and production
npm run build
npm run start
npm run lint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Barcode**: JsBarcode (Code 128)

### SKU Format
14 characters: `TTCCPPSSYYMMDDNN`
- Type (2) + Color (2) + Pattern (2) + Size (2) + Date (6: YYMMDD) + Sequence (2: 01-99)
- Example: `DRBLFLMD25101701` = Dress, Blue, Floral, Medium, Oct 17 2025, #1

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── code-library/       # GET all codes, POST/DELETE by category
│   │   ├── inventory/          # GET list, POST create
│   │   │   └── [sku]/          # GET/DELETE single item
│   │   └── loyverse/sync/      # POST sync to Loyverse
│   ├── page.tsx                # SKU generator form
│   ├── inventory/              # Inventory list with Loyverse sync
│   ├── scanner/                # Barcode scanner lookup
│   ├── codes/                  # Code library management
│   └── print/                  # Label printing (Avery 5160)
├── components/
│   ├── SKUGeneratorForm.tsx    # Main form component
│   └── Barcode.tsx             # JsBarcode wrapper
└── lib/
    └── prisma.ts               # Prisma client singleton

prisma/
├── schema.prisma               # Database schema
├── seed.ts                     # Code library seed data
└── dev.db                      # SQLite database (gitignored)

docs/
├── LEARNINGS.md                # Errors and solutions
└── PATTERNS.md                 # Reusable code patterns
```

### Data Model

**Code Libraries** (pre-populated):
- `Type` - Clothing types (SH, DR, PN, etc.)
- `Color` - Colors with optional hex values
- `Pattern` - Patterns (SD, FL, ST, etc.)
- `Size` - Universal sizes with sort order and abbreviation

**Inventory**:
- `sku` (14-char primary key)
- Foreign keys to all code libraries
- `displayName` - Auto-generated: "Type, Color Pattern, Size"
- `purchaseCost`, `sellingPrice`
- `syncedToLoyverse`, `loyverseSyncedAt` - Sync tracking

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/code-library` | GET | All code libraries |
| `/api/code-library/[category]` | POST | Add code to category |
| `/api/code-library/[category]/[code]` | DELETE | Delete code |
| `/api/inventory` | GET | List inventory (search param) |
| `/api/inventory` | POST | Create inventory item |
| `/api/inventory/[sku]` | GET | Get single item |
| `/api/inventory/[sku]` | DELETE | Delete item |
| `/api/loyverse/sync` | POST | Sync items to Loyverse |

### Key Patterns

- **SKU Generation**: POST to `/api/inventory` calculates next sequence number by querying existing SKUs with same 12-char prefix (without sequence)
- **Display Name Format**: `{Type}, {Color} {Pattern}, {Size abbrev}` (e.g., "Dress, Blue Floral, M")
- **Code Library**: Pre-populated via seed, codes are unique per category (BL in colors ≠ BL in patterns)

### Loyverse Integration

**Production-ready POS integration** - Syncs inventory items to Loyverse for sales tracking.

**Setup:**
- Requires `LOYVERSE_API_TOKEN` environment variable
  - Local: Add to `.env.local`
  - Railway: Add via Railway dashboard Variables tab
- Get token from Loyverse Dashboard → Settings → Developer Tools → API Access Tokens

**How it works:**
1. Select items in Inventory page
2. Click "Sync to Loyverse" button
3. API checks if item exists (by SKU)
4. Creates new items only (Loyverse API doesn't support updates)
5. Marks items as synced in database

**Item mapping:**
- `item_name` → Display name (e.g., "Dress, Blue Floral, M")
- `reference_id`, `sku`, `barcode` → 14-char SKU
- `cost` → Purchase cost
- `default_price` → Selling price
- `category_id` → Auto-mapped by type name (creates if needed)
- `track_stock` → Enabled

**Important notes:**
- **Exact SKU matching**: Loyverse search uses fuzzy matching, we verify exact match to prevent false duplicates
- **Create-only**: Items already in Loyverse are skipped (API limitation)
- **Error handling**: Improved to parse non-JSON error responses
- **Logging**: Detailed console logs for debugging sync issues

**See:** `src/app/api/loyverse/sync/route.ts:1-242`

## Important Notes

- SKUs are immutable once generated - use notes field for corrections
- Maximum 99 items per attribute-date combination
- Database file is in `prisma/dev.db` (gitignored)
- Always run `npx prisma generate` after schema changes, then restart dev server

## Railway Deployment

### Branch Strategy

**IMPORTANT**: This project uses a two-branch workflow:

- **`main` branch** → Local development
  - SQLite database (`prisma/dev.db`)
  - Test and develop features here
  - `.env.local` for environment variables

- **`railway-deploy` branch** → Production deployment
  - PostgreSQL database (Railway)
  - Deploy to Railway from this branch
  - Environment variables via Railway dashboard

**Workflow:**
1. Work on features in `main` branch
2. Test locally with SQLite
3. Switch to `railway-deploy` branch
4. Merge changes from `main`
5. Push to trigger Railway deployment

### Deployment Guide

**For deploying to Railway with PostgreSQL**, follow the complete guide:
- **docs/RAILWAY_POSTGRES_DEPLOYMENT.md** - Step-by-step deployment checklist

**Key points:**
- Use `env("DATABASE_URL")` directly in schema.prisma
- DO NOT create prisma.config.ts (causes env var conflicts)
- Set DATABASE_URL as reference variable: `${{Postgres.DATABASE_URL}}`
- Run migrations in startCommand, not build

## Documentation Maintenance

**IMPORTANT**: When working on this project, update documentation:

1. **docs/LEARNINGS.md** - Add any errors encountered and their solutions
2. **docs/PATTERNS.md** - Add any reusable patterns discovered
3. **docs/RAILWAY_POSTGRES_DEPLOYMENT.md** - Update if Railway deployment process changes

This ensures continuous improvement and knowledge retention across sessions.
