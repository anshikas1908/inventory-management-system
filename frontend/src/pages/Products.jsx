import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import BarcodeScanner from '../components/BarcodeScanner';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({ id: null, sku: '', name: '', unit: '', minStockThreshold: '', categoryId: '', barcode: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        axiosClient.get('/products'),
        axiosClient.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        sku: form.sku, name: form.name, unit: form.unit, barcode: form.barcode,
        minStockThreshold: Number(form.minStockThreshold),
      };
      if (form.id) {
        await axiosClient.put(`/products/${form.id}?categoryId=${form.categoryId}`, payload);
      } else {
        await axiosClient.post(`/products?categoryId=${form.categoryId}`, payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate product?')) return;
    try {
      await axiosClient.patch(`/products/${id}/deactivate`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate product');
    }
  };

  const openAdd = () => {
    setForm({ id: null, sku: '', name: '', unit: '', minStockThreshold: '', categoryId: '', barcode: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({ id: p.id, sku: p.sku, name: p.name, unit: p.unit, minStockThreshold: p.minStockThreshold, categoryId: p.category?.id || '', barcode: p.barcode || '' });
    setShowModal(true);
  };

  const handleScan = async (code) => {
    setShowScanner(false);
    setForm(p => ({ ...p, barcode: code }));
    try {
      const res = await axiosClient.get(`/products/by-barcode?code=${code}`);
      if (res.data) {
        setForm({
          id: res.data.id,
          sku: res.data.sku,
          name: res.data.name,
          unit: res.data.unit,
          minStockThreshold: res.data.minStockThreshold,
          categoryId: res.data.category?.id || '',
          barcode: res.data.barcode || code
        });
      }
    } catch (e) {
      // Not found, just keep the barcode in form
    }
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowScanner(true)} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
            Scan Barcode
          </button>
          <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['SKU', 'Barcode', 'Name', 'Category', 'Unit', 'Qty', 'Min', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-800">{p.sku}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{p.barcode || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.unit}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${p.currentQuantity < p.minStockThreshold ? 'text-red-600' : 'text-gray-800'}`}>
                    {p.currentQuantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.minStockThreshold}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                      {p.isActive && (
                        <button onClick={() => handleDeactivate(p.id)} className="text-red-600 hover:text-red-900 font-medium">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{form.id ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input type="text" required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input type="text" required placeholder="e.g. pcs" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Threshold *</label>
                <input type="number" required min="0" value={form.minStockThreshold} onChange={e => setForm({...form, minStockThreshold: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}