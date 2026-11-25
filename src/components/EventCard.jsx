import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { PosterImage } from './PosterImage';
import { StatusBadge } from './StatusBadge';
import { formatEventDateShort, hasEventEnded, hasEventStarted } from '../utils/dateUtils';
import { isEventFull } from '../utils/capacityUtils';

export function EventCard({ event, categoryName, stats }) {
  const started = hasEventStarted(event);
  const ended = hasEventEnded(event);
  const full = isEventFull(event, stats);
  const isClosed = event.status === 'closed';
  const canRegister = event.status === 'published' && !started && !full;

  let availabilityText = 'ไม่จำกัด';
  if (event.registrationMode === 'limited' || event.registrationMode === 'seated') {
    if (full) {
      availabilityText = 'เต็มแล้ว';
    } else {
      availabilityText = `ว่าง ${stats.remaining}/${stats.totalCapacity}`;
    }
  }

  return (
    <article className="event-card">
      <Link to={`/user/events/${event.id}`} className="event-card__poster-link">
        <PosterImage src={event.posterUrl} alt={event.title} className="event-card__poster" />
        <div className="event-card__poster-badges">
          <StatusBadge type={event.eventType} />
        </div>
      </Link>

      <div className="event-card__body">
        <span className="event-card__category">{categoryName || 'ทั่วไป'}</span>

        <h3 className="event-card__title">
          <Link to={`/user/events/${event.id}`}>{event.title}</Link>
        </h3>

        <p className="event-card__info icon-text">
          <Icon name="calendar" size={14} />
          <span>{formatEventDateShort(event.startsAt, event.endsAt)}</span>
        </p>
        <p className="event-card__info icon-text">
          <Icon name="pin" size={14} />
          <span>{event.venue}</span>
        </p>

        <div className="event-card__footer">
          <div className="event-card__status-stack">
            {isClosed ? (
              <span className="badge badge--muted">ปิดรับ</span>
            ) : ended ? (
              <span className="badge badge--muted">จบงานแล้ว</span>
            ) : started ? (
              <span className="badge badge--info">กำลังจัดงาน</span>
            ) : full ? (
              <span className="badge badge--danger">เต็มแล้ว</span>
            ) : (
              <span className="event-card__availability">{availabilityText}</span>
            )}
          </div>

          <Link
            to={`/user/events/${event.id}`}
            className={`btn btn--sm ${canRegister ? 'btn--primary' : 'btn--secondary'}`}
          >
            {canRegister ? 'ลงทะเบียน' : 'ดูรายละเอียด'}
          </Link>
        </div>
      </div>
    </article>
  );
}
