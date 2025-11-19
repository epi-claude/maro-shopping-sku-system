'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

type CodeCategory = 'types' | 'colors' | 'patterns' | 'sizes';

export default function CodesPage() {
  const [codeLibrary, setCodeLibrary] = useState<CodeLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CodeCategory>('types');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', name: '', hexValue: '', abbrev: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCodeLibrary();
  }, []);

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

  async function handleAddCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/code-library/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add code');
      }

      await fetchCodeLibrary();
      setNewCode({ code: '', name: '', hexValue: '', abbrev: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add code');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCode(code: string) {
    if (!confirm(`Are you sure you want to delete code "${code}"?`)) return;

    try {
      const response = await fetch(`/api/code-library/${activeTab}/${code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete code');
      }

      await fetchCodeLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete code');
    }
  }

  const tabs: { key: CodeCategory; label: string }[] = [
    { key: 'types', label: 'Types' },
    { key: 'colors', label: 'Colors' },
    { key: 'patterns', label: 'Patterns' },
    { key: 'sizes', label: 'Sizes' },
  ];

  const currentItems = codeLibrary ? codeLibrary[activeTab] : [];

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
              <Link href="/scanner" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Scanner
              </Link>
              <Link href="/codes" className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
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
            <h2 className="text-lg font-semibold text-gray-900">Code Library</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              {showAddForm ? 'Cancel' : 'Add New'}
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex -mb-px space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({codeLibrary?.[tab.key]?.length || 0})
                </button>
              ))}
            </nav>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddCode} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code (2 chars) *
                  </label>
                  <input
                    type="text"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    maxLength={2}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    placeholder="XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newCode.name}
                    onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    placeholder="Display name"
                  />
                </div>
                {activeTab === 'colors' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hex Color
                    </label>
                    <input
                      type="text"
                      value={newCode.hexValue}
                      onChange={(e) => setNewCode({ ...newCode, hexValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                      placeholder="#000000"
                    />
                  </div>
                )}
                {activeTab === 'sizes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Abbreviation
                    </label>
                    <input
                      type="text"
                      value={newCode.abbrev}
                      onChange={(e) => setNewCode({ ...newCode, abbrev: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                      placeholder="S, M, L"
                    />
                  </div>
                )}
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Code List */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No codes found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    {activeTab === 'colors' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    )}
                    {activeTab === 'sizes' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abbrev</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr key={item.code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{item.code}</td>
                      <td className="px-4 py-3 text-sm">{item.name}</td>
                      {activeTab === 'colors' && (
                        <td className="px-4 py-3">
                          {item.hexValue && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: item.hexValue }}
                              />
                              <span className="text-xs text-gray-500">{item.hexValue}</span>
                            </div>
                          )}
                        </td>
                      )}
                      {activeTab === 'sizes' && (
                        <td className="px-4 py-3 text-sm">{item.abbrev || '-'}</td>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteCode(item.code)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
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
