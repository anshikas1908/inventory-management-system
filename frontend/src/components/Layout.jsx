import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { logout, userEmail, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(userRole);
  const isStaff = userRole === 'STAFF';
  const isSupplierContact = userRole === 'SUPPLIER_CONTACT';
  const isCustomer = userRole === 'CUSTOMER';

  const navClass = ({ isActive }) =>
    `block px-4 py-2 rounded-md transition-colors ${
      isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-gray-800 text-white flex flex-col shrink-0">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          Inventory MS
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {(isAdminOrManager || isStaff) && (
            <>
              <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
              <NavLink to="/products" className={navClass}>Products</NavLink>
              <NavLink to="/categories" className={navClass}>Categories</NavLink>
              <NavLink to="/stock-transactions" className={navClass}>Stock Transactions</NavLink>
              <NavLink to="/purchase-orders" className={navClass}>Purchase Orders</NavLink>
            </>
          )}
          {isAdminOrManager && (
            <>
              <NavLink to="/warehouses" className={navClass}>Warehouses</NavLink>
              <NavLink to="/warehouses/transfers" className={navClass}>Warehouse Transfers</NavLink>
              <NavLink to="/invoices" className={navClass}>Invoices</NavLink>
              <NavLink to="/suppliers" className={navClass}>Suppliers</NavLink>
              <NavLink to="/reports/suppliers" className={navClass}>Supplier Report</NavLink>
              <NavLink to="/notifications" className={navClass}>Notifications</NavLink>
            </>
          )}
          {isSupplierContact && (
            <>
              <NavLink to="/portal/supplier" className={navClass}>Supplier Portal</NavLink>
            </>
          )}
          {isCustomer && (
            <>
              <NavLink to="/portal/customer" className={navClass}>Product Catalogue</NavLink>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2 truncate" title={userEmail}>
            {userEmail}
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
