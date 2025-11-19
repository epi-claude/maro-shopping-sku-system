import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Category = 'types' | 'colors' | 'patterns' | 'sizes';

const modelMap = {
  types: prisma.type,
  colors: prisma.color,
  patterns: prisma.pattern,
  sizes: prisma.size,
} as const;

// DELETE - Delete code from category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; code: string }> }
) {
  try {
    const { category, code } = await params;

    if (!['types', 'colors', 'patterns', 'sizes'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check if code is in use by inventory items
    const fieldMap = {
      types: 'typeCode',
      colors: 'colorCode',
      patterns: 'patternCode',
      sizes: 'sizeCode',
    };

    const inUseCount = await prisma.inventory.count({
      where: {
        [fieldMap[category as Category]]: code,
      },
    });

    if (inUseCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${inUseCount} inventory item(s) use this code` },
        { status: 400 }
      );
    }

    const model = modelMap[category as Category];

    await (model as typeof prisma.type).delete({
      where: { code },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete code:', error);
    return NextResponse.json(
      { error: 'Failed to delete code' },
      { status: 500 }
    );
  }
}
