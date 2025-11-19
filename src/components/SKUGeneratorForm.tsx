'use client';

import { useState, useEffect } from 'react';
import Barcode from './Barcode';

interface CodeItem {
  code: string;
  name: string;
  hexValue?: string;
  abbrev?: string;
  sortOrder?: number;
}

interface CodeLibrary {
  types: CodeItem[];
  colors: CodeItem[];
  patterns: CodeItem[];
  sizes: CodeItem[];
}

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
  type: CodeItem;
  color: CodeItem;
  pattern: CodeItem;
  size: CodeItem;
}

interface SKUGeneratorFormProps {
  onItemCreated?: (item: InventoryItem) => void;
}

export default function SKUGeneratorForm({ onItemCreated }: SKUGeneratorFormProps) {
  const [codeLibrary, setCodeLibrary] = useState<CodeLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<InventoryItem | null>(null);

  // Form state
  const [typeCode, setTypeCode] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [patternCode, setPatternCode] = useState('');
  const [sizeCode, setSizeCode] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCost, setPurchaseCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Fetch code library on mount
  useEffect(() => {
    async function fetchCodeLibrary() {
      try {
        const response = await fetch('/api/code-library');
        if (!response.ok) throw new Error('Failed to fetch code library');
        const data = await response.json();
        setCodeLibrary(data);
      } catch (err) {
        setError('Failed to load code library');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCodeLibrary();
  }, []);

  const resetForm = () => {
    setTypeCode('');
    setColorCode('');
    setPatternCode('');
    setSizeCode('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseCost('');
    setSellingPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeCode,
          colorCode,
          patternCode,
          sizeCode,
          purchaseDate,
          purchaseCost: parseFloat(purchaseCost),
          sellingPrice: parseFloat(sellingPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create item');
      }

      setSuccess(data);
      onItemCreated?.(data);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!codeLibrary) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Failed to load code library. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select type</option>
              {codeLibrary.types.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color *
            </label>
            <select
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select color</option>
              {codeLibrary.colors.map((color) => (
                <option key={color.code} value={color.code}>
                  {color.name} ({color.code})
                </option>
              ))}
            </select>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pattern *
            </label>
            <select
              value={patternCode}
              onChange={(e) => setPatternCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select pattern</option>
              {codeLibrary.patterns.map((pattern) => (
                <option key={pattern.code} value={pattern.code}>
                  {pattern.name} ({pattern.code})
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size *
            </label>
            <select
              value={sizeCode}
              onChange={(e) => setSizeCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select size</option>
              {codeLibrary.sizes.map((size) => (
                <option key={size.code} value={size.code}>
                  {size.name} ({size.code})
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date *
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* Purchase Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Cost *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Generating...' : 'Generate SKU'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">SKU Generated Successfully!</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">SKU:</span>{' '}
              <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{success.sku}</span>
            </p>
            <p>
              <span className="font-medium">Display Name:</span> {success.displayName}
            </p>
            <p>
              <span className="font-medium">Cost:</span> ${success.purchaseCost.toFixed(2)} |{' '}
              <span className="font-medium">Price:</span> ${success.sellingPrice.toFixed(2)}
            </p>
            <div className="mt-3 bg-white p-2 rounded border inline-block">
              <Barcode value={success.sku} height={40} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
