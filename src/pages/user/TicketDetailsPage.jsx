import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { PosterImage } from '../../components/PosterImage';
import { StatusBadge } from '../../components/StatusBadge';
import { TicketQRCode } from '../../components/TicketQRCode';
import { useEvent } from '../../hooks/useEvent';
import { usePolling } from '../../hooks/usePolling';
import { useTickets } from '../../hooks/useTickets';
import { ApiError } from '../../services/apiClient';
import { cancelTicket } from '../../services/ticketService';
import {
  formatBangkokDateTime,
  formatEventTimeRange,
  hasEventStarted,
} from '../../utils/dateUtils';

export function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const {
    tickets: ticket,
    loading: ticketLoading,
    error: ticketError,
    refetch: refetchTicket,
  } = useTickets({ mode: 'single', ticketId });

  const {
    event,
    loading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useEvent(ticket?.eventId || '');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const pollRefresh = useCallback(async () => {
    await refetchTicket({ silent: true });
    if (ticket?.eventId) {
      await refetchEvent({ silent: true });
    }
  }, [refetchTicket, refetchEvent, ticket?.eventId]);

  // Poll every 5s so user sees status change to 'used' immediately after Staff scans
  usePolling(pollRefresh, 5000, Boolean(ticket && ticket.status === 'valid'));

  const handleConfirmCancel = async () => {
    if (!ticket || isCancelling) return;
    setIsCancelling(true);
    setCancelError('');
    setCancelSuccess('');

    try {
      await cancelTicket(ticket.id);
      setConfirmOpen(false);
      setCancelSuccess('ยกเลิกการลงทะเบียนเรียบร้อยแล้ว สิทธิ์/ที่นั่งถูกคืนกลับสู่งานแล้ว');
      await refetchTicket();
    } catch (err) {
      setConfirmOpen(false);
      setCancelError(err?.message || 'ไม่สามารถยกเลิกบัตรได้ กรุณาลองใหม่');
      await refetchTicket({ silent: true });
    } finally {
      setIsCancelling(false);
    }
  };

  const loading = ticketLoading || (Boolean(ticket?.eventId) && eventLoading && !event);
  if (loading) {
    return <FeedbackState type="loading" title="กำลังโหลดข้อมูลบัตร QR..." />;
  }

  if (ticketError) {
    if (ticketError instanceof ApiError && ticketError.code === 'NOT_FOUND') {
      return (
        <FeedbackState
          type="empty"
          title="ไม่พบบัตรรหัสนี้ในระบบ"
          message={`ไม่พบบัตร ${ticketId} กรุณาตรวจสอบลิงก์หรือรหัสบัตรอีกครั้ง`}
          actionLabel="ไปหน้า My Events"
          onAction={() => navigate('/user/my-events')}
          secondaryActionLabel="ไปหน้า Explore"
          onSecondaryAction={() => navigate('/user')}
        />
      );
    }
    return (
      <FeedbackState
        type="error"
        title="ไม่สามารถโหลดข้อมูลบัตรได้"
        message={ticketError.message}
        onAction={() => refetchTicket()}
      />
    );
  }

  if (!ticket) {
    return (
      <FeedbackState
        type="empty"
        title="ไม่พบข้อมูลบัตร"
        actionLabel="กลับไปหน้า My Events"
        onAction={() => navigate('/user/my-events')}
      />
    );
  }

  const started = event ? hasEventStarted(event) : false;
  const canCancel = ticket.status === 'valid' && Boolean(event) && !started;
  const seatObj =
    ticket.seatId && Array.isArray(event?.seats)
      ? event.seats.find((s) => s.id === ticket.seatId)
      : null;

  let cancelHint = '';
  if (ticket.status === 'used') {
    cancelHint = 'ไม่สามารถยกเลิกบัตรได้ เนื่องจากบัตรนี้เช็กอินเข้างานแล้ว';
  } else if (ticket.status === 'cancelled') {
    cancelHint = 'บัตรนี้ถูกยกเลิกแล้ว ไม่สามารถใช้เข้างานได้';
  } else if (started) {
    cancelHint = 'ไม่สามารถยกเลิกบัตรได้ เนื่องจากถึงเวลาเริ่มงานแล้ว';
  }

  return (
    <div className="page-stack">
      <div className="breadcrumb-row">
        <Link to="/user/my-events" className="link-back">
          <Icon name="chevronLeft" size={15} />
          <span>กลับไปหน้า My Events</span>
        </Link>
        <button
          type="button"
          className="btn btn--ghost btn--xs"
          onClick={() => {
            refetchTicket();
            if (ticket.eventId) refetchEvent();
          }}
        >
          <Icon name="refresh" size={14} />
          <span>อัปเดตสถานะล่าสุด</span>
        </button>
      </div>

      {eventError && (
        <div className="alert alert--warning" role="alert">
          โหลดรายละเอียดงานไม่สำเร็จ: {eventError.message}
        </div>
      )}

      {cancelSuccess && (
        <div className="alert alert--success" role="status">
          {cancelSuccess}
        </div>
      )}

      {cancelError && (
        <div className="alert alert--danger" role="alert">
          {cancelError}
        </div>
      )}

      <article className={`ticket-pass card ticket-pass--${ticket.status}`}>
        <div className="ticket-pass__main">
          <div className="ticket-pass__top">
            <div className="badge-row">
              <StatusBadge type={ticket.status} />
              {event?.eventType && <StatusBadge type={event.eventType} />}
              <span className="pill-free">Free Pass</span>
            </div>
            <h1 className="ticket-pass__title">
              {event ? event.title : `งานรหัส ${ticket.eventId}`}
            </h1>
          </div>

          {event && (
            <div className="ticket-pass__poster-row">
              <PosterImage
                src={event.posterUrl}
                alt={event.title}
                className="ticket-pass__poster"
              />
              <dl className="detail-meta-grid">
                <div>
                  <dt>วันเวลา</dt>
                  <dd>{formatEventTimeRange(event.startsAt, event.endsAt)}</dd>
                </div>
                <div>
                  <dt>สถานที่</dt>
                  <dd>{event.venue}</dd>
                </div>
                <div>
                  <dt>ผู้จัดงาน</dt>
                  <dd>{event.organizerName}</dd>
                </div>
                <div>
                  <dt>ผู้เข้าร่วม</dt>
                  <dd>
                    <strong>{ticket.attendeeName}</strong>
                    <div className="text-muted">{ticket.attendeeEmail}</div>
                  </dd>
                </div>
                {ticket.seatId && (
                  <div>
                    <dt>ที่นั่ง</dt>
                    <dd>
                      <strong className="seat-highlight">
                        {seatObj
                          ? `${seatObj.label} (Zone ${seatObj.zone}, แถว ${seatObj.row})`
                          : ticket.seatId}
                      </strong>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>ออกบัตรเมื่อ</dt>
                  <dd>{formatBangkokDateTime(ticket.createdAt)}</dd>
                </div>
                {ticket.checkedInAt && (
                  <div>
                    <dt>เช็กอินเมื่อ</dt>
                    <dd>
                      <strong>{formatBangkokDateTime(ticket.checkedInAt)}</strong>
                    </dd>
                  </div>
                )}
                {ticket.cancelledAt && (
                  <div>
                    <dt>ยกเลิกเมื่อ</dt>
                    <dd>{formatBangkokDateTime(ticket.cancelledAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="ticket-pass__actions">
            {event && (
              <Link to={`/user/events/${event.id}`} className="btn btn--secondary btn--sm">
                ดูหน้างานนี้
              </Link>
            )}

            {canCancel ? (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isCancelling}
              >
                ยกเลิกการลงทะเบียน
              </button>
            ) : (
              cancelHint && <span className="text-muted text-sm">{cancelHint}</span>
            )}
          </div>
        </div>

        <div className="ticket-pass__stub">
          <TicketQRCode ticketId={ticket.id} size={200} />
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="ยืนยันการยกเลิกการลงทะเบียน?"
        message={`คุณต้องการยกเลิกบัตรสำหรับงาน "${event?.title || ticket.eventId}" ใช่หรือไม่? หลังยกเลิกแล้วบัตรนี้จะไม่สามารถใช้เข้างานได้ และสิทธิ์/ที่นั่งจะถูกคืนกลับสู่งานทันที`}
        confirmLabel="ยืนยันยกเลิกบัตร"
        cancelLabel="เก็บบัตรไว้"
        tone="danger"
        isSubmitting={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
