import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Types (clothing categories)
  const types = [
    { code: 'SH', name: 'Shirt' },
    { code: 'BL', name: 'Blouse' },
    { code: 'DR', name: 'Dress' },
    { code: 'SK', name: 'Skirt' },
    { code: 'PN', name: 'Pants' },
    { code: 'JN', name: 'Jeans' },
    { code: 'JK', name: 'Jacket' },
    { code: 'CT', name: 'Coat' },
    { code: 'SW', name: 'Sweater' },
    { code: 'TS', name: 'T-Shirt' },
    { code: 'TK', name: 'Tank Top' },
    { code: 'ST', name: 'Shorts' },
    { code: 'JM', name: 'Jumpsuit' },
    { code: 'RO', name: 'Romper' },
    { code: 'VT', name: 'Vest' },
    { code: 'CR', name: 'Cardigan' },
    { code: 'HD', name: 'Hoodie' },
    { code: 'LG', name: 'Leggings' },
  ];

  // Seed Colors
  const colors = [
    { code: 'BK', name: 'Black', hexValue: '#000000' },
    { code: 'WT', name: 'White', hexValue: '#FFFFFF' },
    { code: 'GY', name: 'Gray', hexValue: '#808080' },
    { code: 'NV', name: 'Navy', hexValue: '#000080' },
    { code: 'BL', name: 'Blue', hexValue: '#0000FF' },
    { code: 'RD', name: 'Red', hexValue: '#FF0000' },
    { code: 'PK', name: 'Pink', hexValue: '#FFC0CB' },
    { code: 'PR', name: 'Purple', hexValue: '#800080' },
    { code: 'GN', name: 'Green', hexValue: '#008000' },
    { code: 'YL', name: 'Yellow', hexValue: '#FFFF00' },
    { code: 'OR', name: 'Orange', hexValue: '#FFA500' },
    { code: 'BR', name: 'Brown', hexValue: '#8B4513' },
    { code: 'BG', name: 'Beige', hexValue: '#F5F5DC' },
    { code: 'CR', name: 'Cream', hexValue: '#FFFDD0' },
    { code: 'TN', name: 'Tan', hexValue: '#D2B48C' },
    { code: 'MV', name: 'Mauve', hexValue: '#E0B0FF' },
    { code: 'TL', name: 'Teal', hexValue: '#008080' },
    { code: 'BU', name: 'Burgundy', hexValue: '#800020' },
    { code: 'MT', name: 'Multi', hexValue: null },
  ];

  // Seed Patterns
  const patterns = [
    { code: 'SD', name: 'Solid' },
    { code: 'ST', name: 'Striped' },
    { code: 'PL', name: 'Plaid' },
    { code: 'FL', name: 'Floral' },
    { code: 'DT', name: 'Dotted' },
    { code: 'CK', name: 'Checkered' },
    { code: 'PR', name: 'Printed' },
    { code: 'AB', name: 'Abstract' },
    { code: 'AN', name: 'Animal Print' },
    { code: 'CM', name: 'Camouflage' },
    { code: 'PS', name: 'Paisley' },
    { code: 'GE', name: 'Geometric' },
    { code: 'TY', name: 'Tie-Dye' },
    { code: 'EM', name: 'Embroidered' },
    { code: 'LN', name: 'Linen' },
    { code: 'DN', name: 'Denim' },
  ];

  // Seed Sizes (universal)
  const sizes = [
    { code: 'XS', name: 'Extra Small', abbrev: 'XS', sortOrder: 1 },
    { code: 'SM', name: 'Small', abbrev: 'S', sortOrder: 2 },
    { code: 'MD', name: 'Medium', abbrev: 'M', sortOrder: 3 },
    { code: 'LG', name: 'Large', abbrev: 'L', sortOrder: 4 },
    { code: 'XL', name: 'Extra Large', abbrev: 'XL', sortOrder: 5 },
    { code: '2X', name: '2X Large', abbrev: '2XL', sortOrder: 6 },
    { code: '3X', name: '3X Large', abbrev: '3XL', sortOrder: 7 },
    { code: 'OS', name: 'One Size', abbrev: 'OS', sortOrder: 8 },
  ];

  console.log('Seeding code libraries...');

  // Use transactions for bulk upserts (SQLite doesn't support skipDuplicates)
  for (const type of types) {
    await prisma.type.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
  }
  console.log(`  ✓ ${types.length} types`);

  for (const color of colors) {
    await prisma.color.upsert({
      where: { code: color.code },
      update: {},
      create: color,
    });
  }
  console.log(`  ✓ ${colors.length} colors`);

  for (const pattern of patterns) {
    await prisma.pattern.upsert({
      where: { code: pattern.code },
      update: {},
      create: pattern,
    });
  }
  console.log(`  ✓ ${patterns.length} patterns`);

  for (const size of sizes) {
    await prisma.size.upsert({
      where: { code: size.code },
      update: {},
      create: size,
    });
  }
  console.log(`  ✓ ${sizes.length} sizes`);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
