import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { PosterImage } from '../../components/PosterImage';
import { RegistrationForm } from '../../components/RegistrationForm';
import { SeatMap } from '../../components/SeatMap';
import { StatusBadge } from '../../components/StatusBadge';
import { TicketQRCode } from '../../components/TicketQRCode';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { useEvent } from '../../hooks/useEvent';
import { usePolling } from '../../hooks/usePolling';
import { useEventStats } from '../../hooks/useTickets';
import { updatePageMetadata } from '../../seo/head';
import { getEventMetadata, getEventUrl, NOINDEX_METADATA } from '../../seo/metadata';
import { ApiError } from '../../services/apiClient';
import { registerForEvent } from '../../services/ticketService';
import { getEventAvailabilityStats, isEventFull } from '../../utils/capacityUtils';
import {
  formatEventTimeRange,
  hasEventEnded,
  hasEventStarted,
} from '../../utils/dateUtils';
import { generateTicketId } from '../../utils/idUtils';
import { validateRegistrationForm } from '../../utils/validation';

const COLLAPSED_DESC_MAX_HEIGHT = 240;

export function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const accountName = user?.user_metadata?.full_name || '';
  const attendeeEmail = user?.email || '';

  const { event, loading: eventLoading, error: eventError, refetch: refetchEvent } = useEvent(id);
  const currentEvent = event?.id === id ? event : null;
  const eventTitle = currentEvent?.title;
  const eventDescription = currentEvent?.description;
  const eventPoster = currentEvent?.posterUrl;
  const eventNotFound = eventError?.code === 'NOT_FOUND';

  useEffect(() => {
    if (eventTitle && !eventNotFound) {
      updatePageMetadata(getEventMetadata({ id, title: eventTitle, description: eventDescription, posterUrl: eventPoster }));
      return;
    }

    // Keep the metadata from the initial HTML while the event details load.
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (!eventNotFound && canonical?.href === getEventUrl(id)) return;

    updatePageMetadata({
      ...NOINDEX_METADATA,
      title: eventNotFound ? 'ไม่พบอีเวนต์ | PULSE' : 'รายละเอียดอีเวนต์ | PULSE',
    });
  }, [id, eventTitle, eventDescription, eventPoster, eventNotFound]);

  const { categories } = useCategories();
  const {
    stats: availability,
    loading: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useEventStats({ eventId: id });

  const previewParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isEmbedPreview = previewParams.get('embed') === '1';
  const focusSeatmap = previewParams.get('focus') === 'seatmap';
  const isMockSeatedPreview = isEmbedPreview && focusSeatmap;
  const effectiveUserId = isEmbedPreview ? null : userId;
  const defaultAttendeeName = isMockSeatedPreview
    ? 'คุณปภาวิน สุขใจ'
    : isEmbedPreview
      ? ''
      : accountName;
  const effectiveAttendeeEmail = isMockSeatedPreview
    ? 'demo@pulse.chiqq888.me'
    : isEmbedPreview
      ? ''
      : attendeeEmail;

  const [attendeeName, setAttendeeName] = useState(defaultAttendeeName);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [seatNotice, setSeatNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [recoveredFlag, setRecoveredFlag] = useState(false);
  const [hasPendingRetry, setHasPendingRetry] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isDescOverflowing, setIsDescOverflowing] = useState(false);
  const [regCardHeight, setRegCardHeight] = useState(0);

  const pendingAttemptRef = useRef(null);
  const mockSeatInitRef = useRef(null);
  const descRef = useRef(null);
  const regCardRef = useRef(null);
  const showCreatedTicket = Boolean(
    createdTicket && (isMockSeatedPreview || (effectiveUserId && createdTicket.user_id === effectiveUserId))
  );
  const isSeatedEvent = event?.registrationMode === 'seated';
  const collapsedMaxHeight = isEmbedPreview
    ? 190
    : !isSeatedEvent && regCardHeight > 0
      ? Math.max(140, regCardHeight - 140)
      : COLLAPSED_DESC_MAX_HEIGHT;

  useEffect(() => {
    setAttendeeName(defaultAttendeeName);
    setSelectedSeatId(null);
    setFieldErrors({});
    setSubmitError('');
    setSeatNotice('');
    setIsSubmitting(false);
    setCreatedTicket(null);
    setRecoveredFlag(false);
    setHasPendingRetry(false);
    pendingAttemptRef.current = null;
    mockSeatInitRef.current = null;
  }, [id, effectiveUserId, defaultAttendeeName]);

  useEffect(() => {
    setIsDescExpanded(false);
  }, [id]);

  useEffect(() => {
    const regEl = regCardRef.current;
    if (!regEl || showCreatedTicket || isEmbedPreview) {
      setRegCardHeight(0);
      return undefined;
    }

    const updateRegHeight = () => {
      if (window.innerWidth < 960 || !regCardRef.current) {
        setRegCardHeight(0);
        return;
      }
      setRegCardHeight(Math.round(regCardRef.current.getBoundingClientRect().height));
    };

    updateRegHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateRegHeight);
      observer.observe(regEl);
      window.addEventListener('resize', updateRegHeight);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateRegHeight);
      };
    }

    window.addEventListener('resize', updateRegHeight);
    return () => {
      window.removeEventListener('resize', updateRegHeight);
    };
  }, [event?.id, effectiveUserId, authLoading, availabilityLoading, showCreatedTicket, isEmbedPreview]);

  useEffect(() => {
    const el = descRef.current;
    if (!el) {
      setIsDescOverflowing(false);
      return undefined;
    }

    let cancelled = false;
    const checkOverflow = () => {
      if (cancelled || !descRef.current) return;
      setIsDescOverflowing(descRef.current.scrollHeight > collapsedMaxHeight + 16);
    };

    checkOverflow();

    if (document.fonts?.ready) {
      document.fonts.ready.then(checkOverflow).catch(() => {});
    }

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(checkOverflow);
      observer.observe(el);
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }

    window.addEventListener('resize', checkOverflow);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', checkOverflow);
    };
  }, [event?.id, event?.description, showCreatedTicket, collapsedMaxHeight]);

  // Poll every 5s for live seat & capacity updates (FR-19, AT-16)
  const pollRefresh = useCallback(async () => {
    await Promise.all([
      refetchEvent({ silent: true }),
      refetchAvailability({ silent: true }),
    ]);
  }, [refetchEvent, refetchAvailability]);

  usePolling(pollRefresh, 5000, Boolean(event && event.status !== 'draft' && !isEmbedPreview));

  const stats = useMemo(
    () => getEventAvailabilityStats(event, availability.find((entry) => entry.eventId === id)),
    [event, availability, id]
  );

  useEffect(() => {
    if (
      !isMockSeatedPreview ||
      !isSeatedEvent ||
      eventLoading ||
      availabilityLoading ||
      !Array.isArray(event?.seats) ||
      event.seats.length === 0 ||
      mockSeatInitRef.current === event.id
    ) {
      return;
    }

    mockSeatInitRef.current = event.id;
    const preferredSeat =
      event.seats.find((s) => s.label === 'A04' && !stats.occupiedSeatIds.has(s.id)) ||
      event.seats.find((s) => !stats.occupiedSeatIds.has(s.id)) ||
      null;
    if (preferredSeat) {
      setSelectedSeatId(preferredSeat.id);
    }
  }, [isMockSeatedPreview, isSeatedEvent, eventLoading, availabilityLoading, event, stats.occupiedSeatIds]);

  // If the selected seat gets taken by someone else during polling, clear selection & notify user
  useEffect(() => {
    if (selectedSeatId && !isSubmitting && !hasPendingRetry && stats.occupiedSeatIds.has(selectedSeatId)) {
      const takenSeat = event?.seats?.find((s) => s.id === selectedSeatId);
      setSelectedSeatId(null);
      setSeatNotice(
        `ที่นั่ง ${takenSeat ? takenSeat.label : selectedSeatId} เพิ่งถูกลงทะเบียนไปแล้ว กรุณาเลือกที่นั่งว่างอื่น`
      );
    }
  }, [selectedSeatId, stats.occupiedSeatIds, event, isSubmitting, hasPendingRetry]);

  const categoryName = useMemo(() => {
    const match = categories.find((c) => c.id === event?.categoryId);
    return match ? match.name : 'ทั่วไป';
  }, [categories, event]);

  const selectedSeatObj = useMemo(() => {
    if (!selectedSeatId || !Array.isArray(event?.seats)) return null;
    return event.seats.find((s) => s.id === selectedSeatId) || null;
  }, [event, selectedSeatId]);

  const clearPendingAttempt = () => {
    pendingAttemptRef.current = null;
    setHasPendingRetry(false);
  };

  const notifyEmbedInteract = useCallback(() => {
    if (isMockSeatedPreview && typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'pulse-embed-interact' }, window.location.origin);
    }
  }, [isMockSeatedPreview]);

  const handleNameChange = (val) => {
    notifyEmbedInteract();
    setAttendeeName(val);
    setFieldErrors((prev) => ({ ...prev, attendeeName: undefined }));
    setSubmitError('');
  };

  const handleSeatSelect = (seatId) => {
    notifyEmbedInteract();
    setSelectedSeatId(seatId);
    setFieldErrors((prev) => ({ ...prev, seatId: undefined }));
    setSubmitError('');
    setSeatNotice('');
    clearPendingAttempt();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event || (!effectiveUserId && !isMockSeatedPreview) || isSubmitting) return;
    notifyEmbedInteract();

    setSubmitError('');
    setSeatNotice('');

    const validation = validateRegistrationForm({
      attendeeName,
      attendeeEmail: effectiveAttendeeEmail,
      event,
      selectedSeatId,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    if (isMockSeatedPreview) {
      setCreatedTicket({
        id: generateTicketId(),
        eventId: event.id,
        user_id: 'demo-preview',
        attendeeName: validation.cleaned.attendeeName,
        attendeeEmail: validation.cleaned.attendeeEmail,
        seatId: validation.cleaned.seatId,
        status: 'valid',
        createdAt: new Date().toISOString(),
      });
      setRecoveredFlag(false);
      return;
    }

    setIsSubmitting(true);

    const attemptTicketId = pendingAttemptRef.current || generateTicketId();
    pendingAttemptRef.current = attemptTicketId;

    try {
      const result = await registerForEvent({
        ticketId: attemptTicketId,
        eventId: event.id,
        attendeeName: validation.cleaned.attendeeName,
        seatId: validation.cleaned.seatId,
      });

      if (pendingAttemptRef.current !== attemptTicketId) return;
      clearPendingAttempt();
      setCreatedTicket(result.ticket);
      setRecoveredFlag(Boolean(result.recovered));
      setSelectedSeatId(null);
      setIsSubmitting(false);
      void pollRefresh();
    } catch (err) {
      if (pendingAttemptRef.current !== attemptTicketId) return;
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details) {
        setFieldErrors(err.details);
      }

      if (err instanceof ApiError && err.isAmbiguous) {
        setHasPendingRetry(true);
      } else {
        // Definitive server/business rejection: no ambiguous ticket exists, refresh latest data
        clearPendingAttempt();
        void pollRefresh();
      }

      setSubmitError(err?.message || 'เกิดข้อผิดพลาดระหว่างการลงทะเบียน กรุณาลองใหม่');
      setIsSubmitting(false);
    }
  };

  const loading = eventLoading || (availabilityLoading && !event);
  if (loading) {
    return <FeedbackState type="loading" title="กำลังโหลดรายละเอียดงาน..." />;
  }

  if (eventError) {
    if (eventError instanceof ApiError && eventError.code === 'NOT_FOUND') {
      return (
        <FeedbackState
          type="empty"
          title="ไม่พบงานที่คุณต้องการ"
          message="งานนี้อาจถูกลบหรือไม่มีอยู่ในระบบ"
          actionLabel="กลับไปหน้า Explore"
          onAction={() => navigate('/user')}
        />
      );
    }
    return (
      <FeedbackState
        type="error"
        title="ไม่สามารถโหลดรายละเอียดงานได้"
        message={eventError.message}
        onAction={() => {
          refetchEvent();
          refetchAvailability();
        }}
      />
    );
  }

  // FR-03: Draft events must not be visible in User view
  if (!event || event.status === 'draft') {
    return (
      <FeedbackState
        type="empty"
        title="ไม่พบงานนี้ในมุมมองผู้เข้าร่วม"
        message="งานนี้ยังไม่ได้เผยแพร่ (Draft) หรือไม่มีอยู่ในระบบ"
        actionLabel="กลับไปหน้า Explore"
        onAction={() => navigate('/user')}
      />
    );
  }

  const started = hasEventStarted(event);
  const ended = hasEventEnded(event);
  const full = isEventFull(event, stats);

  let disabledReason = '';
  if (event.status === 'closed') {
    disabledReason = 'งานนี้ปิดรับลงทะเบียนแล้ว (ผู้ที่มีบัตรเดิมยังสามารถใช้เข้างานได้)';
  } else if (ended) {
    disabledReason = 'งานนี้สิ้นสุดลงแล้ว ไม่สามารถลงทะเบียนได้';
  } else if (started) {
    disabledReason = 'งานนี้ถึงเวลาเริ่มแล้ว ไม่สามารถลงทะเบียนเพิ่มได้';
  } else if (full && !hasPendingRetry) {
    disabledReason = 'ขออภัย จำนวนผู้ลงทะเบียนเต็มแล้ว';
  }

  const registrationDisabled = Boolean(disabledReason) && !hasPendingRetry;
  const createdSeatObj =
    createdTicket?.seatId && Array.isArray(event.seats)
      ? event.seats.find((s) => s.id === createdTicket.seatId)
      : null;

  const capacityPercent =
    event.registrationMode !== 'unlimited' && stats.totalCapacity > 0
      ? Math.min(100, Math.round((stats.activeCount / stats.totalCapacity) * 100))
      : 0;
  const descriptionText = event.description?.trim() || '';
  const capacityClass =
    !availabilityLoading && !availabilityError
      ? full
        ? 'event-detail-capacity--full'
        : event.registrationMode !== 'unlimited'
          ? 'event-detail-capacity--available'
          : undefined
      : undefined;

  const descriptionSection = (
    <section
      className={`card event-detail-desc${
        !showCreatedTicket && !isSeatedEvent && regCardHeight > 0
          ? ' event-detail-desc--match-sidebar'
          : ''
      }`}
      style={
        !showCreatedTicket && !isSeatedEvent && regCardHeight > 0
          ? {
              '--desc-collapsed-max-height': `${collapsedMaxHeight}px`,
              '--desc-min-height': `${regCardHeight}px`,
            }
          : undefined
      }
      aria-labelledby="event-desc-heading"
    >
      <div className="section-heading event-detail-desc__header">
        <h2 id="event-desc-heading" className="section-title">รายละเอียดงาน</h2>
      </div>
      <div
        id="event-desc-content"
        ref={descRef}
        className={`event-detail-desc__body${
          isDescOverflowing && !isDescExpanded ? ' event-detail-desc__body--collapsed' : ''
        }`}
      >
        {descriptionText ? (
          <p className="event-detail-desc__text">{descriptionText}</p>
        ) : (
          <p className="text-muted text-sm">ยังไม่มีรายละเอียดเพิ่มเติมสำหรับงานนี้</p>
        )}
      </div>
      {isDescOverflowing && (
        <div className="event-detail-desc__footer">
          <button
            type="button"
            className="btn btn--ghost btn--sm event-detail-desc__toggle"
            aria-expanded={isDescExpanded}
            aria-controls="event-desc-content"
            onClick={() => {
              if (!isEmbedPreview) setIsDescExpanded((prev) => !prev);
            }}
          >
            <span>{isDescExpanded ? 'ย่อลง' : 'อ่านเพิ่มเติม'}</span>
            <Icon
              name="chevronDown"
              size={15}
              className={
                isDescExpanded
                  ? 'event-detail-desc__chevron event-detail-desc__chevron--up'
                  : 'event-detail-desc__chevron'
              }
            />
          </button>
        </div>
      )}
    </section>
  );

  return (
    <div className="page-stack">
      {!isEmbedPreview && (
        <div className="breadcrumb-row">
          <Link to="/user" className="link-back">
            <Icon name="chevronLeft" size={15} />
            <span>กลับไปหน้า Explore</span>
          </Link>
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={pollRefresh}
          >
            <Icon name="refresh" size={14} />
            <span>รีเฟรชสถานะล่าสุด</span>
          </button>
        </div>
      )}

      {availabilityError && (
        <div className="alert alert--danger" role="alert">
          ไม่สามารถโหลดข้อมูลจำนวนว่างล่าสุดได้: {availabilityError.message}{' '}
          <button type="button" className="btn btn--xs btn--secondary" onClick={pollRefresh}>
            ลองใหม่
          </button>
        </div>
      )}

      {!isMockSeatedPreview && (
        <article className="event-detail-hero card">
        <div className="event-detail-hero__poster">
          <PosterImage src={event.posterUrl} alt={event.title} className="event-detail-hero__img" />
        </div>

        <div className="event-detail-hero__info">
          <div className="badge-row">
            <StatusBadge type={event.eventType} />
            <StatusBadge type={event.status} />
            <StatusBadge type={event.registrationMode} />
            <span className="pill-free">Register for free</span>
          </div>

          <h1 className="event-detail-hero__title">{event.title}</h1>

          <dl className="detail-meta-grid event-detail-hero__meta">
            <div>
              <dt className="icon-text">
                <Icon name="calendar" size={13} />
                <span>วันเวลาจัดงาน</span>
              </dt>
              <dd>{formatEventTimeRange(event.startsAt, event.endsAt)}</dd>
            </div>
            <div>
              <dt className="icon-text">
                <Icon name="pin" size={13} />
                <span>สถานที่</span>
              </dt>
              <dd>{event.venue}</dd>
            </div>
            <div>
              <dt>ผู้จัดงาน</dt>
              <dd>{event.organizerName}</dd>
            </div>
            <div>
              <dt>หมวดหมู่</dt>
              <dd>{categoryName}</dd>
            </div>
            <div>
              <dt>สิทธิ์ว่างคงเหลือ</dt>
              <dd>
                <strong className={capacityClass}>
                  {availabilityLoading || availabilityError
                    ? '—'
                    : event.registrationMode === 'unlimited'
                      ? 'ไม่จำกัด'
                      : `${stats.remaining} / ${stats.totalCapacity} ที่`}
                </strong>{' '}
                {!availabilityLoading && !availabilityError && (
                  <span className="text-muted">(ลงทะเบียนแล้ว {stats.activeCount} คน)</span>
                )}
              </dd>
            </div>
            <div>
              <dt>ค่าเข้าร่วม</dt>
              <dd>
                <strong>ฟรี (Register for free)</strong>
              </dd>
            </div>
          </dl>
        </div>
        </article>
      )}

      {showCreatedTicket ? (
        <>
          <section className="card registration-success" aria-live="polite">
            <div className="registration-success__header">
              <span className="badge badge--success">✓ ลงทะเบียนสำเร็จและออกบัตรแล้ว</span>
              <h2>พร้อมเข้างานแล้ว! นี่คือบัตร QR ของคุณ</h2>
              <p className="text-muted">
                {recoveredFlag
                  ? 'พบรายการเดิมที่บันทึกสำเร็จแล้วในระบบ และนำบัตรเดิมมาแสดงโดยไม่สร้างบัตรซ้ำ'
                  : 'ระบบบันทึกบัตรลงฐานข้อมูลเรียบร้อยแล้ว คุณสามารถเปิดดูบัตรนี้ซ้ำได้ทุกเมื่อแม้รีโหลดหน้า'}
              </p>
            </div>

            <div className="registration-success__body">
              <TicketQRCode ticketId={createdTicket.id} size={190} />

              <div className="registration-success__summary">
                <dl className="detail-meta-grid">
                  <div>
                    <dt>ชื่องาน</dt>
                    <dd>
                      <strong>{event.title}</strong>
                    </dd>
                  </div>
                  <div>
                    <dt>ผู้เข้าร่วม</dt>
                    <dd>
                      {createdTicket.attendeeName} ({createdTicket.attendeeEmail})
                    </dd>
                  </div>
                  {createdTicket.seatId && (
                    <div>
                      <dt>ที่นั่ง</dt>
                      <dd>
                        <strong>
                          {createdSeatObj
                            ? `${createdSeatObj.label} (Zone ${createdSeatObj.zone})`
                            : createdTicket.seatId}
                        </strong>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>สถานะบัตร</dt>
                    <dd>
                      <StatusBadge type={createdTicket.status} />
                    </dd>
                  </div>
                </dl>

                <div className="registration-success__actions">
                  {isMockSeatedPreview ? (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => setCreatedTicket(null)}
                    >
                      ลองเลือกที่นั่งใหม่
                    </button>
                  ) : (
                    <>
                      <Link
                        to={`/user/tickets/${createdTicket.id}`}
                        className="btn btn--primary"
                      >
                        เปิดหน้ารายละเอียดบัตร QR
                      </Link>
                      <Link to="/user/my-events" className="btn btn--secondary">
                        ดูทั้งหมดใน My Events
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
          {!isMockSeatedPreview && descriptionSection}
        </>
      ) : (
        <div className="event-detail-body">
          <div className="event-detail-main">
            {!isMockSeatedPreview && descriptionSection}

            {event.registrationMode === 'seated' && (
              <section id="event-seatmap" className="card">
                <div className="section-heading">
                  <h2 className="section-title">เลือกที่นั่งบนผังคอนเสิร์ต (1 ที่นั่งต่อการลงทะเบียน)</h2>
                  <span className="text-muted text-sm">
                    {availabilityLoading || availabilityError
                      ? 'กำลังตรวจสอบสถานะที่นั่ง'
                      : `ว่าง ${stats.remaining} / ${stats.totalCapacity} ที่นั่ง`}
                  </span>
                </div>

                {seatNotice && (
                  <div className="alert alert--warning" role="alert">
                    {seatNotice}
                  </div>
                )}

                <SeatMap
                  seats={event.seats}
                  occupiedSeatIds={stats.occupiedSeatIds}
                  selectedSeatId={selectedSeatId}
                  templateId={event.seatTemplateId}
                  onSelectSeat={handleSeatSelect}
                  disabled={
                    isMockSeatedPreview
                      ? (isSubmitting || availabilityLoading || Boolean(availabilityError))
                      : (!effectiveUserId || registrationDisabled || isSubmitting || hasPendingRetry || availabilityLoading || Boolean(availabilityError))
                  }
                />
              </section>
            )}
          </div>

          <aside className="event-detail-sidebar">
            <section ref={regCardRef} className="card event-detail-reg-card">
              {!availabilityLoading && !availabilityError && (
                <div className="event-detail-sidebar__status">
                  <div className="event-detail-sidebar__status-row">
                    <span className={full ? 'event-detail-capacity--full' : 'event-detail-capacity--available'}>
                      {event.registrationMode === 'unlimited'
                        ? 'เปิดรับไม่จำกัดจำนวน'
                        : full
                          ? 'สิทธิ์ลงทะเบียนเต็มแล้ว'
                          : `ว่าง ${stats.remaining} / ${stats.totalCapacity} ที่`}
                    </span>
                    <span className="text-muted text-xs">
                      ลงทะเบียนแล้ว {stats.activeCount} คน
                    </span>
                  </div>
                  {event.registrationMode !== 'unlimited' && stats.totalCapacity > 0 && (
                    <div className="progress-bar event-detail-sidebar__progress" aria-hidden="true">
                      <div
                        className={`progress-bar__fill event-detail-sidebar__progress-fill${
                          full ? ' event-detail-sidebar__progress-fill--full' : ''
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {authLoading && !isEmbedPreview ? (
                <FeedbackState type="loading" compact title="กำลังตรวจสอบบัญชี..." />
              ) : effectiveUserId || isMockSeatedPreview ? (
                <RegistrationForm
                  event={event}
                  attendeeName={attendeeName}
                  attendeeEmail={effectiveAttendeeEmail}
                  onNameChange={handleNameChange}
                  selectedSeat={selectedSeatObj}
                  fieldErrors={fieldErrors}
                  submitError={submitError}
                  hasPendingRetry={hasPendingRetry}
                  isSubmitting={isSubmitting}
                  disabled={isMockSeatedPreview ? false : registrationDisabled}
                  disabledReason={isMockSeatedPreview ? '' : disabledReason}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div className="page-stack-sm">
                  <span className="pill-free event-detail-sidebar__free-pill">Register for free</span>
                  <h2>ลงทะเบียนเข้าร่วมงาน</h2>
                  {disabledReason ? (
                    <div className="alert alert--warning" role="status">
                      {disabledReason}
                    </div>
                  ) : (
                    <>
                      <p className="text-muted text-sm">
                        เข้าสู่ระบบด้วยบัญชีของคุณเพื่อรับบัตร QR เข้างานฟรี (1 ใบต่อบัญชี)
                      </p>
                      <Link to="/login" state={{ from: location }} className="btn btn--primary btn--lg btn--full">
                        เข้าสู่ระบบเพื่อลงทะเบียน
                      </Link>
                    </>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
