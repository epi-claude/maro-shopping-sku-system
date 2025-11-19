import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Category = 'types' | 'colors' | 'patterns' | 'sizes';

const modelMap = {
  types: prisma.type,
  colors: prisma.color,
  patterns: prisma.pattern,
  sizes: prisma.size,
} as const;

// POST - Add new code to category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const body = await request.json();
    const { code, name, hexValue, abbrev } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    if (code.length !== 2) {
      return NextResponse.json(
        { error: 'Code must be exactly 2 characters' },
        { status: 400 }
      );
    }

    if (!['types', 'colors', 'patterns', 'sizes'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const model = modelMap[category as Category];

    // Check if code already exists
    const existing = await (model as typeof prisma.type).findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Code already exists' },
        { status: 400 }
      );
    }

    // Create based on category
    let item;
    if (category === 'colors') {
      item = await prisma.color.create({
        data: { code, name, hexValue: hexValue || null },
      });
    } else if (category === 'sizes') {
      // Get max sortOrder
      const maxOrder = await prisma.size.aggregate({
        _max: { sortOrder: true },
      });
      item = await prisma.size.create({
        data: {
          code,
          name,
          abbrev: abbrev || code,
          sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        },
      });
    } else {
      item = await (model as typeof prisma.type).create({
        data: { code, name },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to add code:', error);
    return NextResponse.json(
      { error: 'Failed to add code' },
      { status: 500 }
    );
  }
}
