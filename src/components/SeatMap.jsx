import { useMemo, useState } from 'react';
import { SeatButton } from './SeatButton';
import { SeatLegend } from './SeatLegend';
import {
  IMPACT_ARENA_OVERVIEW_VIEWBOX,
  IMPACT_ARENA_ZONES,
  IMPACT_ARENA_ZONE_VIEWBOX,
  SEAT_MAP_VIEWBOX,
  getImpactZoneMeta,
  getZoneLabel,
  isImpactArenaLayout,
} from '../utils/seatTemplates';

const STAGE_ORIENTATION_LABELS = {
  up: '▲ ด้านหน้าเวที (STAGE) ▲',
  right: '◀ เวทีอยู่ทางด้านซ้าย (STAGE) ◀',
  left: '▶ เวทีอยู่ทางด้านขวา (STAGE) ▶',
  'up-right': '↖ เวทีอยู่ด้านบนซ้าย (STAGE) ↖',
  'up-left': '↗ เวทีอยู่ด้านบนขวา (STAGE) ↗',
};

export function SeatMap({
  seats = [],
  occupiedSeatIds = new Set(),
  selectedSeatId = null,
  templateId = null,
  onSelectSeat,
  readOnly = false,
  disabled = false,
}) {
  const isImpactArena = useMemo(
    () => isImpactArenaLayout(templateId, seats),
    [templateId, seats]
  );

  const [activeZone, setActiveZone] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  const { zonesInfo, zoneByCode, rowsInfo } = useMemo(() => {
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
    return { zonesInfo: sortedZones, zoneByCode: zoneMap, rowsInfo: sortedRows };
  }, [seats, occupiedSeatIds]);

  const selectedSeat = useMemo(
    () => seats.find((s) => s.id === selectedSeatId) || null,
    [seats, selectedSeatId]
  );

  const resolvedActiveZone =
    isImpactArena && activeZone && zoneByCode.has(activeZone) ? activeZone : null;

  const activeZoneMeta = resolvedActiveZone ? getImpactZoneMeta(resolvedActiveZone) : null;

  const activeZoneSeats = useMemo(() => {
    if (!resolvedActiveZone) return [];
    return seats.filter((s) => s.zone === resolvedActiveZone);
  }, [seats, resolvedActiveZone]);

  const activeZoneRows = useMemo(() => {
    if (!resolvedActiveZone) return [];
    const map = new Map();
    for (const seat of activeZoneSeats) {
      if (!map.has(seat.row)) {
        map.set(seat.row, {
          row: seat.row,
          minX: seat.x,
          maxX: seat.x,
          y: seat.y,
        });
      }
      const entry = map.get(seat.row);
      entry.minX = Math.min(entry.minX, seat.x);
      entry.maxX = Math.max(entry.maxX, seat.x);
    }
    return Array.from(map.values()).sort((a, b) => a.y - b.y);
  }, [activeZoneSeats, resolvedActiveZone]);

  const sameTierZones = useMemo(() => {
    if (!activeZoneMeta) return [];
    return IMPACT_ARENA_ZONES.filter(
      (meta) => meta.tier === activeZoneMeta.tier && zoneByCode.has(meta.zone)
    );
  }, [activeZoneMeta, zoneByCode]);

  if (!Array.isArray(seats) || seats.length === 0) {
    return (
      <div className="seat-map-empty">
        ยังไม่มีข้อมูลผังที่นั่งสำหรับงานนี้
      </div>
    );
  }

  // Impact Arena 2-Step Map (Overview -> Zone Seat Picker)
  if (isImpactArena) {
    const hoveredMeta = hoveredZone ? getImpactZoneMeta(hoveredZone) : null;
    const hoveredStats = hoveredZone ? zoneByCode.get(hoveredZone) : null;
    const activeStats = resolvedActiveZone ? zoneByCode.get(resolvedActiveZone) : null;

    return (
      <div className="seat-map-wrapper">
        <div className="seat-map-header">
          {resolvedActiveZone ? (
            <SeatLegend />
          ) : (
            <div className="impact-tier-legend" aria-label="คำอธิบายระดับโซน Impact Arena">
              <span className="impact-tier-legend__item">
                <span className="impact-tier-swatch impact-tier-swatch--floor" />
                <span>Floor (A1–A4)</span>
              </span>
              <span className="impact-tier-legend__item">
                <span className="impact-tier-swatch impact-tier-swatch--level2" />
                <span>Level 2 (SB–ST)</span>
              </span>
              <span className="impact-tier-legend__item">
                <span className="impact-tier-swatch impact-tier-swatch--level3" />
                <span>Level 3 (B–T)</span>
              </span>
              <span className="impact-tier-legend__item">
                <span className="impact-tier-swatch impact-tier-swatch--full" />
                <span>เต็มแล้ว</span>
              </span>
            </div>
          )}

          {!readOnly && (
            <div className="seat-map-selected-chip" aria-live="polite">
              {selectedSeat ? (
                <span>
                  ที่นั่งที่เลือก: <strong>{selectedSeat.label}</strong> (Zone {selectedSeat.zone})
                </span>
              ) : (
                <span className="text-muted">
                  {resolvedActiveZone
                    ? 'คลิกเลือก 1 ที่นั่งว่างในโซนนี้'
                    : 'คลิกเลือกโซนบนผัง Impact Arena'}
                </span>
              )}
            </div>
          )}
        </div>

        {!resolvedActiveZone ? (
          <div className="impact-arena-overview">
            <div className="impact-hover-bar" aria-live="polite">
              {hoveredMeta && hoveredStats ? (
                <span>
                  <strong>Zone {hoveredMeta.zone}</strong> · {hoveredMeta.tierLabel} —{' '}
                  {hoveredStats.available > 0 ? (
                    <span className="impact-hover-bar__avail">
                      ว่าง {hoveredStats.available}/{hoveredStats.total} ที่นั่ง
                    </span>
                  ) : (
                    <span className="impact-hover-bar__full">เต็มแล้ว</span>
                  )}
                </span>
              ) : (
                <span className="text-muted">
                  ชี้หรือคลิกที่โซนบนผังอิมแพ็ค อารีน่าเพื่อดูและเลือกที่นั่ง (ทั้งหมด 42 โซน)
                </span>
              )}
            </div>

            <div className="seat-map-scroll" tabIndex={0} aria-label="ผังรวมอิมแพ็ค อารีน่า เมืองทองธานี">
              <div
                className="impact-overview-canvas"
                style={{
                  aspectRatio: `${IMPACT_ARENA_OVERVIEW_VIEWBOX.width} / ${IMPACT_ARENA_OVERVIEW_VIEWBOX.height}`,
                }}
              >
                <svg
                  viewBox={`0 0 ${IMPACT_ARENA_OVERVIEW_VIEWBOX.width} ${IMPACT_ARENA_OVERVIEW_VIEWBOX.height}`}
                  className="impact-overview-svg"
                >
                  {/* Octagonal IMPACT Arena Outer Architectural Shell */}
                  <polygon
                    points="12,86 888,86 888,438 806,612 630,694 270,694 94,612 12,438"
                    fill="#ffffff"
                    stroke="rgba(0, 0, 0, 0.08)"
                    strokeWidth="1.5"
                  />

                  {/* Subtle Concourse Divider Ring between Level 2 & Level 3 */}
                  <polygon
                    points="116,96 784,96 784,436 730,540 622,590 278,590 170,540 116,436"
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* Top Main Stage + LED Wings + Catwalk + B-Stage */}
                  <rect x="216" y="34" width="48" height="42" rx="6" fill="#2c2c2e" />
                  <text
                    x="240"
                    y="58"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontFamily="var(--font-sans)"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="1"
                  >
                    LED
                  </text>

                  <rect x="636" y="34" width="48" height="42" rx="6" fill="#2c2c2e" />
                  <text
                    x="660"
                    y="58"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontFamily="var(--font-sans)"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="1"
                  >
                    LED
                  </text>

                  <rect x="270" y="18" width="360" height="58" rx="10" fill="#1d1d1f" />
                  <line
                    x1="284"
                    y1="76"
                    x2="616"
                    y2="76"
                    stroke="rgba(0, 113, 227, 0.72)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <text
                    x="450"
                    y="52"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="var(--font-sans)"
                    fontSize="15"
                    fontWeight="700"
                    letterSpacing="4"
                  >
                    STAGE
                  </text>

                  {/* Catwalk Runway & B-Stage */}
                  <rect x="434" y="76" width="32" height="174" fill="#1d1d1f" />
                  <rect x="408" y="248" width="84" height="48" rx="10" fill="#1d1d1f" />
                  <line
                    x1="416"
                    y1="296"
                    x2="484"
                    y2="296"
                    stroke="rgba(0, 113, 227, 0.72)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <text
                    x="450"
                    y="276"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="var(--font-sans)"
                    fontSize="10.5"
                    fontWeight="700"
                    letterSpacing="1.6"
                  >
                    B-STAGE
                  </text>

                  {/* FOH / Control Booth */}
                  <rect
                    x="382"
                    y="374"
                    width="136"
                    height="42"
                    rx="9"
                    fill="#e5e5ea"
                    stroke="rgba(0, 0, 0, 0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x="450"
                    y="399"
                    textAnchor="middle"
                    fill="#424245"
                    fontFamily="var(--font-sans)"
                    fontSize="10.5"
                    fontWeight="700"
                    letterSpacing="1"
                  >
                    FOH / CONTROL
                  </text>

                  {/* Concourse & Venue Labels */}
                  <text
                    x="450"
                    y="495"
                    textAnchor="middle"
                    fill="#86868b"
                    fontFamily="var(--font-sans)"
                    fontSize="10.5"
                    fontWeight="600"
                    letterSpacing="2"
                  >
                    LEVEL 2 · LOWER STAND (SB–ST)
                  </text>
                  <text
                    x="450"
                    y="718"
                    textAnchor="middle"
                    fill="#6e6e73"
                    fontFamily="var(--font-sans)"
                    fontSize="11.5"
                    fontWeight="700"
                    letterSpacing="2.4"
                  >
                    IMPACT ARENA · MUANG THONG THANI (LEVEL 3: B–T)
                  </text>

                  {/* All 42 Interactive IMPACT Arena Zones */}
                  {IMPACT_ARENA_ZONES.map((meta) => {
                    const stats = zoneByCode.get(meta.zone);
                    const total = stats?.total || 0;
                    const available = stats?.available || 0;
                    const isFull = total > 0 && available === 0;
                    const hasSelectedSeat = selectedSeat?.zone === meta.zone;
                    const isHovered = hoveredZone === meta.zone;

                    const groupClasses = [
                      'impact-zone-group',
                      `impact-zone-group--${meta.tier}`,
                      isFull ? 'impact-zone-group--full' : '',
                      hasSelectedSeat ? 'impact-zone-group--selected' : '',
                      isHovered ? 'impact-zone-group--hovered' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <g
                        key={meta.zone}
                        role="button"
                        tabIndex={0}
                        aria-label={`โซน ${meta.zone} (${meta.tierLabel}) ว่าง ${available} จาก ${total} ที่นั่ง`}
                        className={groupClasses}
                        onMouseEnter={() => setHoveredZone(meta.zone)}
                        onMouseLeave={() => setHoveredZone((prev) => (prev === meta.zone ? null : prev))}
                        onFocus={() => setHoveredZone(meta.zone)}
                        onBlur={() => setHoveredZone((prev) => (prev === meta.zone ? null : prev))}
                        onClick={() => {
                          setHoveredZone(null);
                          setActiveZone(meta.zone);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setHoveredZone(null);
                            setActiveZone(meta.zone);
                          }
                        }}
                      >
                        {meta.shape === 'rect' ? (
                          <rect
                            x={meta.x}
                            y={meta.y}
                            width={meta.width}
                            height={meta.height}
                            rx={meta.tier === 'floor' ? 12 : 8}
                            className="impact-zone-shape"
                          />
                        ) : (
                          <polygon
                            points={meta.points}
                            strokeLinejoin="round"
                            className="impact-zone-shape"
                          />
                        )}

                        <text
                          x={meta.labelX}
                          y={meta.labelY - 3}
                          textAnchor="middle"
                          className="impact-zone-code"
                          fontSize={meta.tier === 'floor' ? '18' : '13.5'}
                        >
                          {meta.zone}
                        </text>
                        <text
                          x={meta.labelX}
                          y={meta.labelY + 13}
                          textAnchor="middle"
                          className="impact-zone-count"
                          fontSize={meta.tier === 'floor' ? '11' : '9.5'}
                        >
                          {isFull ? 'เต็ม' : `ว่าง ${available}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="impact-zone-detail">
            <div className="impact-zone-detail-bar">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setActiveZone(null)}
              >
                ← กลับไปผังรวม Impact Arena
              </button>

              <div className="impact-zone-detail-bar__info">
                <strong>
                  Zone {activeZoneMeta?.zone} · {activeZoneMeta?.tierLabel}
                </strong>
                <span className="text-muted text-sm">
                  ว่าง {activeStats?.available ?? 0}/{activeStats?.total ?? 0} ที่นั่ง
                </span>
              </div>
            </div>

            {sameTierZones.length > 1 && (
              <div className="impact-quick-zones" role="navigation" aria-label="สลับโซนในชั้นเดียวกัน">
                {sameTierZones.map((meta) => {
                  const zStats = zoneByCode.get(meta.zone);
                  const isCurrent = meta.zone === resolvedActiveZone;
                  const zFull = zStats && zStats.available === 0;
                  return (
                    <button
                      key={meta.zone}
                      type="button"
                      className={`impact-quick-pill${isCurrent ? ' impact-quick-pill--active' : ''}${zFull ? ' impact-quick-pill--full' : ''}`}
                      onClick={() => setActiveZone(meta.zone)}
                    >
                      {meta.zone}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="seat-map-scroll" tabIndex={0} aria-label={`ที่นั่งในโซน ${resolvedActiveZone}`}>
              <div
                className="seat-map-stage-canvas"
                style={{
                  aspectRatio: `${IMPACT_ARENA_ZONE_VIEWBOX.width} / ${IMPACT_ARENA_ZONE_VIEWBOX.height}`,
                }}
              >
                <svg
                  viewBox={`0 0 ${IMPACT_ARENA_ZONE_VIEWBOX.width} ${IMPACT_ARENA_ZONE_VIEWBOX.height}`}
                  className="seat-map-svg"
                  aria-hidden="true"
                >
                  {/* Stage Direction Indicator */}
                  <rect x="130" y="22" width="500" height="44" rx="12" fill="#1d1d1f" />
                  <line
                    x1="154"
                    y1="66"
                    x2="606"
                    y2="66"
                    stroke="rgba(0, 113, 227, 0.65)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <text
                    x="380"
                    y="49"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="var(--font-sans)"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="1.6"
                  >
                    {STAGE_ORIENTATION_LABELS[activeZoneMeta?.facing] || STAGE_ORIENTATION_LABELS.up}
                  </text>

                  <text
                    x="380"
                    y="100"
                    textAnchor="middle"
                    fill="#6e6e73"
                    fontFamily="var(--font-sans)"
                    fontSize="12.5"
                    fontWeight="600"
                  >
                    Zone {activeZoneMeta?.zone} · {activeZoneMeta?.tierLabel} ({activeStats?.available ?? 0}/{activeStats?.total ?? 0})
                  </text>

                  {activeZoneRows.map((r) => (
                    <g key={r.row}>
                      <text
                        x={r.minX - 48}
                        y={r.y + 4}
                        textAnchor="middle"
                        fill="#86868b"
                        fontFamily="var(--font-sans)"
                        fontSize="12"
                        fontWeight="700"
                      >
                        แถว {r.row}
                      </text>
                      <text
                        x={r.maxX + 48}
                        y={r.y + 4}
                        textAnchor="middle"
                        fill="#86868b"
                        fontFamily="var(--font-sans)"
                        fontSize="12"
                        fontWeight="700"
                      >
                        แถว {r.row}
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="seat-map-buttons">
                  {activeZoneSeats.map((seat) => {
                    const isTaken = occupiedSeatIds.has(seat.id);
                    const isSelected = !isTaken && selectedSeatId === seat.id;
                    const status = isTaken ? 'taken' : isSelected ? 'selected' : 'available';
                    const shortLabel = `${seat.row}${String(seat.number).padStart(2, '0')}`;

                    return (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        status={status}
                        viewBox={IMPACT_ARENA_ZONE_VIEWBOX}
                        displayLabel={shortLabel}
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
          </div>
        )}

        {!readOnly && (
          <p className="seat-map-disclaimer">
            ที่นั่งจะถูกล็อกหลังยืนยันลงทะเบียนสำเร็จ (อัปเดตทุก 5 วินาที)
          </p>
        )}
      </div>
    );
  }

  // Standard Curved Hall / Intimate Stage / Grand Arena Templates
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
