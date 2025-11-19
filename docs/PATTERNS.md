# Patterns

This document captures reusable code patterns discovered during development. Update this when you create patterns worth reusing.

---

## API Routes (Next.js App Router)

### Dynamic Route with Params
```typescript
// src/app/api/inventory/[sku]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    const item = await prisma.inventory.findUnique({
      where: { sku },
      include: {
        type: true,
        color: true,
        pattern: true,
        size: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}
```

---

## Prisma Singleton

### Client Singleton for Development
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

---

## Form Component with Code Library

### Fetching and Using Code Library
```typescript
'use client';

import { useState, useEffect } from 'react';

interface CodeItem {
  code: string;
  name: string;
}

interface CodeLibrary {
  types: CodeItem[];
  colors: CodeItem[];
  patterns: CodeItem[];
  sizes: CodeItem[];
}

export default function FormComponent() {
  const [codeLibrary, setCodeLibrary] = useState<CodeLibrary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCodeLibrary() {
      try {
        const response = await fetch('/api/code-library');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setCodeLibrary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCodeLibrary();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!codeLibrary) return <div>Error loading codes</div>;

  return (
    <select>
      <option value="">Select type</option>
      {codeLibrary.types.map((type) => (
        <option key={type.code} value={type.code}>
          {type.name} ({type.code})
        </option>
      ))}
    </select>
  );
}
```

---

## Barcode Component

### JsBarcode React Wrapper
```typescript
'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export default function Barcode({
  value,
  width = 2,
  height = 50,
  displayValue = true
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [value, width, height, displayValue]);

  return <svg ref={svgRef} />;
}
```

---

## Print Layout (Avery 5160)

### CSS for Label Printing
```css
@media print {
  @page {
    size: letter;
    margin: 0.5in 0.1875in;
  }
}

/* Label grid - 30 labels per sheet (3x10) */
.label-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  width: 8.5in;
}

.label {
  width: 2.625in;
  height: 1in;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.25rem;
  page-break-inside: avoid;
}
```

---

## Sequence Number Generation

### Auto-increment Within Prefix
```typescript
// Get next sequence number for SKU generation
const baseKey = `${typeCode}${colorCode}${patternCode}${sizeCode}${dateCode}`;

const existingItems = await prisma.inventory.findMany({
  where: {
    sku: { startsWith: baseKey },
  },
  select: { sequenceNum: true },
  orderBy: { sequenceNum: 'desc' },
  take: 1,
});

const nextSequence = existingItems.length > 0
  ? String(parseInt(existingItems[0].sequenceNum) + 1).padStart(2, '0')
  : '01';

if (parseInt(nextSequence) > 99) {
  throw new Error('Maximum items (99) reached for this combination');
}

const sku = `${baseKey}${nextSequence}`;
```

---

## Checkbox Selection Pattern

### Multi-select with Set
```typescript
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

function toggleSelect(id: string) {
  const newSelected = new Set(selectedItems);
  if (newSelected.has(id)) {
    newSelected.delete(id);
  } else {
    newSelected.add(id);
  }
  setSelectedItems(newSelected);
}

function selectAll(items: { id: string }[]) {
  if (selectedItems.size === items.length) {
    setSelectedItems(new Set());
  } else {
    setSelectedItems(new Set(items.map(item => item.id)));
  }
}

// Usage in JSX
<input
  type="checkbox"
  checked={selectedItems.has(item.id)}
  onChange={() => toggleSelect(item.id)}
/>
```

---

## Template for New Patterns

```markdown
## [Category]

### [Pattern Name]
\`\`\`[language]
// Code example
\`\`\`

**Usage**: [When to use this pattern]

**Notes**: [Any important considerations]
```
