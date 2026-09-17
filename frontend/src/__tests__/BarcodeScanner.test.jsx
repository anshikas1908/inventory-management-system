import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the @zxing/browser module
vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    listVideoInputDevices: vi.fn().mockResolvedValue([{ deviceId: 'cam-1', label: 'Test Camera' }]),
    decodeFromVideoDevice: vi.fn(),
    reset: vi.fn(),
  }))
}));

import BarcodeScanner from '../components/BarcodeScanner';

describe('BarcodeScanner component', () => {
  it('renders the scanner modal', () => {
    const onScan = vi.fn();
    const onClose = vi.fn();

    render(<BarcodeScanner onScan={onScan} onClose={onClose} />);

    expect(screen.getByText('Scan Barcode')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onScan = vi.fn();
    const onClose = vi.fn();

    render(<BarcodeScanner onScan={onScan} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when × button is clicked', () => {
    const onScan = vi.fn();
    const onClose = vi.fn();

    render(<BarcodeScanner onScan={onScan} onClose={onClose} />);

    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
