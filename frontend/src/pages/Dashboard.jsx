import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Dashboard() {
  const [stats, setStats] = useState({ lowStockCount: 0, warehouseCount: 0 });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [lowStockRes, whRes] = await Promise.all([
          axiosClient.get('/products/low-stock').catch(() => ({ data: [] })),
          axiosClient.get('/warehouses').catch(() => ({ data: [] }))
        ]);
        
        setLowStockAlerts(lowStockRes.data);
        setStats({
          lowStockCount: lowStockRes.data.length,
          warehouseCount: whRes.data.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.lowStockCount}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Warehouses</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.warehouseCount}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Low Stock Alerts</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {lowStockAlerts.length === 0 ? (
                <li className="px-4 py-4 sm:px-6 text-gray-500">No low stock items.</li>
              ) : (
                lowStockAlerts.map(alert => (
                  <li key={alert.id} className="px-4 py-4 sm:px-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate">{alert.name} ({alert.sku})</p>
                      <p className="text-sm text-gray-500">Min Threshold: {alert.minStockThreshold}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Current: {alert.currentQuantity}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}