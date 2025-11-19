import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all inventory items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const synced = searchParams.get('synced');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    if (synced === 'true') {
      where.syncedToLoyverse = true;
    } else if (synced === 'false') {
      where.syncedToLoyverse = false;
    }

    const inventory = await prisma.inventory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        type: true,
        color: true,
        pattern: true,
        size: true,
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new inventory item with SKU generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      typeCode,
      colorCode,
      patternCode,
      sizeCode,
      purchaseDate,
      purchaseCost,
      sellingPrice,
    } = body;

    // Validate required fields
    if (!typeCode || !colorCode || !patternCode || !sizeCode || !purchaseDate || !purchaseCost || !sellingPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate date code (YYMMDD)
    const date = new Date(purchaseDate);
    const dateCode =
      String(date.getFullYear()).slice(2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');

    // Generate the 12-character base key (without brand)
    const baseKey = `${typeCode}${colorCode}${patternCode}${sizeCode}${dateCode}`;

    // Find existing SKUs with this base key to determine sequence number
    const existingItems = await prisma.inventory.findMany({
      where: {
        sku: {
          startsWith: baseKey,
        },
      },
      select: {
        sequenceNum: true,
      },
      orderBy: {
        sequenceNum: 'desc',
      },
    });

    // Calculate next sequence number
    let sequenceNum = '01';
    if (existingItems.length > 0) {
      const maxSeq = Math.max(...existingItems.map(item => parseInt(item.sequenceNum, 10)));
      if (maxSeq >= 99) {
        return NextResponse.json(
          { error: 'Maximum 99 items with same attributes per day reached' },
          { status: 400 }
        );
      }
      sequenceNum = String(maxSeq + 1).padStart(2, '0');
    }

    // Generate full 14-character SKU
    const sku = `${baseKey}${sequenceNum}`;

    // Fetch code names for display name generation
    const [type, color, pattern, size] = await Promise.all([
      prisma.type.findUnique({ where: { code: typeCode } }),
      prisma.color.findUnique({ where: { code: colorCode } }),
      prisma.pattern.findUnique({ where: { code: patternCode } }),
      prisma.size.findUnique({ where: { code: sizeCode } }),
    ]);

    if (!type || !color || !pattern || !size) {
      return NextResponse.json(
        { error: 'Invalid code(s) provided' },
        { status: 400 }
      );
    }

    // Generate display name: "Type, Color Pattern, Size"
    const displayName = `${type.name}, ${color.name} ${pattern.name}, ${size.abbrev}`;

    // Create inventory item
    const item = await prisma.inventory.create({
      data: {
        sku,
        typeCode,
        colorCode,
        patternCode,
        sizeCode,
        dateCode,
        sequenceNum,
        displayName,
        purchaseDate: new Date(purchaseDate),
        purchaseCost: parseFloat(purchaseCost),
        sellingPrice: parseFloat(sellingPrice),
      },
      include: {
        type: true,
        color: true,
        pattern: true,
        size: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
