# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A clothing inventory SKU generator system that creates 16-character semantic SKUs encoding item attributes. Integrates with Loyverse POS for sales tracking.

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
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Styling**: Tailwind CSS

### SKU Format
16 characters: `TTCCPPSSBBYYMMDDNN`
- Type (2) + Color (2) + Pattern (2) + Size (2) + Brand (2) + Date (6: YYMMDD) + Sequence (2: 01-99)
- Example: `DRBLFLMDBA251017​01` = Dress, Blue, Floral, Medium, Brand A, Oct 17 2025, #1

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── code-library/    # GET code library data
│   │   └── inventory/       # CRUD inventory items
│   ├── page.tsx             # SKU generator form
│   ├── inventory/           # Inventory list view
│   ├── scanner/             # Barcode scanner lookup
│   └── codes/               # Code library management
├── components/
│   └── SKUGeneratorForm.tsx # Main form component
└── lib/
    └── prisma.ts            # Prisma client singleton

prisma/
├── schema.prisma            # Database schema
├── seed.ts                  # Code library seed data
└── dev.db                   # SQLite database (gitignored)
```

### Data Model

**Code Libraries** (pre-populated):
- `Type` - Clothing types (SH, DR, PN, etc.)
- `Color` - Colors with optional hex values
- `Pattern` - Patterns (SD, FL, ST, etc.)
- `Size` - Universal sizes with sort order
- `Brand` - Brands with custom 2-char codes

**Inventory**:
- `sku` (16-char primary key)
- Foreign keys to all code libraries
- `displayName` - Auto-generated: "Type, Color Pattern, Size"
- `purchaseCost`, `sellingPrice`
- `syncedToLoyverse` - Boolean for Loyverse sync status

### Key Patterns

- **SKU Generation**: POST to `/api/inventory` calculates next sequence number by querying existing SKUs with same 14-char prefix
- **Display Name Format**: `{Type}, {Color} {Pattern}, {Size abbrev}` (e.g., "Dress, Blue Floral, M")
- **Code Library**: Pre-populated via seed, codes are unique per category (BL in colors ≠ BL in brands)

### Loyverse Integration

Manual sync via API. Items push with:
- `display_name` - For receipts
- `sku` - 16-char code
- `cost`, `price`
- Category mapping from type code

## Important Notes

- SKUs are immutable once generated - use notes field for corrections
- Maximum 99 items per attribute-date combination
- Database file is in `prisma/dev.db` (gitignored)
