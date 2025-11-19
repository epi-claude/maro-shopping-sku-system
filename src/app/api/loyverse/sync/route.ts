import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const LOYVERSE_API_URL = 'https://api.loyverse.com/v1.0';

interface LoyverseItem {
  id?: string;
  item_name: string;
  description?: string;
  reference_id: string;
  sku: string;
  barcode?: string;
  sold_by_weight: boolean;
  is_composite: boolean;
  use_production: boolean;
  track_stock: boolean;
  variants: {
    variant_id?: string;
    sku: string;
    barcode?: string;
    cost: number;
    default_pricing_type: string;
    default_price: number;
    stores: {
      store_id: string;
      pricing_type: string;
      price: number;
      available_for_sale: boolean;
    }[];
  }[];
  category_id?: string;
}

// POST - Sync items to Loyverse
export async function POST(request: NextRequest) {
  try {
    const apiToken = process.env.LOYVERSE_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        { error: 'Loyverse API token not configured. Add LOYVERSE_API_TOKEN to .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { skus } = body;

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: 'No SKUs provided' },
        { status: 400 }
      );
    }

    // Fetch items from database
    const items = await prisma.inventory.findMany({
      where: { sku: { in: skus } },
      include: {
        type: true,
        color: true,
        pattern: true,
        size: true,
      },
    });

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items found' },
        { status: 404 }
      );
    }

    // Get store ID from Loyverse
    const storesResponse = await fetch(`${LOYVERSE_API_URL}/stores`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!storesResponse.ok) {
      const errorText = await storesResponse.text();
      console.error('Loyverse stores error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Loyverse stores' },
        { status: 500 }
      );
    }

    const storesData = await storesResponse.json();
    const storeId = storesData.stores?.[0]?.id;

    if (!storeId) {
      return NextResponse.json(
        { error: 'No Loyverse store found' },
        { status: 500 }
      );
    }

    // Get category by type name (or create if not exists)
    const categoryMap: { [key: string]: string } = {};

    for (const item of items) {
      const typeName = item.type.name;

      if (!categoryMap[typeName]) {
        // Search for existing category
        const categoriesResponse = await fetch(`${LOYVERSE_API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        });

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const existingCategory = categoriesData.categories?.find(
            (cat: { name: string; id: string }) => cat.name.toLowerCase() === typeName.toLowerCase()
          );

          if (existingCategory) {
            categoryMap[typeName] = existingCategory.id;
          }
        }
      }
    }

    // Sync each item
    const results = {
      success: [] as string[],
      errors: [] as { sku: string; error: string }[],
    };

    for (const item of items) {
      try {
        // Build Loyverse item
        const loyverseItem: LoyverseItem = {
          item_name: item.displayName,
          reference_id: item.sku,
          sku: item.sku,
          barcode: item.sku,
          sold_by_weight: false,
          is_composite: false,
          use_production: false,
          track_stock: true,
          variants: [{
            sku: item.sku,
            barcode: item.sku,
            cost: item.purchaseCost,
            default_pricing_type: 'FIXED',
            default_price: item.sellingPrice,
            stores: [{
              store_id: storeId,
              pricing_type: 'FIXED',
              price: item.sellingPrice,
              available_for_sale: true,
            }],
          }],
        };

        // Add category if available
        if (categoryMap[item.type.name]) {
          loyverseItem.category_id = categoryMap[item.type.name];
        }

        // Check if item exists (by searching for SKU)
        const searchResponse = await fetch(
          `${LOYVERSE_API_URL}/items?sku=${encodeURIComponent(item.sku)}`,
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
            },
          }
        );

        let existingItem = null;
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          existingItem = searchData.items?.[0];
        }

        let syncResponse;
        if (existingItem) {
          // Update existing item
          loyverseItem.id = existingItem.id;
          if (existingItem.variants?.[0]?.variant_id) {
            loyverseItem.variants[0].variant_id = existingItem.variants[0].variant_id;
          }

          syncResponse = await fetch(`${LOYVERSE_API_URL}/items/${existingItem.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loyverseItem),
          });
        } else {
          // Create new item
          syncResponse = await fetch(`${LOYVERSE_API_URL}/items`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loyverseItem),
          });
        }

        if (syncResponse.ok) {
          // Update database to mark as synced
          await prisma.inventory.update({
            where: { sku: item.sku },
            data: {
              syncedToLoyverse: true,
              loyverseSyncedAt: new Date(),
            },
          });
          results.success.push(item.sku);
        } else {
          const errorData = await syncResponse.json();
          results.errors.push({
            sku: item.sku,
            error: errorData.errors?.[0]?.details || 'Unknown error',
          });
        }
      } catch (err) {
        results.errors.push({
          sku: item.sku,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to sync to Loyverse:', error);
    return NextResponse.json(
      { error: 'Failed to sync to Loyverse' },
      { status: 500 }
    );
  }
}
