import { useMemo } from 'react';
import { SeatButton } from './SeatButton';
import { SeatLegend } from './SeatLegend';
import { SEAT_MAP_VIEWBOX, getZoneLabel } from '../utils/seatTemplates';

export function SeatMap({
  seats = [],
  occupiedSeatIds = new Set(),
  selectedSeatId = null,
  onSelectSeat,
  readOnly = false,
  disabled = false,
}) {
  const { zonesInfo, rowsInfo } = useMemo(() => {
    const zoneMap = new Map();
    const rowMap = new Map();

    for (const seat of seats) {
      if (!zoneMap.has(seat.zone)) {
        zoneMap.set(seat.zone, {
          zone: seat.zone,
          minY: seat.y,
          maxY: seat.y,
          total: 0,
          available: 0,
        });
      }
      const zEntry = zoneMap.get(seat.zone);
      zEntry.minY = Math.min(zEntry.minY, seat.y);
      zEntry.maxY = Math.max(zEntry.maxY, seat.y);
      zEntry.total += 1;
      if (!occupiedSeatIds.has(seat.id)) {
        zEntry.available += 1;
      }

      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, {
          row: seat.row,
          minX: seat.x,
          maxX: seat.x,
          leftY: seat.y,
          rightY: seat.y,
        });
      }
      const rEntry = rowMap.get(seat.row);
      if (seat.x < rEntry.minX) {
        rEntry.minX = seat.x;
        rEntry.leftY = seat.y;
      }
      if (seat.x > rEntry.maxX) {
        rEntry.maxX = seat.x;
        rEntry.rightY = seat.y;
      }
    }

    const sortedZones = Array.from(zoneMap.values()).sort((a, b) => a.minY - b.minY);
    const sortedRows = Array.from(rowMap.values()).sort((a, b) => a.leftY - b.leftY);
    return { zonesInfo: sortedZones, rowsInfo: sortedRows };
  }, [seats, occupiedSeatIds]);

  const selectedSeat = useMemo(
    () => seats.find((s) => s.id === selectedSeatId) || null,
    [seats, selectedSeatId]
  );

  if (!Array.isArray(seats) || seats.length === 0) {
    return (
      <div className="seat-map-empty">
        ยังไม่มีข้อมูลผังที่นั่งสำหรับงานนี้
      </div>
    );
  }

  return (
    <div className="seat-map-wrapper">
      <div className="seat-map-header">
        <SeatLegend />
        {!readOnly && (
          <div className="seat-map-selected-chip" aria-live="polite">
            {selectedSeat ? (
              <span>
                ที่นั่งที่เลือก: <strong>{selectedSeat.label}</strong> (Zone {selectedSeat.zone})
              </span>
            ) : (
              <span className="text-muted">คลิกหรือใช้คีย์บอร์ดเลือก 1 ที่นั่งว่าง</span>
            )}
          </div>
        )}
      </div>

      <div className="seat-map-scroll" tabIndex={0} aria-label="พื้นที่ผังที่นั่งคอนเสิร์ต">
        <div
          className="seat-map-stage-canvas"
          style={{
            aspectRatio: `${SEAT_MAP_VIEWBOX.width} / ${SEAT_MAP_VIEWBOX.height}`,
          }}
        >
          <svg
            viewBox={`0 0 ${SEAT_MAP_VIEWBOX.width} ${SEAT_MAP_VIEWBOX.height}`}
            className="seat-map-svg"
            aria-hidden="true"
          >
            {/* Architectural Apple Stage Platform */}
            <path
              d="M 180 26 Q 380 42 580 26 L 566 60 Q 380 78 194 60 Z"
              fill="#1d1d1f"
            />
            <path
              d="M 196 60 Q 380 78 564 60"
              fill="none"
              stroke="rgba(0, 113, 227, 0.45)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <text
              x="380"
              y="49"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif"
              fontSize="12"
              fontWeight="600"
              letterSpacing="3.5"
            >
              STAGE
            </text>

            {/* Zone headers & concentric divider arcs */}
            {zonesInfo.map((info, idx) => {
              const labelY = Math.max(104, info.minY - 34);
              const prevZone = idx > 0 ? zonesInfo[idx - 1] : null;
              const dividerY = prevZone
                ? Math.round((prevZone.maxY + info.minY) / 2) - 8
                : null;

              return (
                <g key={info.zone}>
                  {dividerY !== null && (
                    <path
                      d={`M 96 ${dividerY - 10} Q 380 ${dividerY + 14} 664 ${dividerY - 10}`}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.08)"
                      strokeWidth="1"
                    />
                  )}
                  <text
                    x="380"
                    y={labelY}
                    textAnchor="middle"
                    fill="#6e6e73"
                    fontFamily="'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="0.4"
                  >
                    {getZoneLabel(info.zone)} ({info.available}/{info.total})
                  </text>
                </g>
              );
            })}

            {/* Row Indicators on Left & Right */}
            {rowsInfo.map((r) => (
              <g key={r.row}>
                <text
                  x={r.minX - 42}
                  y={r.leftY + 4}
                  textAnchor="middle"
                  fill="#86868b"
                  fontFamily="'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                >
                  {r.row}
                </text>
                <text
                  x={r.maxX + 42}
                  y={r.rightY + 4}
                  textAnchor="middle"
                  fill="#86868b"
                  fontFamily="'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                >
                  {r.row}
                </text>
              </g>
            ))}
          </svg>

          <div className="seat-map-buttons">
            {seats.map((seat) => {
              const isTaken = occupiedSeatIds.has(seat.id);
              const isSelected = !isTaken && selectedSeatId === seat.id;
              const status = isTaken ? 'taken' : isSelected ? 'selected' : 'available';

              return (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  status={status}
                  disabled={readOnly || disabled}
                  onSelect={(clicked) => {
                    if (selectedSeatId === clicked.id) {
                      onSelectSeat?.(null);
                    } else {
                      onSelectSeat?.(clicked.id);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {!readOnly && (
        <p className="seat-map-disclaimer">
          ที่นั่งจะถูกล็อกหลังยืนยันลงทะเบียนสำเร็จ (อัปเดตทุก 5 วินาที)
        </p>
      )}
    </div>
  );
}
