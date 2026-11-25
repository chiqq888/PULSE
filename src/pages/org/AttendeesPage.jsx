import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AttendeeTable } from '../../components/AttendeeTable';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useEvent } from '../../hooks/useEvent';
import { usePolling } from '../../hooks/usePolling';
import { useTickets } from '../../hooks/useTickets';
import { ApiError } from '../../services/apiClient';
import { getEventTicketStats } from '../../utils/capacityUtils';
import { formatEventTimeRange } from '../../utils/dateUtils';

export function AttendeesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    event,
    loading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useEvent(id, 'organizer');
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useTickets({ mode: 'event', eventId: id });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const pollRefresh = useCallback(async () => {
    await Promise.all([
      refetchEvent({ silent: true }),
      refetchTickets({ silent: true }),
    ]);
  }, [refetchEvent, refetchTickets]);

  usePolling(pollRefresh, 5000, Boolean(event));

  const stats = useMemo(
    () => getEventTicketStats(event, tickets),
    [event, tickets]
  );

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...tickets]
      .filter((ticket) => {
        if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
        if (q) {
          const text = [
            ticket.id,
            ticket.attendeeName,
            ticket.attendeeEmail,
            ticket.seatId || '',
          ]
            .join(' ')
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [tickets, searchQuery, statusFilter]);

  const loading = eventLoading || (ticketsLoading && tickets.length === 0 && !event);
  if (loading) {
    return <FeedbackState type="loading" title="กำลังโหลดรายชื่อผู้ลงทะเบียน..." />;
  }

  if (eventError) {
    const isNotFound = eventError instanceof ApiError && eventError.code === 'NOT_FOUND';
    return (
      <FeedbackState
        type={isNotFound ? 'empty' : 'error'}
        title={isNotFound ? 'ไม่พบงานนี้ในระบบ' : 'ไม่สามารถโหลดข้อมูลงานได้'}
        message={eventError.message}
        actionLabel={isNotFound ? 'กลับหน้ารายการงาน' : 'ลองใหม่'}
        onAction={isNotFound ? () => navigate('/org/events') : refetchEvent}
      />
    );
  }

  return (
    <div className="page-stack">
      <div className="breadcrumb-row">
        <Link to="/org/events" className="link-back">
          <Icon name="chevronLeft" size={15} />
          <span>กลับไปรายการงานทั้งหมด</span>
        </Link>
        <div className="breadcrumb-row__right">
          {event && event.status !== 'draft' && (
            <Link
              to={`/staff/check-in?eventId=${event.id}`}
              className="btn btn--secondary btn--xs"
            >
              เปิดหน้า Staff เช็กอินงานนี้
            </Link>
          )}
          <button type="button" className="btn btn--ghost btn--xs" onClick={pollRefresh}>
            <Icon name="refresh" size={14} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {event && (
        <div className="page-header">
          <div>
            <div className="badge-row">
              <StatusBadge type={event.status} />
              <StatusBadge type={event.eventType} />
              <StatusBadge type={event.registrationMode} />
            </div>
            <h1>รายชื่อผู้ลงทะเบียน: {event.title}</h1>
            <p className="page-header__subtitle icon-meta-wrap">
              <span className="icon-text">
                <Icon name="calendar" size={14} />
                <span>{formatEventTimeRange(event.startsAt, event.endsAt)}</span>
              </span>
              <span className="meta-dot" aria-hidden="true">•</span>
              <span className="icon-text">
                <Icon name="pin" size={14} />
                <span>{event.venue}</span>
              </span>
            </p>
          </div>
        </div>
      )}

      {ticketsError && (
        <div className="alert alert--danger" role="alert">
          โหลดรายชื่อไม่สำเร็จ: {ticketsError.message}{' '}
          <button type="button" className="btn btn--secondary btn--xs" onClick={refetchTickets}>
            ลองใหม่
          </button>
        </div>
      )}

      {stats.hasAnomalies && (
        <div className="alert alert--danger" role="alert">
          <strong>ตรวจพบความผิดปกติของข้อมูลในงานนี้:</strong>{' '}
          {stats.hasOverCapacity && `จำนวนที่ว่างติดลบ (${stats.remaining}) `}
          {stats.hasDuplicateSeats &&
            `พบที่นั่งซ้ำ: ${stats.duplicateSeatIds.map((d) => `${d.seatId} (${d.count})`).join(', ')}`}
        </div>
      )}

      <section className="stats-grid" aria-label="สถิติผู้ลงทะเบียนของงานนี้">
        <StatCard
          label="ผู้ลงทะเบียนที่ยังมีสิทธิ์"
          value={stats.activeCount}
          sublabel={`Valid ${stats.validCount} + Used ${stats.usedCount}`}
          tone="accent"
        />
        <StatCard
          label="เช็กอินแล้ว (Used)"
          value={stats.usedCount}
          sublabel={`อัตราเช็กอิน ${stats.checkInRate}%`}
          tone="success"
        />
        <StatCard
          label="ยกเลิกแล้ว (Cancelled)"
          value={stats.cancelledCount}
          sublabel="ไม่นับรวมในความจุ"
          tone="muted"
        />
        <StatCard
          label="ที่ว่างคงเหลือ"
          value={stats.remainingLabel}
          tone={stats.hasOverCapacity ? 'warning' : 'default'}
        />
      </section>

      <section className="filters-panel" aria-label="ค้นหาและกรองผู้ลงทะเบียน">
        <div className="filters-panel__row filters-panel__row--2">
          <div className="filter-field filter-field--search">
            <label htmlFor="attendee-search" className="field-label">
              ค้นหาผู้ลงทะเบียน
            </label>
            <input
              id="attendee-search"
              type="search"
              className="input"
              placeholder="ค้นหาด้วยชื่อ อีเมล รหัสบัตร TKT-... หรือเลขที่นั่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="attendee-status" className="field-label">
              สถานะบัตร
            </label>
            <select
              id="attendee-status"
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ทุกสถานะ ({tickets.length})</option>
              <option value="valid">Valid - ใช้สิทธิ์ได้ ({stats.validCount})</option>
              <option value="used">Used - เช็กอินแล้ว ({stats.usedCount})</option>
              <option value="cancelled">Cancelled - ยกเลิกแล้ว ({stats.cancelledCount})</option>
            </select>
          </div>
        </div>

        <div className="filters-panel__footer">
          <span className="filters-panel__count">
            แสดง <strong>{filteredTickets.length}</strong> จาก {tickets.length} รายการ
          </span>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </section>

      {filteredTickets.length === 0 ? (
        <FeedbackState
          type="empty"
          title={
            tickets.length === 0
              ? 'ยังไม่มีผู้ลงทะเบียนสำหรับงานนี้'
              : 'ไม่พบรายชื่อที่ตรงกับคำค้นหาหรือตัวกรอง'
          }
          message={
            tickets.length === 0
              ? 'เมื่อมีผู้ลงทะเบียนในมุมมอง User รายชื่อและสถานะบัตรจะแสดงที่นี่ทันที'
              : 'ลองเปลี่ยนคำค้นหาหรือเลือกดูทุกสถานะ'
          }
        />
      ) : (
        <section className="card">
          <AttendeeTable tickets={filteredTickets} event={event} />
        </section>
      )}
    </div>
  );
}
