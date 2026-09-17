import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [form, setForm] = useState({ purchaseOrderId: '', invoiceNumber: '', invoiceDate: '', dueDate: '', totalAmount: '', notes: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, poRes] = await Promise.all([
        axiosClient.get('/invoices'),
        axiosClient.get('/purchase-orders')
      ]);
      setInvoices(invRes.data);
      // Only show POs that can be invoiced
      setPurchaseOrders(poRes.data.filter(po => ['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status)));
    } catch (e) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post('/invoices', {
        ...form,
        purchaseOrderId: Number(form.purchaseOrderId),
        totalAmount: Number(form.totalAmount)
      });
      setShowModal(false);
      setForm({ purchaseOrderId: '', invoiceNumber: '', invoiceDate: '', dueDate: '', totalAmount: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.patch(`/invoices/${selectedInvoice.id}/payment`, { amount: Number(paymentAmount) });
      setShowPaymentModal(false);
      setPaymentAmount('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNPAID': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-orange-100 text-orange-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (invoice) => {
    if (invoice.status === 'PAID') return false;
    const due = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    return due < today;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New Invoice
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
                {['Invoice #', 'PO', 'Date', 'Due Date', 'Total', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {inv.invoiceNumber}
                    {isOverdue(inv) && <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">OVERDUE</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">PO-{inv.purchaseOrder?.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">${inv.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-600">${inv.balanceAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.status !== 'PAID' && (
                      <button onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true); }} className="text-blue-600 hover:text-blue-900 font-medium">Record Payment</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">New Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order *</label>
                <select required value={form.purchaseOrderId} onChange={e => setForm({...form, purchaseOrderId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {purchaseOrders.map(po => <option key={po.id} value={po.id}>PO-{po.id} ({po.supplier?.name})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                  <input type="text" required value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                  <input type="number" required min="0" step="0.01" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date *</label>
                  <input type="date" required value={form.invoiceDate} onChange={e => setForm({...form, invoiceDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input type="date" required value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">Invoice {selectedInvoice.invoiceNumber} | Balance: ${selectedInvoice.balanceAmount?.toFixed(2)}</p>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay *</label>
                <input type="number" required min="0.01" step="0.01" max={selectedInvoice.balanceAmount} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{submitting ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
