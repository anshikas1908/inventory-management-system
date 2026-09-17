import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const readerRef = useRef(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.listVideoInputDevices()
      .then(devices => {
        if (devices.length === 0) {
          setError('No camera found');
          return;
        }
        setScanning(true);
        const deviceId = devices[0].deviceId;
        reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText());
            reader.reset();
          }
          if (err && !(err.name === 'NotFoundException')) {
            // NotFoundException is normal (no barcode in frame yet)
          }
        });
      })
      .catch(e => setError('Camera access denied: ' + e.message));

    return () => {
      if (readerRef.current) {
        try { readerRef.current.reset(); } catch {}
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        {error && <p className="text-red-600 mb-3">{error}</p>}
        {scanning && <p className="text-gray-500 text-sm mb-2">Point camera at barcode...</p>}
        <video ref={videoRef} className="w-full rounded-lg border" style={{ minHeight: 240 }} />
        <button onClick={onClose} className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </div>
  );
}
