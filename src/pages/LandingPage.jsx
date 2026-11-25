import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountHome } from '../app/authNavigation';
import { AccountActions } from '../components/AccountActions';
import { BrandLogo } from '../components/BrandLogo';
import { Icon } from '../components/Icon';
import { FeaturedEventsSection } from '../components/landing/FeaturedEventsSection';
import { FeatureBento } from '../components/landing/FeatureBento';
import { HeroShowcase } from '../components/landing/HeroShowcase';
import { RoleShowcase } from '../components/landing/RoleShowcase';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { AnimatedNumber, Reveal } from '../hooks/useReveal';

const MARQUEE_ITEMS = [
  'คอนเสิร์ต & Live Show',
  'ผังที่นั่ง 3 โซนทรงโค้ง',
  'บัตร QR สไตล์ Wallet',
  'สแกนเช็กอินด้วยกล้อง',
  'ไม่จำกัด · จำกัด · เลือกที่นั่ง',
  'Dashboard อัปเดตทุก 5 วินาที',
  'Register for free · ฿0',
  'User · Organizer · Staff',
];

const METRICS = [
  {
    value: 0,
    prefix: '฿',
    suffix: '',
    label: 'ฟรี 100% ทุกงาน',
    sub: 'ลงทะเบียนเข้าร่วมฟรีไม่มีค่าธรรมเนียม',
  },
  {
    value: 3,
    prefix: '',
    suffix: '',
    label: 'โหมดการรับสมัคร',
    sub: 'ไม่จำกัด · จำกัดจำนวน · เลือกที่นั่ง',
  },
  {
    value: 3,
    prefix: '',
    suffix: '',
    label: 'พอร์ทัลเฉพาะบทบาท',
    sub: 'User · Organizer · Staff ในระบบเดียว',
  },
  {
    value: 5,
    prefix: '',
    suffix: ' วิ',
    label: 'อัปเดตข้อมูลเรียลไทม์',
    sub: 'รีเฟรชผังที่นั่ง ยอดบัตร และหน้างานอัตโนมัติ',
  },
];

const STEPS = [
  {
    num: '01',
    icon: 'sparkles',
    title: 'ค้นหางานที่ใช่',
    desc: 'สำรวจคอนเสิร์ตและอีเวนต์สาธารณะ ค้นชื่อ กรองประเภท หมวดหมู่ หรือช่วงวันที่ต้องการได้ทันที',
  },
  {
    num: '02',
    icon: 'armchair',
    title: 'เลือกที่นั่งและลงทะเบียน',
    desc: 'กดเลือกเก้าอี้จากผังที่นั่งทรงโค้งหรือยืนยันโควตาว่าง ระบบตรวจสิทธิ์ซ้ำก่อนออกบัตรให้ทันที',
  },
  {
    num: '03',
    icon: 'qrCode',
    title: 'รับบัตร QR ทันที',
    desc: 'ได้บัตรดิจิทัลพร้อมรหัส QR เฉพาะตัว บันทึกไว้ในหน้า My Events เปิดดูได้ทุกอุปกรณ์',
  },
  {
    num: '04',
    icon: 'shieldCheck',
    title: 'สแกนเช็กอินเข้างาน',
    desc: 'แสดงบัตรต่อ Staff หน้าประตู สแกน QR ยืนยันสิทธิ์ในเสี้ยววินาที พร้อมอัปเดตยอดเข้างานทันที',
  },
];

export function LandingPage() {
  const { user, role, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBrandClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const secondaryCta =
    user && !loading && role
      ? { to: accountHome(role), label: 'ไปหน้าหลักของฉัน' }
      : { to: '/register', label: 'สมัครสมาชิกฟรี' };

  return (
    <div className="lp-page">
      <header className={`lp-header ${scrolled ? 'lp-header--scrolled' : ''}`}>
        <div className="container lp-header__inner">
          <div className="site-header__brand-row">
            <span onClick={handleBrandClick} className="lp-brand-anchor">
              <BrandLogo to="/" />
            </span>

            <nav className="lp-nav" aria-label="นำทางหน้าแรก">
              <a href="#features" className="primary-nav__link">จุดเด่น</a>
              <a href="#roles" className="primary-nav__link">บทบาทใช้งาน</a>
              <a href="#how-it-works" className="primary-nav__link">ขั้นตอน</a>
              <a href="#featured" className="primary-nav__link">อีเวนต์</a>
              <Link to="/user" className="primary-nav__link lp-nav__explore">
                สำรวจอีเวนต์
              </Link>
            </nav>
          </div>

          <AccountActions />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="lp-hero">
          <div className="lp-hero__aurora" aria-hidden="true">
            <span className="lp-aurora-orb lp-aurora-orb--blue" />
            <span className="lp-aurora-orb lp-aurora-orb--indigo" />
            <span className="lp-aurora-orb lp-aurora-orb--violet" />
          </div>
          <div className="lp-hero__grid-pattern" aria-hidden="true" />

          <div className="container lp-hero__stack">
            <div className="lp-hero__copy">
              <h1
                className="lp-hero__title lp-hero-enter"
                style={{ '--enter-delay': '45ms' }}
              >
                ทุกอีเวนต์และคอนเสิร์ต
                <br />
                <span className="lp-gradient-text">จัดการทั้งหมดภายในแอปเดียว</span>
              </h1>

              <p
                className="lp-hero__subtitle lp-hero-enter"
                style={{ '--enter-delay': '90ms' }}
              >
                ค้นหาและลงทะเบียนงานฟรี เลือกที่นั่งจากผังคอนเสิร์ตทรงโค้ง รับบัตร QR ดิจิทัลทันที
                พร้อมระบบสแกนเช็กอินหน้างานและแดชบอร์ดเรียลไทม์ในแพลตฟอร์มเดียว
              </p>

              <div
                className="lp-hero__actions lp-hero-enter"
                style={{ '--enter-delay': '135ms' }}
              >
                <Link to="/user" className="btn btn--primary btn--lg lp-cta-arrow">
                  <span>สำรวจงานทั้งหมด</span>
                  <Icon name="arrowRight" size={17} className="lp-arrow-icon" />
                </Link>
                <Link to={secondaryCta.to} className="btn btn--secondary btn--lg">
                  {secondaryCta.label}
                </Link>
              </div>

              <ul
                className="lp-hero__trust lp-hero-enter"
                style={{ '--enter-delay': '175ms' }}
              >
                <li>
                  <Icon name="check" size={14} />
                  <span>ฟรี 100% ไม่มีค่าธรรมเนียม</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>ออกบัตร QR ทันที</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>สแกนเช็กอินไวหน้างาน</span>
                </li>
              </ul>
            </div>

            <div className="lp-hero__visual lp-hero-enter" style={{ '--enter-delay': '150ms' }}>
              <HeroShowcase />
            </div>
          </div>
        </section>

        {/* Infinite Marquee Strip */}
        <div className="lp-marquee" aria-label="จุดเด่นของระบบ PULSE">
          <div className="lp-marquee__track">
            {[0, 1].map((dup) => (
              <div key={dup} className="lp-marquee__group" aria-hidden={dup === 1}>
                {[0, 1].map((repeat) =>
                  MARQUEE_ITEMS.map((item) => (
                    <span key={`${dup}-${repeat}-${item}`} className="lp-marquee__item">
                      <span className="lp-marquee__dot" aria-hidden="true" />
                      <span>{item}</span>
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Animated Metrics Strip */}
        <section className="lp-metrics-section" aria-label="ภาพรวมความสามารถระบบ">
          <div className="container">
            <div className="lp-metrics-grid">
              {METRICS.map((metric, idx) => (
                <Reveal key={metric.label} delay={idx * 70} className="lp-metric-card card">
                  <div className="lp-metric-card__value">
                    <AnimatedNumber
                      value={metric.value}
                      prefix={metric.prefix}
                      suffix={metric.suffix}
                    />
                  </div>
                  <div className="lp-metric-card__label">{metric.label}</div>
                  <p className="lp-metric-card__sub">{metric.sub}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <FeatureBento />

        {/* Interactive Role Portal Showcase */}
        <RoleShowcase />

        {/* 4-Step How It Works Timeline */}
        <section id="how-it-works" className="lp-section">
          <div className="container">
            <Reveal className="lp-section-header">
              <span className="lp-eyebrow icon-text">
                <Icon name="zap" size={14} />
                <span>4 ขั้นตอนง่าย ๆ</span>
              </span>
              <h2 className="lp-section-title">จากหน้าค้นหาสู่ประตูเข้างานในไม่กี่วินาที</h2>
              <p className="lp-section-subtitle">
                ลดความยุ่งยากของการลงทะเบียนและการตรวจบัตรหน้างานด้วยเวิร์กโฟลว์ที่ออกแบบมาอย่างลงตัว
              </p>
            </Reveal>

            <div className="lp-steps-wrap">
              <div className="lp-steps-connector" aria-hidden="true">
                <span className="lp-steps-connector__beam" />
              </div>

              <div className="lp-steps-grid">
                {STEPS.map((step, idx) => (
                  <Reveal key={step.num} delay={idx * 90} className="lp-step-card card">
                    <div className="lp-step-card__head">
                      <span className="lp-step-card__num">{step.num}</span>
                      <span className="lp-step-card__icon">
                        <Icon name={step.icon} size={18} />
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events or Curated Format Showcases */}
        <FeaturedEventsSection />

        {/* Apple-Keynote Light Full-Bleed Final CTA Section */}
        <section className="lp-cta">
          <div className="lp-cta__glow" aria-hidden="true">
            <span className="lp-cta__orb lp-cta__orb--blue" />
            <span className="lp-cta__orb lp-cta__orb--indigo" />
            <span className="lp-cta__orb lp-cta__orb--violet" />
          </div>
          <div className="lp-cta__grid-pattern" aria-hidden="true" />

          <div className="container">
            <Reveal className="lp-cta__content">
              <img
                src="/images/pulse-logo.svg"
                alt="PULSE"
                className="lp-cta__logo"
              />

              <h2 className="lp-cta__title">
                พร้อมเปิดประสบการณ์อีเวนต์{' '}
                <span className="lp-gradient-text">ที่ง่ายและลื่นไหลกว่าเดิม</span>
              </h2>

              <p className="lp-cta__subtitle">
                สำรวจคอนเสิร์ตและอีเวนต์ฟรี เลือกที่นั่งจากผังจริง และรับบัตร QR เข้างานได้ทันทีในไม่กี่คลิก
              </p>

              <div className="lp-cta__actions">
                <Link to="/user" className="btn btn--primary btn--lg lp-cta-arrow">
                  <span>เริ่มสำรวจงาน</span>
                  <Icon name="arrowRight" size={17} className="lp-arrow-icon" />
                </Link>
                <Link to={secondaryCta.to} className="btn btn--secondary btn--lg">
                  {secondaryCta.label}
                </Link>
              </div>

              <ul className="lp-cta__meta">
                <li>
                  <Icon name="check" size={14} />
                  <span>ฟรี 100% ทุกงาน</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>บัตร QR พร้อมสแกน</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>ยกเลิกและคืนที่นั่งได้ทันที</span>
                </li>
              </ul>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
