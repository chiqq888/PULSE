import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Reveal } from '../../hooks/useReveal';
import { Icon } from '../Icon';

const ROLES = [
  {
    id: 'user',
    label: 'ผู้เข้าร่วม (User)',
    badge: 'User Portal',
    title: 'ค้นหางานที่ใช่ ลงทะเบียนฟรี และรับบัตร QR ทันที',
    description:
      'สำรวจอีเวนต์และคอนเสิร์ตได้ครบในหน้าเดียว กรองตามหมวดหมู่หรือวันที่ เลือกที่นั่งที่ถูกใจ แล้วเก็บบัตรไว้ใน My Events พร้อมยกเลิกสิทธิ์ล่วงหน้าได้ทุกเมื่อ',
    bullets: [
      'ค้นหาและกรองงานตามประเภท Event / Concert หมวดหมู่ และวันที่',
      'เลือกที่นั่งจากผังทรงโค้งแบบเรียลไทม์ เห็นที่ว่างแม่นยำ',
      'รับบัตร QR Code ในบัญชีเดียวกัน เปิดใช้งานได้จากทุกอุปกรณ์',
    ],
    ctaLabel: 'สำรวจอีเวนต์ตอนนี้',
    ctaTo: '/user',
  },
  {
    id: 'organizer',
    label: 'ผู้จัดงาน (Organizer)',
    badge: 'Organizer Studio',
    title: 'สร้างงาน คุมผังที่นั่ง และดูยอดผู้เข้าร่วมแบบเรียลไทม์',
    description:
      'จัดการทุกขั้นตอนตั้งแต่งาน Draft จนถึงเผยแพร่ เลือกโหมดรับสมัครหรือผังที่นั่งสำเร็จรูป 3 แบบ พร้อม Dashboard สรุปยอดลงทะเบียน เช็กอิน และรายชื่อผู้เข้าร่วม',
    bullets: [
      'สร้างและแก้ไขงาน Draft ก่อนกดเผยแพร่จริงได้อย่างมั่นใจ',
      'เลือกโหมดไม่จำกัด จำกัดจำนวน หรือผังที่นั่ง 24–48 ที่นั่งในคลิกเดียว',
      'ติดตามอัตราเช็กอิน ค้นหารายชื่อ และปิดรับลงทะเบียนได้ทันที',
    ],
    ctaLabel: 'เข้าสู่ Organizer Portal',
    ctaLoggedOutTo: '/register',
    ctaLoggedInTo: '/org',
  },
  {
    id: 'staff',
    label: 'เจ้าหน้าที่เช็กอิน (Staff)',
    badge: 'Staff Check-In',
    title: 'สแกนบัตรหน้างานแม่นยำ ป้องกันบัตรซ้ำและบัตรผิดงาน',
    description:
      'เลือกงานที่ได้รับมอบหมาย เปิดกล้องสแกน QR Code หรือพิมพ์รหัสบัตรเพื่อยืนยันตัวตน ตรวจสอบสถานะ valid / used / cancelled แบบทันทีหน้าประตู',
    bullets: [
      'สแกน QR Code ผ่านกล้องหรือกรอกรหัสบัตรด้วยตนเองได้ทันที',
      'แยกผลตรวจชัดเจน: พร้อมเช็กอิน, ใช้สิทธิ์แล้ว, ยกเลิก หรือผิดงาน',
      'อัปเดตตัวเลขผู้เข้างานบน Dashboard ของทีมงานพร้อมกันทันที',
    ],
    ctaLabel: 'เปิดหน้างานเช็กอิน',
    ctaLoggedOutTo: '/login',
    ctaLoggedInTo: '/staff',
  },
];

function RoleMockup({ roleId }) {
  if (roleId === 'user') {
    return (
      <div key="user" className="lp-role-mockup lp-role-enter">
        <div className="lp-role-mockup__head">
          <span className="badge badge--info">Explore · User View</span>
          <span className="pill-free">Register for free</span>
        </div>

        <div className="lp-role-user-card">
          <div className="lp-role-user-card__poster">
            <span>CONCERT</span>
            <strong>Bangkok Soundwave Night</strong>
          </div>
          <div className="lp-role-user-card__row">
            <div>
              <span className="lp-role-meta-label">สถานะการลงทะเบียน</span>
              <p className="lp-role-meta-val">ที่นั่ง <strong>A04</strong> · ว่าง 18/36</p>
            </div>
            <span className="btn btn--primary btn--xs">ลงทะเบียน</span>
          </div>
        </div>

        <div className="lp-role-ticket-strip">
          <div className="lp-role-ticket-strip__qr">
            <QRCodeSVG value="PULSE-USER-A04" size={54} level="M" fgColor="#1d1d1f" bgColor="#ffffff" />
          </div>
          <div>
            <span className="badge badge--success">✓ Valid Ticket</span>
            <p className="lp-role-meta-val" style={{ marginTop: 4 }}>
              บันทึกใน <strong>My Events</strong> อัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (roleId === 'organizer') {
    return (
      <div key="organizer" className="lp-role-mockup lp-role-enter">
        <div className="lp-role-mockup__head">
          <span className="badge lp-badge--org">Organizer Dashboard</span>
          <span className="badge badge--success">● Published</span>
        </div>

        <div className="lp-role-stats-grid">
          <div className="lp-mini-stat">
            <span>บัตรทั้งหมด</span>
            <strong>148</strong>
          </div>
          <div className="lp-mini-stat lp-mini-stat--org">
            <span>เช็กอินแล้ว</span>
            <strong>124</strong>
          </div>
          <div className="lp-mini-stat">
            <span>อัตราเข้างาน</span>
            <strong>83.8%</strong>
          </div>
        </div>

        <div className="lp-role-progress-box">
          <div className="lp-role-progress-box__row">
            <span>Acoustic Night · Seated (36 ที่นั่ง)</span>
            <strong>34 / 36</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill lp-progress-org" style={{ width: '94%' }} />
          </div>

          <div className="lp-role-progress-box__row" style={{ marginTop: 10 }}>
            <span>Design Systems Meetup · Limited</span>
            <strong>90 / 100</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill lp-progress-org" style={{ width: '90%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key="staff" className="lp-role-mockup lp-role-enter">
      <div className="lp-role-mockup__head">
        <span className="badge lp-badge--staff">Staff Check-In Console</span>
        <span className="lp-live-pill">
          <span className="lp-live-dot" aria-hidden="true" />
          <span>พร้อมสแกน</span>
        </span>
      </div>

      <div className="lp-role-scanner-box">
        <div className="lp-role-scanner-box__cam">
          <span className="lp-vf-corner lp-vf-corner--tl" />
          <span className="lp-vf-corner lp-vf-corner--tr" />
          <span className="lp-vf-corner lp-vf-corner--bl" />
          <span className="lp-vf-corner lp-vf-corner--br" />
          <span className="lp-vf-laser" />
          <Icon name="qrCode" size={34} />
        </div>
        <div className="lp-role-checkin-result">
          <div className="lp-role-checkin-result__badge">
            <Icon name="check" size={14} />
          </div>
          <div>
            <strong>พร้อมเช็กอิน · ยืนยันเข้างานแล้ว</strong>
            <span>คุณปภาวิน · ที่นั่ง A04 · PULSE-LIVE-A-04</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoleShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { user, role } = useAuth();
  const activeRole = ROLES[activeIndex];

  const resolveCtaPath = (item) => {
    if (item.ctaTo) return item.ctaTo;
    if (user && (role === item.id || item.id === 'staff')) return item.ctaLoggedInTo;
    return item.ctaLoggedOutTo;
  };

  const resolveCtaLabel = (item) => {
    if (item.id === 'organizer' && (!user || role !== 'organizer')) {
      return 'สมัครใช้งานฟรี';
    }
    if (item.id === 'staff' && !user) {
      return 'เข้าสู่ระบบ Staff';
    }
    return item.ctaLabel;
  };

  return (
    <section id="roles" className="lp-section lp-section--tinted">
      <div className="container">
        <Reveal className="lp-section-header">
          <span className="lp-eyebrow icon-text">
            <Icon name="users" size={14} />
            <span>ออกแบบมาเพื่อทุกบทบาท</span>
          </span>
          <h2 className="lp-section-title">ทำงานร่วมกันแบบไร้รอยต่อ</h2>
          <p className="lp-section-subtitle">
            แยกมุมมองการใช้งานให้เหมาะกับหน้าที่ ทั้งผู้เข้าร่วม ผู้จัดงาน และเจ้าหน้าที่สแกนบัตรหน้างาน
          </p>
        </Reveal>

        <Reveal delay={90} className={`lp-role-shell lp-role-shell--${activeRole.id} card`}>
          <div className="lp-role-tabs-wrap">
            <div
              className="lp-role-tabs"
              role="tablist"
              aria-label="เลือกดูมุมมองตามบทบาทผู้ใช้"
              style={{ '--active-index': activeIndex }}
            >
              <span className="lp-role-tabs__glider" aria-hidden="true" />
              {ROLES.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activeIndex === idx}
                  className={`lp-role-tab ${activeIndex === idx ? 'lp-role-tab--active' : ''}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-role-grid">
            <div key={activeRole.id} className="lp-role-copy lp-role-enter">
              <span className={`badge lp-role-badge lp-role-badge--${activeRole.id}`}>
                {activeRole.badge}
              </span>
              <h3 className="lp-role-copy__title">{activeRole.title}</h3>
              <p className="lp-role-copy__desc">{activeRole.description}</p>

              <ul className="lp-role-bullets">
                {activeRole.bullets.map((bullet) => (
                  <li key={bullet}>
                    <span className="lp-role-bullet-icon">
                      <Icon name="check" size={13} />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="lp-role-copy__actions">
                <Link
                  to={resolveCtaPath(activeRole)}
                  className={`btn btn--lg lp-role-cta lp-role-cta--${activeRole.id}`}
                >
                  <span>{resolveCtaLabel(activeRole)}</span>
                  <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            </div>

            <div className="lp-role-preview">
              <RoleMockup roleId={activeRole.id} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
