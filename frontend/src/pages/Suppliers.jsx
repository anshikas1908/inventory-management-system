import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', contactPerson: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/suppliers');
      setSuppliers(res.data);
    } catch (e) {
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (form.id) {
        await axiosClient.put(`/suppliers/${form.id}`, form);
      } else {
        await axiosClient.post('/suppliers', form);
      }
      setShowModal(false);
      setForm({ id: null, name: '', contactPerson: '', phone: '', email: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this supplier?')) return;
    try {
      await axiosClient.patch(`/suppliers/${id}/deactivate`);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate supplier');
    }
  };

  const openEdit = (supplier) => {
    setForm(supplier);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <button onClick={() => { setForm({ id: null, name: '', contactPerson: '', phone: '', email: '', address: '' }); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Add Supplier
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
                {['Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.contactPerson}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{s.address}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                      {s.isActive && (
                        <button onClick={() => handleDeactivate(s.id)} className="text-red-600 hover:text-red-900 font-medium">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{form.id ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[{label:'Name', key:'name'}, {label:'Contact Person', key:'contactPerson'}, {label:'Phone', key:'phone'}, {label:'Email', key:'email', type: 'email'}, {label:'Address', key:'address'}].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} *</label>
                  <input type={f.type || 'text'} required value={form[f.key] || ''} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
