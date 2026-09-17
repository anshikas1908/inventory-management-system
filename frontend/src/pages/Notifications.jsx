import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const filtered = notifications.filter(n => 
    !filter || n.product?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <button onClick={fetchNotifications}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Filter by product name..." value={filter} onChange={e => setFilter(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Type', 'Recipient', 'Message', 'Qty/Threshold', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(n => {
                const isCriticallyLow = n.currentQuantity < (n.threshold / 2);
                return (
                  <tr key={n.id} className={`${isCriticallyLow ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{n.product?.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{n.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{n.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{n.recipient}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 truncate max-w-xs" title={n.message}>{n.message}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-semibold ${isCriticallyLow ? 'text-red-700' : 'text-gray-800'}`}>{n.currentQuantity}</span>
                      <span className="text-gray-500"> / {n.threshold}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(n.sentAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No notifications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
