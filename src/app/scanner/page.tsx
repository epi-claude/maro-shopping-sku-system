'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Barcode from '@/components/Barcode';

interface InventoryItem {
  sku: string;
  displayName: string;
  purchaseDate: string;
  purchaseCost: number;
  sellingPrice: number;
  syncedToLoyverse: boolean;
  type: { name: string };
  color: { name: string };
  pattern: { name: string };
  size: { abbrev: string; name: string };
}

export default function ScannerPage() {
  const [sku, setSku] = useState('');
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!sku.trim()) return;

    setLoading(true);
    setError(null);
    setItem(null);

    try {
      const response = await fetch(`/api/inventory/${sku.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Item not found');
      }

      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup item');
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setSku('');
    setItem(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Maro SKU System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Generate
              </Link>
              <Link href="/inventory" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Inventory
              </Link>
              <Link href="/scanner" className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanner Lookup</h2>

          <form onSubmit={handleLookup} className="mb-6">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Scan or enter SKU..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-lg font-mono text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading || !sku.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Looking up...' : 'Lookup'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {item && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.displayName}</h3>
                  <p className="text-sm text-gray-500 font-mono">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">${item.sellingPrice.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Cost: ${item.purchaseCost.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium">{item.type.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Color:</span>
                  <span className="ml-2 font-medium">{item.color.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Pattern:</span>
                  <span className="ml-2 font-medium">{item.pattern.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>
                  <span className="ml-2 font-medium">{item.size.name}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
                </div>
                <div className="bg-white p-2 border rounded">
                  <Barcode value={item.sku} height={40} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
