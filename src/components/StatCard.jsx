export function StatCard({ label, value, sublabel, tone = 'default' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {sublabel && <span className="stat-card__sublabel">{sublabel}</span>}
    </div>
  );
}
