const ICON_PATHS = {
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v3.5" />
      <path d="M16 2.5v3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.2-6-10.2a6 6 0 1 1 12 0C18 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 3.5V8h4.5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20.5V16h-4.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.4-2h4.2l1.4 2h2A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7.5A2 2 0 0 1 6 5.5h12a2 2 0 0 1 2 2v2.2a2.3 2.3 0 0 0 0 4.6v2.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.2a2.3 2.3 0 0 0 0-4.6V7.5Z" />
      <path d="M9.5 6v12" strokeDasharray="2 2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  warning: (
    <>
      <path d="M10.4 4.2a1.85 1.85 0 0 1 3.2 0l7.4 13A1.85 1.85 0 0 1 19.4 20H4.6a1.85 1.85 0 0 1-1.6-2.8l7.4-13Z" />
      <path d="M12 9.5v4" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  chevronLeft: <path d="M15 5.5 8.5 12 15 18.5" />,
  chevronDown: <path d="M5.5 9 12 15.5 18.5 9" />,
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  sparkles: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      <path d="M5 16l.6 1.4L7 18l-1.4.6L5 20l-.6-1.4L3 18l1.4-.6L5 16Z" />
    </>
  ),
  qrCode: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M6.75 6.75h.01" />
      <path d="M17.25 6.75h.01" />
      <path d="M6.75 17.25h.01" />
      <path d="M14 14h3v3h-3z" />
      <path d="M20.5 14v3.5" />
      <path d="M17.5 20.5h3" />
      <path d="M14 20.5h.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8.5" r="3.2" />
      <path d="M20 20v-1.5a3.2 3.2 0 0 0-2.4-3.1" />
      <path d="M15.8 5.4a3.2 3.2 0 0 1 0 6.2" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3 4.5 6.2v5.4c0 4.6 3.2 8.6 7.5 9.6 4.3-1 7.5-5 7.5-9.6V6.2L12 3Z" />
      <path d="m9 12.2 2.2 2.2 4-4.2" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16 8.5 4.5 8.5-4.5" />
    </>
  ),
  zap: <path d="M13.2 2.8 4.8 13.4H12l-1.2 7.8 8.4-10.6H12l1.2-7.8Z" />,
  barChart: (
    <>
      <path d="M4 20h16" />
      <rect x="6" y="12" width="3" height="5" rx="1" />
      <rect x="10.5" y="7.5" width="3" height="9.5" rx="1" />
      <rect x="15" y="4.5" width="3" height="12.5" rx="1" />
    </>
  ),
  armchair: (
    <>
      <path d="M18 10V7a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v3" />
      <path d="M5 10a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1H8v-1a2 2 0 0 0-2-2H5Z" />
      <path d="M6 17v3" />
      <path d="M18 17v3" />
    </>
  ),
};

/** Renders crisp SF-Symbols-inspired rounded-stroke icons. */
export function Icon({ name, size = 16, className = '' }) {
  const pathNode = ICON_PATHS[name];
  if (!pathNode) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ? `ui-icon ${className}` : 'ui-icon'}
    >
      {pathNode}
    </svg>
  );
}
