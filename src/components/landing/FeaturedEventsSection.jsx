import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useEvents } from '../../hooks/useEvents';
import { Reveal } from '../../hooks/useReveal';
import { useEventStats } from '../../hooks/useTickets';
import { getEventAvailabilityStats } from '../../utils/capacityUtils';
import { hasEventEnded } from '../../utils/dateUtils';
import { EventCard } from '../EventCard';
import { Icon } from '../Icon';

const CURATED_SHOWCASES = [
  {
    id: 'showcase-concert',
    type: 'Concert',
    mode: 'ผังที่นั่ง 3 โซน',
    title: 'คอนเสิร์ตระบุที่นั่งล่วงหน้า',
    description:
      'เลือกเก้าอี้จากผังฮอลล์ทรงโค้ง Zone A, B, C เห็นที่นั่งว่างและที่ถูกจองแล้วแบบเรียลไทม์ก่อนกดรับบัตร QR',
    accent: 'blue',
    icon: 'armchair',
    meta: 'รองรับสูงสุด 48 ที่นั่งต่อผัง',
  },
  {
    id: 'showcase-limited',
    type: 'Event',
    mode: 'จำกัดจำนวนโควตา',
    title: 'เวิร์กชอป & สัมมนาจำกัดที่นั่ง',
    description:
      'กำหนดโควตาที่รับได้ชัดเจน ฐานข้อมูลช่วยนับยอดบัตร valid และ used อัตโนมัติ ป้องกันการลงทะเบียนเกินจำนวน',
    accent: 'indigo',
    icon: 'barChart',
    meta: 'คืนโควตาทันทีเมื่อผู้เข้าร่วมยกเลิก',
  },
  {
    id: 'showcase-unlimited',
    type: 'Event',
    mode: 'ไม่จำกัดจำนวน',
    title: 'อีเวนต์สาธารณะ & เทศกาลเปิดกว้าง',
    description:
      'เปิดให้ผู้สนใจลงทะเบียนฟรีได้ไม่จำกัดจำนวน รับบัตร QR ประจำตัวเพื่อลดความแออัดและสแกนเช็กอินเข้างานอย่างรวดเร็ว',
    accent: 'teal',
    icon: 'zap',
    meta: 'Register for free · 0 บาท',
  },
];

export function FeaturedEventsSection() {
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { categories, loading: catsLoading, error: catsError } = useCategories();
  const { stats, loading: statsLoading, error: statsError } = useEventStats();

  const loading = eventsLoading || catsLoading || statsLoading;
  const hasError = Boolean(eventsError || catsError || statsError);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const availabilityMap = useMemo(
    () => new Map(stats.map((entry) => [entry.eventId, entry])),
    [stats]
  );

  const featuredEvents = useMemo(() => {
    const published = events.filter((ev) => ev.status === 'published');
    return [...published]
      .sort((a, b) => {
        const aEnded = hasEventEnded(a) ? 1 : 0;
        const bEnded = hasEventEnded(b) ? 1 : 0;
        if (aEnded !== bEnded) return aEnded - bEnded;
        return String(a.startsAt || '').localeCompare(String(b.startsAt || ''));
      })
      .slice(0, 3);
  }, [events]);

  const showLiveEvents = !loading && !hasError && featuredEvents.length > 0;

  return (
    <section id="featured" className="lp-section lp-section--tinted">
      <div className="container">
        <Reveal className="lp-featured-header">
          <div>
            <span className="lp-eyebrow icon-text">
              <Icon name="calendar" size={14} />
              <span>{showLiveEvents ? 'อีเวนต์และคอนเสิร์ตแนะนำ' : 'รูปแบบงานที่รองรับ'}</span>
            </span>
            <h2 className="lp-section-title">
              {showLiveEvents
                ? 'งานที่กำลังเปิดให้ลงทะเบียนฟรี'
                : 'รองรับทั้ง Concert และ Event ทุกสไตล์'}
            </h2>
          </div>

          <Link to="/user" className="btn btn--secondary">
            <span>ดูงานทั้งหมด</span>
            <Icon name="arrowRight" size={15} />
          </Link>
        </Reveal>

        {loading ? (
          <div className="events-grid" aria-label="กำลังโหลดรายการแนะนำ">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="lp-skeleton-card">
                <div className="lp-skeleton-shimmer lp-skeleton-card__poster" />
                <div className="lp-skeleton-card__body">
                  <div className="lp-skeleton-shimmer lp-skeleton-line lp-skeleton-line--sm" />
                  <div className="lp-skeleton-shimmer lp-skeleton-line lp-skeleton-line--lg" />
                  <div className="lp-skeleton-shimmer lp-skeleton-line lp-skeleton-line--md" />
                </div>
              </div>
            ))}
          </div>
        ) : showLiveEvents ? (
          <div className="events-grid">
            {featuredEvents.map((event, idx) => (
              <Reveal key={event.id} delay={idx * 90}>
                <EventCard
                  event={event}
                  categoryName={categoryMap.get(event.categoryId)}
                  stats={getEventAvailabilityStats(event, availabilityMap.get(event.id))}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="events-grid">
            {CURATED_SHOWCASES.map((item, idx) => (
              <Reveal key={item.id} delay={idx * 90}>
                <article className={`lp-showcase-card lp-showcase-card--${item.accent} card`}>
                  <div className="lp-showcase-card__top">
                    <span className="lp-showcase-card__icon">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <div className="badge-row">
                      <span className="badge badge--meta">{item.type}</span>
                      <span className="pill-free">{item.mode}</span>
                    </div>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="text-muted text-sm">{item.description}</p>
                  <div className="lp-showcase-card__footer">
                    <span className="text-xs text-muted">{item.meta}</span>
                    <Link to="/user" className="link-inline icon-text">
                      <span>สำรวจงาน</span>
                      <Icon name="arrowRight" size={14} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
