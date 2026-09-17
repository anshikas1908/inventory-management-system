import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axiosClient.post('/categories', { name, description });
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axiosClient.patch(`/categories/${id}/deactivate`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate category');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Category</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 min-w-[300px] border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </form>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeactivate(cat.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}