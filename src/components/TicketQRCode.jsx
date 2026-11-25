import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function TicketQRCode({ ticketId, size = 200, showCopy = true }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div className="ticket-qr">
      <div className="ticket-qr__frame" aria-label={`QR Code สำหรับบัตร ${ticketId}`}>
        <QRCodeSVG value={ticketId} size={size} level="M" includeMargin />
      </div>
      <div className="ticket-qr__code-row">
        <code className="ticket-qr__id">{ticketId}</code>
        {showCopy && (
          <button
            type="button"
            className="btn btn--secondary btn--xs"
            onClick={handleCopy}
          >
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกรหัส'}
          </button>
        )}
      </div>
      <p className="ticket-qr__note">
        QR นี้เก็บรหัสบัตรเฉพาะตัวของคุณเท่านั้น ใช้แสดงต่อ Staff เพื่อเช็กอินหน้างาน
      </p>
    </div>
  );
}
