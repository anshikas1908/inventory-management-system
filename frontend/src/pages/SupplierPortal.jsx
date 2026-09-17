import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function SupplierPortal() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [poRes, invRes] = await Promise.all([
          axiosClient.get('/portal/supplier/purchase-orders'),
          axiosClient.get('/portal/supplier/invoices')
        ]);
        setPurchaseOrders(poRes.data);
        setInvoices(invRes.data);
      } catch (err) {
        setError('Failed to load portal data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPoStatusBadge = (status) => {
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

  const getInvStatusBadge = (status) => {
    switch (status) {
      case 'UNPAID': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-orange-100 text-orange-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 bg-blue-600 rounded-xl p-6 text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Supplier Portal</h1>
        <p className="text-blue-100">Welcome to your dashboard. View your orders and invoices below.</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-6">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Orders Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">My Purchase Orders</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PO ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-800">PO-{po.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPoStatusBadge(po.status)}`}>{po.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">${po.totalAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No purchase orders found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">My Invoices</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInvStatusBadge(inv.status)}`}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-orange-600">${inv.balanceAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No invoices found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
