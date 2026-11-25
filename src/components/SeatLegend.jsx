export function SeatLegend() {
  return (
    <div className="seat-legend" role="list" aria-label="คำอธิบายสถานะที่นั่ง">
      <div className="seat-legend__item" role="listitem">
        <span className="seat-swatch seat-swatch--available" aria-hidden="true">
          A01
        </span>
        <span>ว่าง</span>
      </div>
      <div className="seat-legend__item" role="listitem">
        <span className="seat-swatch seat-swatch--selected" aria-hidden="true">
          ✓
        </span>
        <span>กำลังเลือก</span>
      </div>
      <div className="seat-legend__item" role="listitem">
        <span className="seat-swatch seat-swatch--taken" aria-hidden="true">
          ✕
        </span>
        <span>จองแล้ว</span>
      </div>
    </div>
  );
}
