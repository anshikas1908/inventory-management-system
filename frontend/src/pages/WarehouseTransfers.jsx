import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function WarehouseTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fromWarehouseId: '', toWarehouseId: '', productId: '', quantity: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transfersRes, whRes, prodRes] = await Promise.all([
        axiosClient.get('/warehouses/transfers'),
        axiosClient.get('/warehouses'),
        axiosClient.get('/products')
      ]);
      setTransfers(transfersRes.data);
      setWarehouses(whRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post('/warehouses/transfers', {
        ...form,
        quantity: Number(form.quantity),
        fromWarehouseId: Number(form.fromWarehouseId),
        toWarehouseId: Number(form.toWarehouseId),
        productId: Number(form.productId)
      });
      setShowModal(false);
      setForm({ fromWarehouseId: '', toWarehouseId: '', productId: '', quantity: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axiosClient.patch(`/warehouses/transfers/${id}/${action}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} transfer`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Warehouse Transfers</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Initiate Transfer
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
                {['From', 'To', 'Product', 'Qty', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{t.fromWarehouse?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{t.toWarehouse?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{t.product?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{t.quantity}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {t.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(t.id, 'complete')} className="text-green-600 hover:text-green-900 font-medium">Complete</button>
                        <button onClick={() => handleAction(t.id, 'cancel')} className="text-red-600 hover:text-red-900 font-medium">Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Initiate Transfer</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse *</label>
                <select required value={form.fromWarehouseId} onChange={e => setForm({...form, fromWarehouseId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse *</label>
                <select required value={form.toWarehouseId} onChange={e => setForm({...form, toWarehouseId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Initiating...' : 'Initiate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
