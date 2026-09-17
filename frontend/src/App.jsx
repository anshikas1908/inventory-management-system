import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import StockTransactions from './pages/StockTransactions';
import Warehouses from './pages/Warehouses';
import WarehouseTransfers from './pages/WarehouseTransfers';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Suppliers from './pages/Suppliers';
import SupplierReport from './pages/SupplierReport';
import Notifications from './pages/Notifications';
import SupplierPortal from './pages/SupplierPortal';
import CustomerPortal from './pages/CustomerPortal';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
          <Route path="/stock-transactions" element={<ProtectedRoute><Layout><StockTransactions /></Layout></ProtectedRoute>} />
          
          <Route path="/warehouses" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Layout><Warehouses /></Layout></ProtectedRoute>} />
          <Route path="/warehouses/transfers" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Layout><WarehouseTransfers /></Layout></ProtectedRoute>} />
          
          <Route path="/purchase-orders" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF']}><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />
          
          <Route path="/invoices" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Layout><Invoices /></Layout></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Layout><Suppliers /></Layout></ProtectedRoute>} />
          <Route path="/reports/suppliers" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Layout><SupplierReport /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Layout><Notifications /></Layout></ProtectedRoute>} />
          
          <Route path="/portal/supplier" element={<ProtectedRoute roles={['SUPPLIER_CONTACT']}><Layout><SupplierPortal /></Layout></ProtectedRoute>} />
          <Route path="/portal/customer" element={<ProtectedRoute roles={['CUSTOMER']}><Layout><CustomerPortal /></Layout></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;