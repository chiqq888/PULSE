import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { PosterImage } from '../../components/PosterImage';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { useTickets } from '../../hooks/useTickets';
import { ApiError } from '../../services/apiClient';
import {
  closeEvent,
  deleteDraftEvent,
  publishEvent,
} from '../../services/eventService';
import { getEventTicketStats } from '../../utils/capacityUtils';
import { formatEventTimeRange } from '../../utils/dateUtils';

export function EventsPage() {
  const location = useLocation();
  const { user } = useAuth();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents('organizer');
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useTickets({ mode: 'organizer' });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [actionMessage, setActionMessage] = useState(location.state?.flashMessage || '');
  const [actionError, setActionError] = useState('');
  const [missingPublishDetails, setMissingPublishDetails] = useState(null);
  const [busyEventId, setBusyEventId] = useState('');

  const [confirmState, setConfirmState] = useState({
    open: false,
    action: null, // 'close' | 'delete'
    event: null,
  });

  const loading = eventsLoading || ticketsLoading;
  const error = eventsError || ticketsError;

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events
      .filter((ev) => {
        if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
        if (typeFilter !== 'all' && ev.eventType !== typeFilter) return false;
        if (q) {
          const text = [ev.title, ev.venue, ev.organizerName, ev.id]
            .join(' ')
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }, [events, searchQuery, statusFilter, typeFilter]);

  const refreshAll = async () => {
    await Promise.all([refetchEvents(), refetchTickets()]);
  };

  const handlePublish = async (event) => {
    setBusyEventId(event.id);
    setActionError('');
    setActionMessage('');
    setMissingPublishDetails(null);

    try {
      await publishEvent(event.id, user.id);
      setActionMessage(`เผยแพร่งาน "${event.title}" สำเร็จแล้ว (ผู้ใช้ทั่วไปสามารถเห็นและลงทะเบียนได้)`);
      await refreshAll();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PUBLISH_VALIDATION_ERROR' && err.details) {
        setMissingPublishDetails({
          eventId: event.id,
          eventTitle: event.title,
          items: Object.values(err.details),
        });
      }
      setActionError(err?.message || 'ไม่สามารถเผยแพร่งานได้');
    } finally {
      setBusyEventId('');
    }
  };

  const handleConfirmAction = async () => {
    const { action, event } = confirmState;
    if (!event || !action) return;

    setBusyEventId(event.id);
    setActionError('');
    setActionMessage('');
    setMissingPublishDetails(null);

    try {
      if (action === 'close') {
        await closeEvent(event.id, user.id);
        setActionMessage(`ปิดรับลงทะเบียนงาน "${event.title}" แล้ว (ประวัติบัตรและการเช็กอินเดิมยังคงอยู่)`);
      } else if (action === 'delete') {
        await deleteDraftEvent(event.id, user.id);
        setActionMessage(`ลบ Draft งาน "${event.title}" ออกจากระบบเรียบร้อยแล้ว`);
      }
      setConfirmState({ open: false, action: null, event: null });
      await refreshAll();
    } catch (err) {
      setConfirmState({ open: false, action: null, event: null });
      setActionError(err?.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyEventId('');
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>จัดการรายการงานทั้งหมด</h1>
          <p className="page-header__subtitle">
            สร้างฉบับร่าง (Draft) แก้ไข เผยแพร่ ปิดรับลงทะเบียน ดูผู้เข้าร่วม และลบ Draft ที่ยังไม่มีประวัติบัตร
          </p>
        </div>
        <Link to="/org/events/new" className="btn btn--primary">
          + สร้างงานใหม่
        </Link>
      </div>

      {actionMessage && (
        <div className="alert alert--success" role="status">
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="alert alert--danger" role="alert">
          <strong>{actionError}</strong>
          {missingPublishDetails && (
            <div className="alert__sub">
              <p>รายการข้อมูลที่ต้องเติมให้ครบในงาน “{missingPublishDetails.eventTitle}”:</p>
              <ul className="alert__list">
                {missingPublishDetails.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link
                to={`/org/events/${missingPublishDetails.eventId}/edit`}
                className="btn btn--secondary btn--xs"
              >
                ไปหน้าแก้ไขงานนี้เพื่อเติมข้อมูล
              </Link>
            </div>
          )}
        </div>
      )}

      <section className="filters-panel" aria-label="ค้นหาและกรองงานในมุมมองผู้จัด">
        <div className="filters-panel__row filters-panel__row--3">
          <div className="filter-field filter-field--search">
            <label htmlFor="org-search" className="field-label">
              ค้นหางาน
            </label>
            <input
              id="org-search"
              type="search"
              className="input"
              placeholder="ค้นหาชื่องาน สถานที่ ผู้จัด หรือรหัสงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="org-status" className="field-label">
              สถานะ
            </label>
            <select
              id="org-status"
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="draft">Draft (ฉบับร่าง)</option>
              <option value="published">Published (เปิดรับ)</option>
              <option value="closed">Closed (ปิดรับ)</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="org-type" className="field-label">
              ประเภท
            </label>
            <select
              id="org-type"
              className="select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="event">Event</option>
              <option value="concert">Concert</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <FeedbackState type="loading" title="กำลังโหลดรายการงาน..." />
      ) : error ? (
        <FeedbackState
          type="error"
          title="ไม่สามารถโหลดรายการงานได้"
          message={error.message}
          onAction={refreshAll}
        />
      ) : filteredEvents.length === 0 ? (
        <FeedbackState
          type="empty"
          title="ไม่พบงานตามเงื่อนไขที่ค้นหา"
          message="ลองล้างตัวกรอง หรือสร้างงานใหม่"
          actionLabel="ล้างตัวกรอง"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setTypeFilter('all');
          }}
        />
      ) : (
        <div className="org-events-list">
          {filteredEvents.map((event) => {
            const stats = getEventTicketStats(event, tickets);
            const canDelete = event.status === 'draft' && stats.totalTickets === 0;
            const isBusy = busyEventId === event.id;

            return (
              <article key={event.id} className="org-event-row card">
                <div className="org-event-row__poster">
                  <PosterImage
                    src={event.posterUrl}
                    alt={event.title}
                    className="org-event-row__img"
                  />
                </div>

                <div className="org-event-row__body">
                  <div className="badge-row">
                    <StatusBadge type={event.status} />
                    <StatusBadge type={event.eventType} />
                    <StatusBadge type={event.registrationMode} />
                    <code className="code-sm">{event.id}</code>
                  </div>

                  <h2 className="org-event-row__title">{event.title}</h2>
                  <p className="org-event-row__meta icon-meta-wrap">
                    <span className="icon-text">
                      <Icon name="calendar" size={14} />
                      <span>{formatEventTimeRange(event.startsAt, event.endsAt)}</span>
                    </span>
                    <span className="meta-dot" aria-hidden="true">•</span>
                    <span className="icon-text">
                      <Icon name="pin" size={14} />
                      <span>{event.venue || 'ยังไม่ระบุสถานที่'}</span>
                    </span>
                  </p>
                  <p className="org-event-row__stats">
                    มีสิทธิ์: <strong>{stats.activeCount}</strong> • เช็กอินแล้ว:{' '}
                    <strong>{stats.usedCount}</strong> • ยกเลิก:{' '}
                    <strong>{stats.cancelledCount}</strong> • คงเหลือ:{' '}
                    <strong>{stats.remainingLabel}</strong>
                  </p>

                  <div className="org-event-row__actions">
                    <Link
                      to={`/org/events/${event.id}/edit`}
                      className="btn btn--secondary btn--sm"
                    >
                      แก้ไขข้อมูล
                    </Link>

                    <Link
                      to={`/org/events/${event.id}/attendees`}
                      className="btn btn--secondary btn--sm"
                    >
                      รายชื่อผู้ลงทะเบียน ({stats.totalTickets})
                    </Link>

                    {event.status === 'draft' && (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        disabled={isBusy}
                        onClick={() => handlePublish(event)}
                      >
                        {isBusy ? 'กำลังเผยแพร่...' : 'เผยแพร่งาน (Publish)'}
                      </button>
                    )}

                    {event.status === 'published' && (
                      <button
                        type="button"
                        className="btn btn--warning btn--sm"
                        disabled={isBusy}
                        onClick={() =>
                          setConfirmState({ open: true, action: 'close', event })
                        }
                      >
                        ปิดรับลงทะเบียน (Close)
                      </button>
                    )}

                    {event.status === 'draft' ? (
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        disabled={!canDelete || isBusy}
                        title={
                          canDelete
                            ? 'ลบฉบับร่างนี้'
                            : 'ไม่สามารถลบได้ เนื่องจากมีประวัติบัตรลงทะเบียนแล้ว'
                        }
                        onClick={() =>
                          setConfirmState({ open: true, action: 'delete', event })
                        }
                      >
                        ลบ Draft
                      </button>
                    ) : (
                      <span className="text-muted text-xs">
                        งานที่เผยแพร่แล้วไม่สามารถลบได้
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={
          confirmState.action === 'delete'
            ? 'ยืนยันการลบ Draft งานนี้?'
            : 'ยืนยันการปิดรับลงทะเบียน?'
        }
        message={
          confirmState.action === 'delete'
            ? `ต้องการลบงานฉบับร่าง "${confirmState.event?.title}" ออกจากฐานข้อมูลใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`
            : `ต้องการปิดรับลงทะเบียนสำหรับงาน "${confirmState.event?.title}" ใช่หรือไม่? ผู้ใช้จะไม่สามารถลงทะเบียนเพิ่มได้ แต่ประวัติบัตรเดิมและการเช็กอินจะยังคงใช้งานได้ตามปกติ`
        }
        confirmLabel={
          confirmState.action === 'delete' ? 'ยืนยันลบ Draft' : 'ยืนยันปิดรับลงทะเบียน'
        }
        tone={confirmState.action === 'delete' ? 'danger' : 'primary'}
        isSubmitting={Boolean(busyEventId)}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ open: false, action: null, event: null })}
      />
    </div>
  );
}
