import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FeedbackState } from '../../components/FeedbackState';
import { TicketCard } from '../../components/TicketCard';
import { useEvents } from '../../hooks/useEvents';
import { useTickets } from '../../hooks/useTickets';
import { hasEventEnded } from '../../utils/dateUtils';

export function MyEventsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');

  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useTickets({ mode: 'mine' });
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents();

  const loading = ticketsLoading || eventsLoading;
  const error = ticketsError || eventsError;

  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => map.set(ev.id, ev));
    return map;
  }, [events]);

  const grouped = useMemo(() => {
    const upcoming = [];
    const past = [];
    const cancelled = [];

    const sorted = [...tickets].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );

    for (const ticket of sorted) {
      const event = eventMap.get(ticket.eventId) || null;
      if (ticket.status === 'cancelled') {
        cancelled.push({ ticket, event });
      } else if (event && hasEventEnded(event)) {
        past.push({ ticket, event });
      } else {
        upcoming.push({ ticket, event });
      }
    }

    return { upcoming, past, cancelled };
  }, [tickets, eventMap]);

  const currentList = grouped[activeTab] || [];

  const handleRetry = () => {
    refetchTickets();
    refetchEvents();
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>My Events - บัตรของฉัน</h1>
          <p className="page-header__subtitle">
            รายการงานและบัตร QR ที่ลงทะเบียนด้วยบัญชีของคุณ
          </p>
        </div>
        <Link to="/user" className="btn btn--primary btn--sm">
          ค้นหางานเพิ่มเติม
        </Link>
      </div>

      <div className="tabs-bar" role="tablist" aria-label="หมวดหมู่บัตรของฉัน">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          className={`tab-btn ${activeTab === 'upcoming' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          กำลังจะมาถึง ({grouped.upcoming.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'past'}
          className={`tab-btn ${activeTab === 'past' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          ที่ผ่านมา ({grouped.past.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cancelled'}
          className={`tab-btn ${activeTab === 'cancelled' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          ยกเลิกแล้ว ({grouped.cancelled.length})
        </button>
      </div>

      {loading ? (
        <FeedbackState type="loading" title="กำลังโหลดรายการบัตรของคุณ..." />
      ) : error ? (
        <FeedbackState
          type="error"
          title="ไม่สามารถโหลด My Events ได้"
          message={error.message}
          onAction={handleRetry}
        />
      ) : currentList.length === 0 ? (
        <FeedbackState
          type="empty"
          title={
            activeTab === 'upcoming'
              ? 'ยังไม่มีบัตรสำหรับงานที่กำลังจะมาถึง'
              : activeTab === 'past'
                ? 'ยังไม่มีประวัติงานที่ผ่านมา'
                : 'ไม่มีรายการบัตรที่ถูกยกเลิก'
          }
          message={
            activeTab === 'upcoming'
              ? 'ลองเข้าไปสำรวจอีเวนต์และคอนเสิร์ตฟรีในหน้า Explore แล้วลงทะเบียนรับบัตร QR ได้เลย'
              : undefined
          }
          actionLabel={activeTab === 'upcoming' ? 'ไปหน้า Explore' : undefined}
          onAction={
            activeTab === 'upcoming'
              ? () => navigate('/user')
              : undefined
          }
        />
      ) : (
        <div className="tickets-list">
          {currentList.map(({ ticket, event }) => (
            <TicketCard key={ticket.id} ticket={ticket} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
