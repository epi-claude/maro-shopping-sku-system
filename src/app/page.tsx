import Link from 'next/link';
import SKUGeneratorForm from '@/components/SKUGeneratorForm';

export default function Home() {
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
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
              >
                Generate
              </Link>
              <Link
                href="/inventory"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Inventory
              </Link>
              <Link
                href="/scanner"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Scanner
              </Link>
              <Link
                href="/codes"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Codes
              </Link>
              <Link
                href="/print"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Print
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New SKU</h2>
          <SKUGeneratorForm />
        </div>
      </main>
    </div>
  );
}
