import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get single inventory item by SKU
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
    console.error('Failed to fetch inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    await prisma.inventory.delete({
      where: { sku },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
