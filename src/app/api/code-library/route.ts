import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [types, colors, patterns, sizes] = await Promise.all([
      prisma.type.findMany({ orderBy: { name: 'asc' } }),
      prisma.color.findMany({ orderBy: { name: 'asc' } }),
      prisma.pattern.findMany({ orderBy: { name: 'asc' } }),
      prisma.size.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    return NextResponse.json({
      types,
      colors,
      patterns,
      sizes,
    });
  } catch (error) {
    console.error('Failed to fetch code library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch code library' },
      { status: 500 }
    );
  }
}
