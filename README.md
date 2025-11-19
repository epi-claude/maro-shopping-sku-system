# Maro SKU System

A clothing inventory management system that generates semantic SKU codes, prints barcode labels, and syncs with Loyverse POS.

## Features

- **SKU Generator** - Create 14-character semantic SKUs encoding item attributes
- **Inventory Management** - Search, filter, and manage inventory items
- **Barcode Scanner** - Look up items by scanning or entering SKU
- **Label Printing** - Print Avery 5160 labels (30 per sheet)
- **Code Library** - Manage types, colors, patterns, and sizes
- **Loyverse Sync** - Push items to Loyverse POS

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## SKU Format

14 characters: `TTCCPPSSYYMMDDNN`

| Segment | Length | Description | Example |
|---------|--------|-------------|---------|
| TT | 2 | Type code | DR (Dress) |
| CC | 2 | Color code | BL (Blue) |
| PP | 2 | Pattern code | FL (Floral) |
| SS | 2 | Size code | MD (Medium) |
| YYMMDD | 6 | Purchase date | 251017 |
| NN | 2 | Sequence (01-99) | 01 |

Example: `DRBLFLMD25101701` = Dress, Blue, Floral, Medium, Oct 17 2025, #1

## Environment Variables

Create a `.env.local` file:

```env
# Database (default SQLite for development)
DATABASE_URL="file:./data/dev.db"

# Loyverse API (optional - for POS sync)
LOYVERSE_API_TOKEN="your_token_here"
```

Get your Loyverse API token from: https://my.loyverse.com/apps/api

## Pages

| Route | Description |
|-------|-------------|
| `/` | SKU generator form |
| `/inventory` | Inventory list with Loyverse sync |
| `/scanner` | Barcode scanner lookup |
| `/codes` | Code library management |
| `/print` | Label printing |

## Database Commands

```bash
npm run db:push      # Push schema to database
npm run db:seed      # Seed code library
npm run db:reset     # Reset and reseed
npm run db:studio    # Open Prisma Studio
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Barcode**: JsBarcode (Code 128)

## Production Deployment

For production, update `DATABASE_URL` to a PostgreSQL connection string and deploy to Vercel or similar platform.

## License

Private - All rights reserved
