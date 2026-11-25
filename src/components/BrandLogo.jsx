import { Link } from 'react-router-dom';

export function BrandLogo({ to = '/', role = '', roleLabel = '' }) {
  const roleClass = role
    ? `brand-logo__role brand-logo__role--${role}`
    : 'brand-logo__role';

  return (
    <Link
      to={to}
      className="brand-logo"
      aria-label={roleLabel ? `PULSE (${roleLabel})` : 'PULSE'}
    >
      <img
        src="/images/pulse-logo.svg"
        alt="PULSE"
        width="73"
        height="28"
        className="brand-logo__mark"
      />
      {roleLabel && <span className={roleClass}>{roleLabel}</span>}
    </Link>
  );
}
