import { useCallback } from 'react';
import { Reveal } from '../../hooks/useReveal';
import { Icon } from '../Icon';

const BENTO_SEATS = Array.from({ length: 24 }, (_, idx) => {
  const row = Math.floor(idx / 8);
  const col = idx % 8;
  const xBase = 56 + col * 38 + (col >= 4 ? 18 : 0);
  const distFromCenter = col - 3.5;
  const y = 78 + row * 34 - Math.round((distFromCenter * distFromCenter) * 0.9);
  const highlight = idx === 3 || idx === 11 || idx === 18;
  const taken = idx === 1 || idx === 6 || idx === 9 || idx === 13 || idx === 20;
  return { id: idx, x: xBase, y, highlight, taken };
});

function BentoCard({ className = '', delay = 0, children }) {
  const handleMouseMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, []);

  return (
    <Reveal delay={delay} className={`lp-bento-card card ${className}`} onMouseMove={handleMouseMove}>
      {children}
    </Reveal>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="lp-section">
      <div className="container">
        <Reveal className="lp-section-header">
          <span className="lp-eyebrow icon-text">
            <Icon name="sparkles" size={14} />
            <span>ความสามารถหลักของ PULSE</span>
          </span>
          <h2 className="lp-section-title">ออกแบบมาเพื่อให้ทุกงานราบรื่นตั้งแต่หน้าแรก</h2>
          <p className="lp-section-subtitle">
            ผสานระบบค้นหางาน ผังที่นั่งคอนเสิร์ต บัตร QR และเครื่องมือหน้างานไว้ในประสบการณ์เดียวที่สะอาดตาและรวดเร็ว
          </p>
        </Reveal>

        <div className="lp-bento-grid">
          {/* Row 1 Card 1: Half (3 cols desktop, 2 cols tablet) — Curved Concert Hall Seat Map */}
          <BentoCard className="lp-bento-card--half lp-bento-card--tablet-wide" delay={0}>
            <div className="lp-bento-card__copy">
              <span className="lp-bento-pill">
                <Icon name="armchair" size={14} />
                <span>Curved Seat Map</span>
              </span>
              <h3>ผังที่นั่งทรงโค้งเลือกได้จริง</h3>
              <p>
                เลือกที่นั่งแบบเรียลไทม์พร้อมแยกรายโซน Zone A, B, C รองรับทั้งเทมเพลตฮอลล์คอนเสิร์ต เวทีใกล้ชิด และอารีนาขนาดใหญ่
              </p>
            </div>

            <div className="lp-bento-visual lp-bento-visual--seatmap" aria-hidden="true">
              <svg viewBox="0 0 390 175" className="lp-bento-svg">
                <path d="M 96 14 Q 195 26 294 14 L 286 38 Q 195 50 104 38 Z" fill="#1d1d1f" />
                <path
                  d="M 106 38 Q 195 50 284 38"
                  fill="none"
                  stroke="#0071e3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text
                  x="195"
                  y="30"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontFamily="var(--font-sans)"
                  fontSize="9"
                  fontWeight="700"
                  letterSpacing="2.5"
                >
                  STAGE
                </text>

                <text x="26" y="76" fill="#86868b" fontSize="8" fontWeight="700">A</text>
                <text x="26" y="110" fill="#86868b" fontSize="8" fontWeight="700">B</text>
                <text x="26" y="144" fill="#86868b" fontSize="8" fontWeight="700">C</text>

                {BENTO_SEATS.map((seat) => (
                  <g key={seat.id}>
                    <rect
                      x={seat.x - 13}
                      y={seat.y - 10}
                      width="26"
                      height="20"
                      rx="5"
                      className={
                        seat.highlight
                          ? 'lp-svg-seat lp-svg-seat--pulse'
                          : seat.taken
                            ? 'lp-svg-seat lp-svg-seat--taken'
                            : 'lp-svg-seat lp-svg-seat--avail'
                      }
                      style={
                        seat.highlight
                          ? { animationDelay: `${(seat.id % 5) * 450}ms` }
                          : undefined
                      }
                    />
                  </g>
                ))}
              </svg>
            </div>
          </BentoCard>

          {/* Row 1 Card 2: Half (3 cols desktop) — Real-time Sync & Security */}
          <BentoCard className="lp-bento-card--half" delay={80}>
            <div className="lp-bento-card__copy">
              <span className="lp-bento-pill">
                <Icon name="shieldCheck" size={14} />
                <span>Real-time &amp; Transactional</span>
              </span>
              <h3>อัปเดตเรียลไทม์ &amp; ป้องกันจองซ้ำอัตโนมัติ</h3>
              <p>
                ฐานข้อมูลตรวจโควตา ที่นั่งซ้ำ และสิทธิ์บัญชีในธุรกรรมเดียวกัน รีเฟรชข้อมูลผังที่นั่งและ Dashboard อัตโนมัติทุก 5 วินาที
              </p>
            </div>

            <div className="lp-bento-visual lp-bento-visual--sync" aria-hidden="true">
              <div className="lp-sync-cards">
                <div className="lp-sync-chip">
                  <span className="lp-sync-ring" />
                  <div>
                    <strong>Live Sync · 5s</strong>
                    <span>อัปเดตผังที่นั่งและยอดเช็กอินอัตโนมัติ</span>
                  </div>
                </div>
                <div className="lp-sync-badges">
                  <span className="badge badge--success">✓ 1 บัญชี / 1 บัตรต่องาน</span>
                  <span className="badge badge--info">🔒 ตรวจสิทธิ์ระดับฐานข้อมูล (RLS)</span>
                  <span className="badge badge--meta">↺ คืนที่นั่งทันทีเมื่อยกเลิก</span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Row 2 Card 3: Third (2 cols desktop) — Apple Wallet Digital QR Pass */}
          <BentoCard className="lp-bento-card--third" delay={140}>
            <div className="lp-bento-card__copy">
              <span className="lp-bento-pill">
                <Icon name="qrCode" size={14} />
                <span>Instant QR Pass</span>
              </span>
              <h3>บัตร QR ดิจิทัลพร้อมใช้ทันที</h3>
              <p>
                ออกบัตรอัตโนมัติหลังยืนยันสิทธิ์ แสดงสถานะชัดเจนทั้ง Valid, Used และ Cancelled ในสไตล์ Apple Wallet
              </p>
            </div>

            <div className="lp-bento-visual lp-bento-visual--pass" aria-hidden="true">
              <div className="lp-mini-wallet">
                <div className="lp-mini-wallet__sheen" />
                <div className="lp-mini-wallet__top">
                  <strong>PULSE PASS</strong>
                  <span className="badge badge--success">✓ Valid</span>
                </div>
                <div className="lp-mini-wallet__body">
                  <span>Seat A04 · Front Stage</span>
                  <div className="badge-row">
                    <span className="badge badge--success">✓ Valid</span>
                    <span className="badge badge--info">★ Used</span>
                    <span className="badge badge--danger">✕ Cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Row 2 Card 4: Third (2 cols desktop) — Staff Scanner */}
          <BentoCard className="lp-bento-card--third" delay={200}>
            <div className="lp-bento-card__copy">
              <span className="lp-bento-pill lp-bento-pill--staff">
                <Icon name="camera" size={14} />
                <span>Staff Check-In</span>
              </span>
              <h3>สแกนเช็กอินไวในเสี้ยววินาที</h3>
              <p>
                เปิดกล้องสแกน QR ผ่านเบราว์เซอร์หรือกรอกรหัสบัตรด้วยตนเอง พร้อมหยุดกล้องอัตโนมัติเมื่อออกจากหน้า
              </p>
            </div>

            <div className="lp-bento-visual lp-bento-visual--scanner" aria-hidden="true">
              <div className="lp-mini-viewfinder">
                <span className="lp-vf-corner lp-vf-corner--tl" />
                <span className="lp-vf-corner lp-vf-corner--tr" />
                <span className="lp-vf-corner lp-vf-corner--bl" />
                <span className="lp-vf-corner lp-vf-corner--br" />
                <span className="lp-vf-laser" />
                <div className="lp-vf-center">
                  <Icon name="qrCode" size={28} />
                  <code>TKT-8924A</code>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Row 2 Card 5: Third (2 cols desktop) — 3 Registration Modes */}
          <BentoCard className="lp-bento-card--third" delay={260}>
            <div className="lp-bento-card__copy">
              <span className="lp-bento-pill lp-bento-pill--org">
                <Icon name="layers" size={14} />
                <span>Flexible Capacity</span>
              </span>
              <h3>3 รูปแบบการรับสมัคร ยืดหยุ่นทุกงาน</h3>
              <p>
                รองรับทั้งงานเปิดไม่จำกัดจำนวน งานจำกัดโควตา และคอนเสิร์ตเลือกที่นั่ง พร้อมระบบนับที่ว่างแม่นยำ
              </p>
            </div>

            <div className="lp-bento-visual lp-bento-visual--modes" aria-hidden="true">
              <div className="lp-mode-chips">
                <span className="badge badge--meta">ไม่จำกัด</span>
                <span className="badge badge--info">จำกัดจำนวน</span>
                <span className="badge badge--accent">เลือกที่นั่ง</span>
              </div>
              <div className="lp-capacity-meter">
                <div className="lp-capacity-meter__labels">
                  <span>โควตาที่นั่งถูกจอง</span>
                  <strong>32 / 36</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill lp-animated-fill" />
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
