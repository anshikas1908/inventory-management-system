import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const payload = token ? decodeToken(token) : {};

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const isAuthenticated = !!token;
  const userEmail = payload.sub || '';
  let userRole = '';
  if (payload.roles && payload.roles.length > 0) {
    userRole = payload.roles[0].replace('ROLE_', '');
  } else if (payload.role) {
    userRole = payload.role.replace('ROLE_', '');
  }
  const linkedSupplierId = payload.linkedSupplierId || null;

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated, userRole, userEmail, linkedSupplierId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}