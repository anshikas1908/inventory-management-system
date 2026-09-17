import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [] });
  const [receiveForm, setReceiveForm] = useState({}); // { itemId: quantityReceived }
  const [rejectReason, setRejectReason] = useState('');
  
  const [expandedId, setExpandedId] = useState(null);
  const [poItems, setPoItems] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, supRes, prodRes] = await Promise.all([
        axiosClient.get('/purchase-orders'),
        axiosClient.get('/suppliers'),
        axiosClient.get('/products')
      ]);
      setPos(poRes.data);
      setSuppliers(supRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchItems = async (id) => {
    if (poItems[id]) return;
    try {
      const res = await axiosClient.get(`/purchase-orders/${id}/items`);
      setPoItems(prev => ({ ...prev, [id]: res.data }));
    } catch {
      setPoItems(prev => ({ ...prev, [id]: [] }));
    }
  };

  const handleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchItems(id);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, supplierId: Number(form.supplierId) };
      await axiosClient.post('/purchase-orders', payload);
      setShowModal(false);
      setForm({ supplierId: '', notes: '', items: [] });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create PO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action, payload = {}) => {
    try {
      if (action === 'submit') await axiosClient.post(`/purchase-orders/${id}/submit`);
      else if (action === 'approve') await axiosClient.patch(`/purchase-orders/${id}/approve`);
      else if (action === 'reject') {
        await axiosClient.patch(`/purchase-orders/${id}/reject`, { reason: payload.reason });
        setShowRejectModal(false);
      }
      else if (action === 'receive') {
        await axiosClient.post(`/purchase-orders/${id}/receive`, { items: payload.items });
        setShowReceiveModal(false);
      }
      fetchData();
      if (poItems[id]) {
        const res = await axiosClient.get(`/purchase-orders/${id}/items`);
        setPoItems(prev => ({ ...prev, [id]: res.data }));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} PO`);
    }
  };

  const addItemToForm = () => {
    setForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1, unitPrice: 0 }] }));
  };
  
  const updateFormItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = field === 'productId' ? value : Number(value);
    setForm(p => ({ ...p, items: newItems }));
  };

  const removeFormItem = (index) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };

  const openReceiveModal = async (po) => {
    setSelectedPo(po);
    await fetchItems(po.id);
    const items = poItems[po.id] || [];
    const initForm = {};
    items.forEach(i => { initForm[i.id] = 0; });
    setReceiveForm(initForm);
    setShowReceiveModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-800';
      case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'PARTIALLY_RECEIVED': return 'bg-orange-100 text-orange-800';
      case 'RECEIVED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filtered = filter === 'All' ? pos : pos.filter(p => p.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New PO
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {['All', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${filter === f ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['PO ID', 'Supplier', 'Status', 'Date', 'Total', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleExpand(p.id)}>
                    <td className="px-4 py-3 font-mono text-sm text-gray-800">PO-{p.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.supplier?.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">${p.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {p.status === 'DRAFT' && (
                          <button onClick={() => handleAction(p.id, 'submit')} className="text-blue-600 hover:text-blue-900 font-medium">Submit</button>
                        )}
                        {p.status === 'PENDING_APPROVAL' && (
                          <>
                            <button onClick={() => handleAction(p.id, 'approve')} className="text-green-600 hover:text-green-900 font-medium">Approve</button>
                            <button onClick={() => { setSelectedPo(p); setShowRejectModal(true); }} className="text-red-600 hover:text-red-900 font-medium">Reject</button>
                          </>
                        )}
                        {(p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED') && (
                          <button onClick={() => openReceiveModal(p)} className="text-orange-600 hover:text-orange-900 font-medium">Receive Items</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={6} className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Items for PO-{p.id}</p>
                        {!poItems[p.id] ? (
                          <p className="text-gray-400 text-sm">Loading...</p>
                        ) : poItems[p.id].length === 0 ? (
                          <p className="text-gray-500 text-sm">No items found.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="py-2 pr-4">Product</th>
                                <th className="py-2 pr-4 text-right">Qty Ordered</th>
                                <th className="py-2 pr-4 text-right">Qty Received</th>
                                <th className="py-2 pr-4 text-right">Unit Price</th>
                                <th className="py-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {poItems[p.id].map(i => (
                                <tr key={i.id}>
                                  <td className="py-2 pr-4 font-medium">{i.product?.name}</td>
                                  <td className="py-2 pr-4 text-right">{i.quantityOrdered}</td>
                                  <td className="py-2 pr-4 text-right font-medium text-blue-700">{i.quantityReceived}</td>
                                  <td className="py-2 pr-4 text-right">${i.unitPrice?.toFixed(2)}</td>
                                  <td className="py-2 text-right">${i.subtotal?.toFixed(2)}</td>
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

      {/* New PO Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <select required value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Select...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Line Items</label>
                  <button type="button" onClick={addItemToForm} className="text-sm text-blue-600 font-medium hover:text-blue-800">+ Add Item</button>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end mb-2">
                    <div className="flex-1">
                      <select required value={item.productId} onChange={e => updateFormItem(index, 'productId', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" required min="1" placeholder="Qty" value={item.quantity} onChange={e => updateFormItem(index, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="w-32">
                      <input type="number" required min="0" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => updateFormItem(index, 'unitPrice', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <button type="button" onClick={() => removeFormItem(index)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">&times;</button>
                  </div>
                ))}
                {form.items.length === 0 && <p className="text-sm text-gray-500 italic">No items added yet.</p>}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting || form.items.length === 0} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Reject PO-{selectedPo?.id}</h2>
            <textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 h-24" />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleAction(selectedPo.id, 'reject', { reason: rejectReason })} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && selectedPo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl">
            <h2 className="text-lg font-bold mb-4">Receive Items for PO-{selectedPo.id}</h2>
            {!poItems[selectedPo.id] ? <p>Loading items...</p> : (
              <div className="space-y-3 mb-6">
                {poItems[selectedPo.id].map(i => {
                  const remaining = i.quantityOrdered - i.quantityReceived;
                  return (
                    <div key={i.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{i.product?.name}</p>
                        <p className="text-xs text-gray-500">Ordered: {i.quantityOrdered} | Received: {i.quantityReceived}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700">Receiving:</label>
                        <input type="number" min="0" max={remaining} value={receiveForm[i.id] || 0}
                          onChange={e => setReceiveForm(p => ({ ...p, [i.id]: Number(e.target.value) }))}
                          className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <button onClick={() => setShowReceiveModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                const itemsPayload = Object.entries(receiveForm)
                  .filter(([_, qty]) => qty > 0)
                  .map(([id, qty]) => ({ purchaseOrderItemId: Number(id), quantityReceived: qty }));
                handleAction(selectedPo.id, 'receive', { items: itemsPayload });
              }} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Confirm Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
