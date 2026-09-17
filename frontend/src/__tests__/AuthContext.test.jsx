import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

// A helper component to test AuthContext
function TestComponent() {
  const { isAuthenticated, userRole, userEmail, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="role">{userRole}</span>
      <span data-testid="email">{userEmail}</span>
      <button onClick={() => login('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGVzIjpbIlJPTEVfQURNSU4iXX0.sig')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated when no token', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });

  it('becomes authenticated after login', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('auth').textContent).toBe('yes');
  });

  it('extracts role from JWT payload', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => {
      screen.getByText('Login').click();
    });

    // The mock token has roles: ["ROLE_ADMIN"] in payload
    expect(screen.getByTestId('role').textContent).toBe('ADMIN');
  });

  it('becomes unauthenticated after logout', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => screen.getByText('Login').click());
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    
    act(() => screen.getByText('Logout').click());
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });
});
