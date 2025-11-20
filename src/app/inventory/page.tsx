'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Barcode from '@/components/Barcode';

interface InventoryItem {
  sku: string;
  displayName: string;
  typeCode: string;
  colorCode: string;
  patternCode: string;
  sizeCode: string;
  dateCode: string;
  sequenceNum: string;
  purchaseDate: string;
  purchaseCost: number;
  sellingPrice: number;
  syncedToLoyverse: boolean;
  createdAt: string;
  type: { name: string };
  color: { name: string };
  pattern: { name: string };
  size: { abbrev: string };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: string[]; errors: { sku: string; error: string }[] } | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [search]);

  async function fetchInventory() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(sku: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(sku)) {
      newSelected.delete(sku);
    } else {
      newSelected.add(sku);
    }
    setSelectedItems(newSelected);
  }

  function selectAll() {
    if (selectedItems.size === inventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(inventory.map(item => item.sku)));
    }
  }

  async function handleSync() {
    if (selectedItems.size === 0) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/loyverse/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus: Array.from(selectedItems) }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSyncResult({ success: [], errors: [{ sku: 'all', error: result.error }] });
      } else {
        setSyncResult(result);
        // Refresh inventory to update sync status
        fetchInventory();
        // Clear selection after successful sync
        if (result.errors.length === 0) {
          setSelectedItems(new Set());
        }
      }
    } catch (error) {
      setSyncResult({
        success: [],
        errors: [{ sku: 'all', error: error instanceof Error ? error.message : 'Failed to sync' }]
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Maro.Shopping SKU System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Generate
              </Link>
              <Link href="/inventory" className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                Inventory
              </Link>
              <Link href="/scanner" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Scanner
              </Link>
              <Link href="/codes" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Codes
              </Link>
              <Link href="/print" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Print
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Inventory ({inventory.length} items)</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
              />
              {selectedItems.size > 0 && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : `Sync to Loyverse (${selectedItems.size})`}
                </button>
              )}
            </div>
          </div>

          {syncResult && (
            <div className={`mb-4 p-4 rounded-lg ${syncResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              {syncResult.success.length > 0 && (
                <p className="text-green-700 text-sm">
                  Successfully synced {syncResult.success.length} item(s) to Loyverse
                </p>
              )}
              {syncResult.errors.length > 0 && (
                <div className="text-red-700 text-sm">
                  <p className="font-medium">Sync errors:</p>
                  <ul className="list-disc list-inside">
                    {syncResult.errors.map((err, i) => (
                      <li key={i}>{err.sku === 'all' ? err.error : `${err.sku}: ${err.error}`}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : inventory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No inventory items found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === inventory.length && inventory.length > 0}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Synced</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.sku} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.sku)}
                          onChange={() => toggleSelect(item.sku)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{item.sku}</td>
                      <td className="px-4 py-3 text-sm">{item.displayName}</td>
                      <td className="px-4 py-3 text-sm">${item.purchaseCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">${item.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(item.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.syncedToLoyverse ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="transform scale-75 origin-left">
                          <Barcode value={item.sku} height={30} width={1} displayValue={false} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
