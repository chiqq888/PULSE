import { SEAT_MAP_VIEWBOX } from '../utils/seatTemplates';

export function SeatButton({
  seat,
  status = 'available',
  disabled = false,
  onSelect,
}) {
  const isTaken = status === 'taken';
  const isSelected = status === 'selected';
  const leftPercent = (seat.x / SEAT_MAP_VIEWBOX.width) * 100;
  const topPercent = (seat.y / SEAT_MAP_VIEWBOX.height) * 100;

  const statusText = isTaken
    ? 'ถูกลงทะเบียนแล้ว'
    : isSelected
      ? 'กำลังเลือก'
      : 'ว่าง';

  return (
    <button
      type="button"
      className={`seat-btn seat-btn--${status}`}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
      }}
      disabled={isTaken || disabled}
      aria-pressed={isSelected}
      aria-label={`ที่นั่ง ${seat.label} โซน ${seat.zone} แถว ${seat.row} สถานะ ${statusText}`}
      title={`${seat.label} (Zone ${seat.zone}) - ${statusText}`}
      onClick={() => {
        if (!isTaken && !disabled) {
          onSelect?.(seat);
        }
      }}
    >
      {isTaken ? (
        <>
          <span className="seat-btn__mark" aria-hidden="true">
            ✕
          </span>
          <span className="seat-btn__sub">{seat.label}</span>
        </>
      ) : isSelected ? (
        <>
          <span className="seat-btn__mark" aria-hidden="true">
            ✓
          </span>
          <span className="seat-btn__sub">{seat.label}</span>
        </>
      ) : (
        <span className="seat-btn__label">{seat.label}</span>
      )}
    </button>
  );
}
