import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [warehouseStocks, setWarehouseStocks] = useState({});

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/warehouses');
      setWarehouses(res.data);
    } catch (e) {
      setError('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchStock = async (id) => {
    if (warehouseStocks[id]) return;
    try {
      const res = await axiosClient.get(`/warehouses/${id}/stock`);
      setWarehouseStocks(prev => ({ ...prev, [id]: res.data }));
    } catch {
      setWarehouseStocks(prev => ({ ...prev, [id]: [] }));
    }
  };

  const handleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchStock(id);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post('/warehouses', form);
      setShowModal(false);
      setForm({ code: '', name: '', location: '' });
      fetchWarehouses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Add Warehouse
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Code','Name','Location','Default','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {warehouses.map(w => (
                <React.Fragment key={w.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleExpand(w.id)}>
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-800">{w.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                    <td className="px-4 py-3 text-gray-600">{w.location || '—'}</td>
                    <td className="px-4 py-3">
                      {w.isDefault && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Default</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {w.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-blue-600 text-sm">
                      {expandedId === w.id ? '▲ Hide Stock' : '▼ View Stock'}
                    </td>
                  </tr>
                  {expandedId === w.id && (
                    <tr key={`stock-${w.id}`}>
                      <td colSpan={6} className="bg-blue-50 px-4 py-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Stock in {w.name}</p>
                        {!warehouseStocks[w.id] ? (
                          <p className="text-gray-400 text-sm">Loading...</p>
                        ) : warehouseStocks[w.id].length === 0 ? (
                          <p className="text-gray-500 text-sm">No stock records for this warehouse.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-1 pr-4">Product</th>
                                <th className="py-1 pr-4">SKU</th>
                                <th className="py-1">Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {warehouseStocks[w.id].map(s => (
                                <tr key={s.id}>
                                  <td className="py-1 pr-4 font-medium">{s.product?.name}</td>
                                  <td className="py-1 pr-4 font-mono text-xs text-gray-500">{s.product?.sku}</td>
                                  <td className={`py-1 font-semibold ${s.currentQuantity < (s.product?.minStockThreshold || 0) ? 'text-red-600' : 'text-gray-800'}`}>
                                    {s.currentQuantity}
                                    {s.currentQuantity < (s.product?.minStockThreshold || 0) && <span className="ml-1 text-xs text-red-400">(low)</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add Warehouse</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[{label:'Code', key:'code', placeholder:'e.g. WH-01'}, {label:'Name', key:'name', placeholder:'e.g. North Warehouse'}, {label:'Location', key:'location', placeholder:'e.g. 123 Main St', required:false}].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required !== false && ' *'}</label>
                  <input type="text" required={f.required !== false} value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
