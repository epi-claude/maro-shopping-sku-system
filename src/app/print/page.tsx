'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Barcode from '@/components/Barcode';

interface InventoryItem {
  sku: string;
  displayName: string;
  sellingPrice: number;
  type: { name: string };
  color: { name: string };
  pattern: { name: string };
  size: { abbrev: string };
}

export default function PrintPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState<{ [sku: string]: number }>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setInventory(data);
      // Initialize copies to 1 for all items
      const initialCopies: { [sku: string]: number } = {};
      data.forEach((item: InventoryItem) => {
        initialCopies[item.sku] = 1;
      });
      setCopies(initialCopies);
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

  function updateCopies(sku: string, value: number) {
    setCopies(prev => ({ ...prev, [sku]: Math.max(1, Math.min(99, value)) }));
  }

  function handlePrint() {
    window.print();
  }

  // Generate labels array with copies
  const labels: InventoryItem[] = [];
  inventory.forEach(item => {
    if (selectedItems.has(item.sku)) {
      const copyCount = copies[item.sku] || 1;
      for (let i = 0; i < copyCount; i++) {
        labels.push(item);
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - hidden when printing */}
      <nav className="bg-white shadow-sm print:hidden">
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
              <Link href="/scanner" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Scanner
              </Link>
              <Link href="/codes" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Codes
              </Link>
              <Link href="/print" className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                Print Labels
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - hidden when printing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Print Labels (Avery 5160)</h2>
            {selectedItems.size > 0 && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Print {labels.length} Label{labels.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Select items to print labels. Uses Avery 5160 template (30 labels per sheet, 1&quot; x 2-5/8&quot;).
          </p>

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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Copies</th>
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
                      <td className="px-4 py-3 text-sm">${item.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={copies[item.sku] || 1}
                          onChange={(e) => updateCopies(item.sku, parseInt(e.target.value) || 1)}
                          disabled={!selectedItems.has(item.sku)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Print Layout - Avery 5160 (30 labels per sheet) */}
      <div ref={printRef} className="hidden print:block">
        <style jsx>{`
          @media print {
            @page {
              size: letter;
              margin: 0.5in 0.1875in;
            }
          }
        `}</style>
        <div className="grid grid-cols-3 gap-0" style={{ width: '8.5in' }}>
          {labels.map((item, index) => (
            <div
              key={`${item.sku}-${index}`}
              className="flex flex-col justify-center items-center p-1 border border-gray-200"
              style={{
                width: '2.625in',
                height: '1in',
                pageBreakInside: 'avoid',
              }}
            >
              <div className="text-xs font-medium text-center truncate w-full px-1">
                {item.displayName}
              </div>
              <div className="text-sm font-bold">${item.sellingPrice.toFixed(2)}</div>
              <div className="transform scale-75">
                <Barcode value={item.sku} height={25} width={1} displayValue={true} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
