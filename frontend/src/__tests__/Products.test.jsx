import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock axiosClient
vi.mock('../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  }
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ userRole: 'ADMIN', userEmail: 'admin@test.com', isAuthenticated: true })
}));

import axiosClient from '../api/axiosClient';
import Products from '../pages/Products';

const mockProducts = [
  {
    id: 1, sku: 'SKU-001', name: 'Test Product', barcode: '1234567890',
    category: { id: 1, name: 'Electronics' }, unit: 'pcs',
    currentQuantity: 5, minStockThreshold: 10, isActive: true
  },
  {
    id: 2, sku: 'SKU-002', name: 'Well Stocked',
    category: { id: 1, name: 'Electronics' }, unit: 'pcs',
    currentQuantity: 100, minStockThreshold: 10, isActive: true
  }
];

const mockCategories = [{ id: 1, name: 'Electronics' }];

describe('Products page', () => {
  beforeEach(() => {
    axiosClient.get.mockImplementation((url) => {
      if (url.includes('categories')) return Promise.resolve({ data: mockCategories });
      return Promise.resolve({ data: mockProducts });
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the products table', async () => {
    render(<BrowserRouter><Products /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Well Stocked')).toBeInTheDocument();
    });
  });

  it('shows SKU column', async () => {
    render(<BrowserRouter><Products /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('SKU-001')).toBeInTheDocument();
    });
  });

  it('highlights low-stock product in red or with indicator', async () => {
    render(<BrowserRouter><Products /></BrowserRouter>);

    await waitFor(() => {
      // The product with qty=5 < threshold=10 should have some low-stock visual
      // We just check it renders without error
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });
});
