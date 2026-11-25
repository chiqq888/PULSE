import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { PosterImage } from '../../components/PosterImage';
import { StatusBadge } from '../../components/StatusBadge';
import { useEvents } from '../../hooks/useEvents';
import { usePolling } from '../../hooks/usePolling';
import { useEventStats } from '../../hooks/useTickets';
import { getEventAvailabilityStats } from '../../utils/capacityUtils';
import { formatEventDateShort, hasEventEnded } from '../../utils/dateUtils';

export function StaffEventsPage() {
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents('staff');
  const {
    stats: summaries,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useEventStats({ scope: 'staff' });

  const summaryMap = useMemo(
    () => new Map(summaries.map((summary) => [summary.eventId, summary])),
    [summaries]
  );

  const pollRefresh = useCallback(async () => {
    await Promise.all([
      refetchEvents({ silent: true }),
      refetchStats({ silent: true }),
    ]);
  }, [refetchEvents, refetchStats]);

  usePolling(pollRefresh, 5000, true);

  const { activeEvents, endedEvents } = useMemo(() => {
    const nonDraft = events.filter((ev) => ev.status === 'published' || ev.status === 'closed');
    const active = [];
    const ended = [];

    for (const ev of nonDraft) {
      if (hasEventEnded(ev)) ended.push(ev);
      else active.push(ev);
    }

    active.sort((a, b) => String(a.startsAt || '').localeCompare(String(b.startsAt || '')));
    ended.sort((a, b) => String(b.endsAt || '').localeCompare(String(a.endsAt || '')));
    return { activeEvents: active, endedEvents: ended };
  }, [events]);

  const loading = eventsLoading || statsLoading;
  const error = eventsError || statsError;

  const renderStaffEventCard = (event, isEnded) => {
    const stats = getEventAvailabilityStats(event, summaryMap.get(event.id));
    return (
      <article key={event.id} className={`staff-event-card card ${isEnded ? 'staff-event-card--ended' : ''}`}>
        <div className="staff-event-card__poster">
          <PosterImage
            src={event.posterUrl}
            alt={event.title}
            className="staff-event-card__img"
          />
        </div>

        <div className="staff-event-card__body">
          <div className="badge-row">
            <StatusBadge type={event.status} />
            {isEnded && (
              <span className="badge badge--muted">
                <Icon name="clock" size={12} />
                <span>จบงานแล้ว</span>
              </span>
            )}
          </div>

          <h2 className="staff-event-card__title">{event.title}</h2>
          <p className="text-muted text-sm icon-text">
            <Icon name="calendar" size={14} />
            <span>{formatEventDateShort(event.startsAt, event.endsAt)}</span>
          </p>
          <p className="text-muted text-sm icon-text">
            <Icon name="pin" size={14} />
            <span>{event.venue}</span>
          </p>

          <div className="staff-progress">
            <div className="staff-progress__labels">
              <span>
                เช็กอินแล้ว <strong>{stats.usedCount}</strong> / {stats.activeCount} คน
              </span>
              <span>{stats.checkInRate}%</span>
            </div>
            <div className="progress-bar" aria-hidden="true">
              <div
                className="progress-bar__fill"
                style={{ width: `${Math.min(100, stats.checkInRate)}%` }}
              />
            </div>
          </div>

          <div className="staff-event-card__actions">
            <Link
              to={`/staff/check-in?eventId=${event.id}`}
              className={`btn btn--sm ${isEnded ? 'btn--secondary' : 'btn--primary'}`}
            >
              {isEnded ? 'เปิดหน้าตรวจบัตร (งานจบแล้ว)' : 'เข้าสู่หน้าเช็กอิน →'}
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Staff Check-in - เลือกงานเพื่อเช็กอิน</h1>
          <p className="page-header__subtitle">
            เลือกงานที่รับผิดชอบเพื่อเปิดกล้องสแกน QR หรือกรอกรหัสบัตรเพื่อยืนยันการเข้างาน (งานสถานะ Published และ Closed สามารถเช็กอินได้จนถึงเวลาสิ้นสุดงาน)
          </p>
        </div>
        <Link to="/staff/check-in" className="btn btn--secondary btn--sm">
          เปิดหน้าตรวจบัตรโดยตรง
        </Link>
      </div>

      {loading ? (
        <FeedbackState type="loading" title="กำลังโหลดรายการงานสำหรับเช็กอิน..." />
      ) : error ? (
        <FeedbackState
          type="error"
          title="ไม่สามารถโหลดรายการงานได้"
          message={error.message}
          onAction={() => {
            refetchEvents();
            refetchStats();
          }}
        />
      ) : activeEvents.length === 0 && endedEvents.length === 0 ? (
        <FeedbackState
          type="empty"
          title="ยังไม่มีงานที่พร้อมสำหรับเช็กอิน"
          message="งานที่คุณได้รับมอบหมายจะแสดงที่นี่เมื่อเผยแพร่แล้ว"
        />
      ) : (
        <>
          <section className="page-stack-sm">
            <h2 className="section-title">งานที่เปิดเช็กอินได้ ({activeEvents.length})</h2>
            {activeEvents.length === 0 ? (
              <FeedbackState
                type="empty"
                compact
                title="ไม่มีงานที่เปิดเช็กอินอยู่ในขณะนี้"
              />
            ) : (
              <div className="staff-events-grid">
                {activeEvents.map((ev) => renderStaffEventCard(ev, false))}
              </div>
            )}
          </section>

          {endedEvents.length > 0 && (
            <section className="page-stack-sm">
              <h2 className="section-title text-muted">
                งานที่สิ้นสุดเวลาจัดงานแล้ว ({endedEvents.length})
              </h2>
              <div className="staff-events-grid">
                {endedEvents.map((ev) => renderStaffEventCard(ev, true))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
