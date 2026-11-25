import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';

export function QRScanner({ disabled = false, locked = false, onScan }) {
  const rawId = useId();
  const containerId = `pulse-qr-reader-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const lockedRef = useRef(locked);
  const lastScanRef = useRef({ text: '', time: 0 });
  const mountedRef = useRef(true);

  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  const stopCamera = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;

    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
      } catch {
        // Ignore stop errors if camera was already closed
      }
      try {
        instance.clear();
      } catch {
        // Ignore clear errors
      }
    }

    if (mountedRef.current) {
      setIsScanning(false);
      setIsStarting(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (disabled || isScanning || isStarting) return;

    setCameraError('');

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError(
        'เบราว์เซอร์จำกัดการใช้กล้องเมื่อเปิดผ่าน HTTP ที่ไม่ใช่ localhost กรุณาใช้ช่องกรอกรหัสบัตรด้านล่างแทน'
      );
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง กรุณาใช้ช่องกรอกรหัสบัตรแทน'
      );
      return;
    }

    setIsStarting(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const instance = new Html5Qrcode(containerId);
      scannerRef.current = instance;

      await instance.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          if (lockedRef.current) return;
          const cleaned = String(decodedText || '').trim();
          if (!cleaned) return;

          const now = Date.now();
          if (
            lastScanRef.current.text === cleaned &&
            now - lastScanRef.current.time < 2500
          ) {
            return;
          }

          lastScanRef.current = { text: cleaned, time: now };
          onScanRef.current?.(cleaned);
        },
        () => {
          // Ignore per-frame decode misses
        }
      );

      if (!mountedRef.current) {
        await stopCamera();
        return;
      }

      setIsScanning(true);
    } catch (err) {
      await stopCamera();
      const rawMsg = String(err?.message || err || '');
      if (rawMsg.toLowerCase().includes('permission') || rawMsg.toLowerCase().includes('notallowed')) {
        setCameraError(
          'ไม่ได้รับสิทธิ์เปิดกล้อง (Camera Permission Denied) คุณยังสามารถใช้ช่องกรอกรหัสบัตรด้านล่างได้ตามปกติ'
        );
      } else if (rawMsg.toLowerCase().includes('notfound') || rawMsg.toLowerCase().includes('device')) {
        setCameraError(
          'ไม่พบอุปกรณ์กล้องบนเครื่องนี้ กรุณาใช้ช่องกรอกรหัสบัตรด้านล่างแทน'
        );
      } else {
        setCameraError(
          'ไม่สามารถเปิดกล้องสแกน QR ได้ กรุณาตรวจสอบสิทธิ์กล้องหรือใช้ช่องกรอกรหัสบัตรแทน'
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsStarting(false);
      }
    }
  }, [containerId, disabled, isScanning, isStarting, stopCamera]);

  // Stop camera if scanner becomes disabled (e.g., no event selected)
  useEffect(() => {
    if (disabled && isScanning) {
      stopCamera();
    }
  }, [disabled, isScanning, stopCamera]);

  // Mandatory cleanup when leaving the check-in page (FR-17, AT-13)
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="qr-scanner">
      <div className="qr-scanner__header">
        <div>
          <h3 className="qr-scanner__title">สแกน QR ด้วยกล้อง</h3>
          <p className="qr-scanner__subtitle">
            สแกนรหัสบัตร TKT-... จากหน้าจอผู้เข้าร่วม (หยุดกล้องอัตโนมัติเมื่อออกจากหน้า)
          </p>
        </div>
        <div className="qr-scanner__controls">
          {!isScanning ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={startCamera}
              disabled={disabled || isStarting}
            >
              {isStarting ? 'กำลังเปิดกล้อง...' : 'เปิดกล้องสแกน'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={stopCamera}
            >
              หยุดกล้อง
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="alert alert--warning" role="alert">
          {cameraError}
        </div>
      )}

      <div className={`qr-scanner__viewport ${isScanning ? 'qr-scanner__viewport--active' : ''}`}>
        <div id={containerId} className="qr-scanner__reader" />
        {!isScanning && !isStarting && (
          <div className="qr-scanner__placeholder">
            <Icon name="camera" size={28} />
            <p>
              {disabled
                ? 'กรุณาเลือกงานก่อนเปิดกล้องสแกน'
                : 'กล้องปิดอยู่ กด “เปิดกล้องสแกน” หรือกรอกรหัสบัตรด้วยตนเอง'}
            </p>
          </div>
        )}
      </div>

      {isScanning && locked && (
        <p className="qr-scanner__lock-note" role="status">
          กำลังตรวจสอบ/รอยืนยันบัตรใบปัจจุบัน (พักการอ่านซ้ำชั่วคราว)
        </p>
      )}
    </div>
  );
}
