import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function CustomerPortal() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/portal/customer/products');
        setProducts(res.data);
      } catch (err) {
        setError('Failed to load catalogue');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !categoryFilter || p.category?.name === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Product Catalogue</h1>
        <p className="text-gray-600">Browse our available inventory.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input type="text" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="w-full sm:w-64">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(p => {
            const outOfStock = p.currentQuantity <= 0;
            const lowStock = p.currentQuantity > 0 && p.currentQuantity < p.minStockThreshold;
            
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-5 flex-1">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">{p.category?.name || 'Uncategorized'}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{p.name}</h3>
                  <div className="text-sm font-mono text-gray-500 mb-4">{p.sku}</div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock: <span className="font-semibold text-gray-900">{p.currentQuantity} {p.unit}</span></span>
                    
                    {outOfStock ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>
                    ) : lowStock ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Low Stock</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No products match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
