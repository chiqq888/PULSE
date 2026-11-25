import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../Icon';

const CURVE_OFFSETS = [6, 3, 1, 0, 0, 1, 3, 6];

const MINI_SEATS = [
  // Row A · Zone A Front Stage
  { id: 'A-01', label: 'A01', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[0], taken: false },
  { id: 'A-02', label: 'A02', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[1], taken: true },
  { id: 'A-03', label: 'A03', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[2], taken: true },
  { id: 'A-04', label: 'A04', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[3], taken: false },
  { id: 'A-05', label: 'A05', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[4], taken: true },
  { id: 'A-06', label: 'A06', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[5], taken: false },
  { id: 'A-07', label: 'A07', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[6], taken: true },
  { id: 'A-08', label: 'A08', zone: 'A', row: 'A', curveOffset: CURVE_OFFSETS[7], taken: true },
  // Row B · Zone B Main Floor
  { id: 'B-01', label: 'B01', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[0], taken: true },
  { id: 'B-02', label: 'B02', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[1], taken: false },
  { id: 'B-03', label: 'B03', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[2], taken: true },
  { id: 'B-04', label: 'B04', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[3], taken: true },
  { id: 'B-05', label: 'B05', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[4], taken: false },
  { id: 'B-06', label: 'B06', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[5], taken: true },
  { id: 'B-07', label: 'B07', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[6], taken: false },
  { id: 'B-08', label: 'B08', zone: 'B', row: 'B', curveOffset: CURVE_OFFSETS[7], taken: true },
  // Row C · Zone C Balcony
  { id: 'C-01', label: 'C01', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[0], taken: true },
  { id: 'C-02', label: 'C02', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[1], taken: true },
  { id: 'C-03', label: 'C03', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[2], taken: false },
  { id: 'C-04', label: 'C04', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[3], taken: false },
  { id: 'C-05', label: 'C05', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[4], taken: true },
  { id: 'C-06', label: 'C06', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[5], taken: true },
  { id: 'C-07', label: 'C07', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[6], taken: true },
  { id: 'C-08', label: 'C08', zone: 'C', row: 'C', curveOffset: CURVE_OFFSETS[7], taken: false },
];

const ZONE_NAMES = {
  A: 'Zone A · Front Stage',
  B: 'Zone B · Main Floor',
  C: 'Zone C · Balcony',
};

const SCENES = [
  {
    id: 'seatmap',
    num: '01',
    label: 'เลือกที่นั่ง',
    getUrl: () => 'pulse.chiqq888.me/user/events/pulse-live-2026',
  },
  {
    id: 'ticket',
    num: '02',
    label: 'รับ QR Code',
    getUrl: (code) => `pulse.chiqq888.me/user/tickets/${code}`,
  },
  {
    id: 'checkin',
    num: '03',
    label: 'สแกนเช็กอิน',
    getUrl: () => 'pulse.chiqq888.me/staff/check-in',
  },
];

const EQ_HEIGHTS = [0.42, 0.85, 0.58, 1, 0.65, 0.9, 0.5, 0.78, 0.45];

function getReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HeroShowcase() {
  const [selectedSeatId, setSelectedSeatId] = useState('A-04');
  const [activeScene, setActiveScene] = useState(0);
  const [autoPlay, setAutoPlay] = useState(() => !getReducedMotion());
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  const selectedSeat = useMemo(
    () => MINI_SEATS.find((seat) => seat.id === selectedSeatId) || MINI_SEATS[3],
    [selectedSeatId]
  );

  const takenCount = useMemo(
    () => MINI_SEATS.filter((seat) => seat.taken).length,
    []
  );

  const reservedCount = takenCount + 1;
  const capacityPct = Math.round((reservedCount / MINI_SEATS.length) * 100);
  const ticketCode = `PULSE-LIVE-${selectedSeat.id}`;
  const currentScene = SCENES[activeScene];

  useEffect(() => {
    if (!autoPlay) return undefined;
    const timer = window.setInterval(() => {
      setActiveScene((prev) => (prev + 1) % SCENES.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [autoPlay]);

  const handlePointerMove = useCallback((event) => {
    if (getReducedMotion()) return;
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = (event.clientX - rect.left) / rect.width - 0.5;
    const normY = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Number((-normY * 4.4).toFixed(2)),
      y: Number((normX * 4.4).toFixed(2)),
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const selectSeat = (seatId) => {
    setSelectedSeatId(seatId);
    setAutoPlay(false);
  };

  const goToScene = (index) => {
    setActiveScene(index);
    setAutoPlay(false);
  };

  const seatRows = useMemo(
    () => [
      { name: 'A', seats: MINI_SEATS.filter((s) => s.row === 'A') },
      { name: 'B', seats: MINI_SEATS.filter((s) => s.row === 'B') },
      { name: 'C', seats: MINI_SEATS.filter((s) => s.row === 'C') },
    ],
    []
  );

  return (
    <div
      ref={stageRef}
      className="lp-screen-stage"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      style={{
        '--tilt-x': `${tilt.x}deg`,
        '--tilt-y': `${tilt.y}deg`,
      }}
    >
      <div className="lp-screen-glow" aria-hidden="true" />

      <div className="lp-screen-frame" aria-label="หน้าจอจำลองการใช้งานระบบ PULSE">
        {/* Browser Chrome Top Bar */}
        <div className="lp-screen-chrome">
          <div className="lp-chrome-dots" aria-hidden="true">
            <span className="lp-chrome-dot lp-chrome-dot--red" />
            <span className="lp-chrome-dot lp-chrome-dot--yellow" />
            <span className="lp-chrome-dot lp-chrome-dot--green" />
          </div>

          <div className="lp-chrome-url" title={currentScene.getUrl(ticketCode)}>
            <Icon name="shieldCheck" size={12} />
            <span>{currentScene.getUrl(ticketCode)}</span>
          </div>

          <div className="lp-chrome-controls">
            <button
              type="button"
              className="lp-chrome-toggle"
              onClick={() => setAutoPlay((prev) => !prev)}
              aria-pressed={autoPlay}
            >
              {autoPlay ? 'หยุดสลับหน้า' : 'เล่นอัตโนมัติ'}
            </button>
          </div>
        </div>

        {/* Simulated In-App Navigation Bar */}
        <div className="lp-app-bar">
          <img
            src="/images/pulse-logo.svg"
            alt="PULSE"
            width="58"
            height="22"
            className="lp-app-bar__logo"
          />

          <div
            className="lp-app-tabs"
            role="tablist"
            aria-label="ขั้นตอนการทำงานในหน้าจอตัวอย่าง"
          >
            {SCENES.map((scene, idx) => {
              const isActive = activeScene === idx;
              return (
                <button
                  key={scene.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`lp-app-tab ${isActive ? 'lp-app-tab--active' : ''}`}
                  onClick={() => goToScene(idx)}
                >
                  <span className="lp-app-tab__num">{scene.num}</span>
                  <span>{scene.label}</span>
                  {isActive && (
                    <span
                      key={`${activeScene}-${autoPlay ? 'run' : 'pause'}`}
                      className={`lp-app-tab__progress ${
                        autoPlay ? 'lp-app-tab__progress--running' : ''
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <span className="lp-app-status-chip">ฟรี ฿0 · 142/150</span>
        </div>

        {/* Dynamic Viewport Content */}
        <div className="lp-screen-body">
          <div key={currentScene.id} className="lp-scene lp-scene-enter">
            {activeScene === 0 && (
              <div className="lp-scene-seatmap">
                <div className="lp-screen-panel lp-seatmap-panel">
                  <div className="lp-screen-event-bar">
                    <div className="lp-screen-event-bar__copy">
                      <span className="badge badge--accent">CONCERT · SEATED</span>
                      <h3>PULSE Live Sessions 2026</h3>
                      <p>เสาร์ 12 ธ.ค. 2569 · 19:00 น. · PULSE Grand Hall</p>
                    </div>
                    <div className="lp-eq" aria-hidden="true">
                      {EQ_HEIGHTS.map((scale, idx) => (
                        <span
                          key={idx}
                          className="lp-eq__bar"
                          style={{
                            '--eq-scale': scale,
                            '--eq-delay': `${idx * 110}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <svg viewBox="0 0 280 34" className="lp-screen-stage-svg" aria-hidden="true">
                    <path d="M 30 6 Q 140 19 250 6 L 238 25 Q 140 37 42 25 Z" fill="#1d1d1f" />
                    <path
                      d="M 44 25 Q 140 36 236 25"
                      fill="none"
                      stroke="#0071e3"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    <text
                      x="140"
                      y="20"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontFamily="var(--font-sans)"
                      fontSize="8.5"
                      fontWeight="700"
                      letterSpacing="2.8"
                    >
                      STAGE
                    </text>
                  </svg>

                  <div className="lp-screen-rows" aria-label="แผนผังเลือกที่นั่ง 3 โซน">
                    {seatRows.map((group) => (
                      <div key={group.name} className="lp-screen-row">
                        <span className="lp-screen-row__label">{group.name}</span>
                        <div className="lp-screen-row__seats">
                          {group.seats.map((seat, idx) => {
                            const isSelected = selectedSeat.id === seat.id;
                            const stateClass = seat.taken
                              ? 'lp-mini-seat--taken'
                              : isSelected
                                ? 'lp-mini-seat--selected'
                                : 'lp-mini-seat--available';

                            return (
                              <button
                                key={seat.id}
                                type="button"
                                disabled={seat.taken}
                                aria-pressed={isSelected}
                                aria-label={
                                  seat.taken
                                    ? `ที่นั่ง ${seat.label} ไม่ว่าง`
                                    : `เลือกที่นั่ง ${seat.label}`
                                }
                                onClick={() => selectSeat(seat.id)}
                                className={`lp-mini-seat lp-screen-seat ${stateClass} ${
                                  idx === 3 ? 'lp-screen-seat--aisle' : ''
                                }`}
                                style={{ transform: `translateY(-${seat.curveOffset}px)` }}
                              >
                                {seat.label.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="lp-mini-legend" aria-hidden="true">
                    <span><i className="lp-mini-dot lp-mini-dot--avail" />ว่าง</span>
                    <span><i className="lp-mini-dot lp-mini-dot--sel" />กำลังเลือก</span>
                    <span><i className="lp-mini-dot lp-mini-dot--taken" />จองแล้ว</span>
                  </div>
                </div>

                <div className="lp-screen-panel lp-seat-summary">
                  <div className="lp-seat-summary__head">
                    <strong>สรุปที่นั่งที่เลือก</strong>
                    <span className="pill-free">ฟรี ฿0</span>
                  </div>

                  <div className="lp-seat-spotlight">
                    <span className="lp-seat-summary__label">ที่นั่งในผังคอนเสิร์ต</span>
                    <div key={selectedSeat.id} className="lp-seat-spotlight__val lp-seat-pop">
                      <strong className="seat-highlight">{selectedSeat.label}</strong>
                      <span>{ZONE_NAMES[selectedSeat.zone]}</span>
                    </div>
                  </div>

                  <div className="lp-seat-capacity">
                    <div className="lp-seat-capacity__labels">
                      <span>ความหนาแน่นฮอลล์</span>
                      <strong>
                        {reservedCount} / {MINI_SEATS.length} ที่นั่ง
                      </strong>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${capacityPct}%`, background: 'var(--accent)' }}
                      />
                    </div>
                  </div>

                  <div className="lp-seat-qr-preview">
                    <div className="lp-qr-frame lp-qr-frame--sm">
                      <Icon name="qrCode" size={44} />
                    </div>
                    <div className="lp-seat-qr-preview__meta">
                      <span className="lp-seat-summary__label">Ticket Pass Code</span>
                      <code key={ticketCode} className="lp-seat-pop">
                        {ticketCode}
                      </code>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn--primary btn--full lp-cta-arrow"
                    onClick={() => goToScene(1)}
                  >
                    <span>ออกบัตร QR ทันที</span>
                    <Icon name="arrowRight" size={16} className="lp-arrow-icon" />
                  </button>
                </div>
              </div>
            )}

            {activeScene === 1 && (
              <div className="lp-scene-ticket">
                <article className="lp-wallet-pass" aria-label="ตัวอย่างบัตรดิจิทัล PULSE Wallet">
                  <div className="lp-mini-wallet__sheen" aria-hidden="true" />

                  <div className="lp-wallet-pass__main">
                    <div className="lp-wallet-pass__top">
                      <span className="pill-free">Register for free</span>
                      <span className="lp-live-pill">
                        <span className="lp-live-dot" aria-hidden="true" />
                        <span>Valid · พร้อมเข้างาน</span>
                      </span>
                    </div>

                    <div className="lp-wallet-pass__banner">
                      <div className="lp-wallet-pass__banner-copy">
                        <span className="lp-wallet-pass__eyebrow">CONCERT · SEATED</span>
                        <strong>PULSE Live Sessions 2026</strong>
                      </div>
                      <div className="lp-eq" aria-hidden="true">
                        {EQ_HEIGHTS.map((scale, idx) => (
                          <span
                            key={idx}
                            className="lp-eq__bar"
                            style={{
                              '--eq-scale': scale,
                              '--eq-delay': `${idx * 110}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <dl className="lp-wallet-pass__grid">
                      <div>
                        <dt>ผู้เข้าร่วม</dt>
                        <dd>คุณปภาวิน สุขใจ</dd>
                      </div>
                      <div>
                        <dt>ที่นั่งของคุณ</dt>
                        <dd>
                          <strong className="seat-highlight">{selectedSeat.label}</strong> ·{' '}
                          {ZONE_NAMES[selectedSeat.zone]}
                        </dd>
                      </div>
                      <div>
                        <dt>วันเวลา</dt>
                        <dd>เสาร์ 12 ธ.ค. 2569 · 19:00 น.</dd>
                      </div>
                      <div>
                        <dt>สถานที่</dt>
                        <dd>PULSE Grand Hall, Bangkok</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="lp-wallet-pass__stub">
                    <div className="lp-qr-frame">
                      <Icon name="qrCode" size={96} />
                      <span className="lp-scan-beam" aria-hidden="true" />
                    </div>
                    <code className="lp-wallet-pass__code">{ticketCode}</code>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm lp-cta-arrow"
                      onClick={() => goToScene(2)}
                    >
                      <span>จำลองสแกนเช็กอิน</span>
                      <Icon name="arrowRight" size={15} className="lp-arrow-icon" />
                    </button>
                  </div>
                </article>
              </div>
            )}

            {activeScene === 2 && (
              <div className="lp-scene-checkin">
                <div className="lp-screen-scanner">
                  <div className="lp-screen-scanner__head">
                    <span>Staff Camera · Gate A</span>
                    <span className="lp-live-pill">
                      <span className="lp-live-dot" aria-hidden="true" />
                      <span>Live Scan</span>
                    </span>
                  </div>

                  <div className="lp-screen-scanner__viewport">
                    <span className="lp-vf-corner lp-vf-corner--tl" />
                    <span className="lp-vf-corner lp-vf-corner--tr" />
                    <span className="lp-vf-corner lp-vf-corner--bl" />
                    <span className="lp-vf-corner lp-vf-corner--br" />
                    <span className="lp-vf-laser" />
                    <div className="lp-lock-ring" aria-hidden="true" />
                    <div className="lp-qr-frame lp-qr-frame--scanner">
                      <Icon name="qrCode" size={72} />
                    </div>
                  </div>

                  <div className="lp-screen-scanner__foot">
                    <Icon name="zap" size={14} />
                    <span>สแกนพบ · 0.4 วินาที</span>
                  </div>
                </div>

                <div className="lp-screen-panel lp-screen-verified">
                  <div className="lp-verified-banner">
                    <span className="lp-verified-banner__icon">
                      <Icon name="check" size={18} />
                    </span>
                    <div>
                      <strong>เช็กอินสำเร็จ · ยืนยันเข้างานแล้ว</strong>
                      <span>อัปเดตสถานะบัตรเป็น Used อัตโนมัติ</span>
                    </div>
                  </div>

                  <dl className="lp-verified-details">
                    <div>
                      <dt>ผู้เข้าร่วม</dt>
                      <dd>คุณปภาวิน สุขใจ</dd>
                    </div>
                    <div>
                      <dt>ที่นั่ง</dt>
                      <dd>
                        <strong className="seat-highlight">{selectedSeat.label}</strong> (
                        {ZONE_NAMES[selectedSeat.zone]})
                      </dd>
                    </div>
                    <div>
                      <dt>รหัสบัตร</dt>
                      <dd>
                        <code>{ticketCode}</code>
                      </dd>
                    </div>
                  </dl>

                  <div className="lp-verified-meter">
                    <div className="lp-verified-meter__row">
                      <span>เช็กอินหน้างานแล้ว</span>
                      <strong>143 / 150 คน (95.3%)</strong>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: '95.3%' }} />
                    </div>
                    <div className="lp-verified-sync">
                      <span className="lp-sync-ring" />
                      <span>Live Sync · 5s — อัปเดต Dashboard Organizer แบบเรียลไทม์</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn--secondary btn--full lp-cta-arrow"
                    onClick={() => goToScene(0)}
                  >
                    <span>ลองเลือกที่นั่งอื่น</span>
                    <Icon name="arrowRight" size={16} className="lp-arrow-icon" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
