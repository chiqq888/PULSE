const BADGE_CONFIG = {
  // Event statuses
  draft: { label: 'Draft', symbol: '○', className: 'badge badge--neutral' },
  published: { label: 'Published', symbol: '●', className: 'badge badge--success' },
  closed: { label: 'Closed', symbol: '■', className: 'badge badge--muted' },

  // Ticket statuses
  valid: { label: 'Valid', symbol: '✓', className: 'badge badge--success' },
  used: { label: 'Used', symbol: '★', className: 'badge badge--info' },
  cancelled: { label: 'Cancelled', symbol: '✕', className: 'badge badge--danger' },

  // Event types
  event: { label: 'Event', symbol: null, className: 'badge badge--meta' },
  concert: { label: 'Concert', symbol: null, className: 'badge badge--meta' },

  // Registration modes
  unlimited: { label: 'ไม่จำกัด', symbol: null, className: 'badge badge--meta' },
  limited: { label: 'จำกัดจำนวน', symbol: null, className: 'badge badge--meta' },
  seated: { label: 'เลือกที่นั่ง', symbol: null, className: 'badge badge--meta' },
};

export function StatusBadge({ type, labelOverride }) {
  const cfg = BADGE_CONFIG[type] || {
    label: String(type || '-'),
    symbol: null,
    className: 'badge badge--neutral',
  };

  return (
    <span className={cfg.className}>
      {cfg.symbol && (
        <span className="badge__symbol" aria-hidden="true">
          {cfg.symbol}
        </span>
      )}
      <span>{labelOverride || cfg.label}</span>
    </span>
  );
}
