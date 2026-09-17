import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function SupplierReport() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [supplierHistory, setSupplierHistory] = useState({});

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/suppliers/report');
      setReport(res.data);
    } catch (e) {
      setError('Failed to load supplier report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const fetchHistory = async (id) => {
    if (supplierHistory[id]) return;
    try {
      const res = await axiosClient.get(`/suppliers/${id}/purchase-history`);
      setSupplierHistory(prev => ({ ...prev, [id]: res.data }));
    } catch {
      setSupplierHistory(prev => ({ ...prev, [id]: [] }));
    }
  };

  const handleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    fetchHistory(id);
  };

  const handleExportCSV = () => {
    let csv = 'Supplier Name,Total Orders,Total Spend\n';
    report.forEach(r => {
      csv += `"${r.supplier?.name || ''}",${r.orderCount},${r.totalSpend}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Supplier Report</h1>
        <button onClick={handleExportCSV}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Export CSV
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spend</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.map(r => (
                <React.Fragment key={r.supplier?.id || Math.random()}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleExpand(r.supplier?.id)}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{r.supplier?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.orderCount}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      ${r.totalSpend?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 text-sm">
                      {expandedId === r.supplier?.id ? '▲ Hide' : '▼ View'}
                    </td>
                  </tr>
                  {expandedId === r.supplier?.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={4} className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">PO History for {r.supplier?.name}</p>
                        {!supplierHistory[r.supplier?.id] ? (
                          <p className="text-gray-400 text-sm">Loading...</p>
                        ) : supplierHistory[r.supplier?.id].length === 0 ? (
                          <p className="text-gray-500 text-sm">No history.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="py-2 pr-4">PO ID</th>
                                <th className="py-2 pr-4">Date</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2">Total Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {supplierHistory[r.supplier?.id].map(po => (
                                <tr key={po.id}>
                                  <td className="py-2 pr-4 font-mono text-xs">{po.id}</td>
                                  <td className="py-2 pr-4 text-gray-600">{new Date(po.createdAt).toLocaleDateString()}</td>
                                  <td className="py-2 pr-4 text-gray-800 font-medium">{po.status}</td>
                                  <td className="py-2 font-medium">${po.totalAmount?.toFixed(2)}</td>
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
              {report.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No report data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
