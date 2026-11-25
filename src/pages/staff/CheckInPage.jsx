import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckInResult } from '../../components/CheckInResult';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { QRScanner } from '../../components/QRScanner';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useEvents } from '../../hooks/useEvents';
import { usePolling } from '../../hooks/usePolling';
import { useEventStats } from '../../hooks/useTickets';
import {
  confirmCheckIn,
  verifyTicketForCheckIn,
} from '../../services/ticketService';
import { getEventAvailabilityStats } from '../../utils/capacityUtils';
import { formatEventTimeRange, hasEventEnded } from '../../utils/dateUtils';

export function CheckInPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get('eventId') || '';

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents('staff');

  const selectedEvent = useMemo(
    () => events.find((ev) => ev.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const {
    stats: summaries,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useEventStats({
    scope: 'staff',
    eventId: selectedEventId,
    enabled: Boolean(selectedEvent),
  });

  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [confirmError, setConfirmError] = useState('');

  // Prevents overlapping verify/confirm requests from camera callback or rapid submits
  const processingRef = useRef(false);

  // Clear current verification result when switching selected event
  useEffect(() => {
    setCheckResult(null);
    setConfirmError('');
    setManualCode('');
  }, [selectedEventId]);

  const pollRefresh = useCallback(async () => {
    if (!selectedEventId) return;
    await Promise.all([
      refetchEvents({ silent: true }),
      refetchStats({ silent: true }),
    ]);
  }, [selectedEventId, refetchEvents, refetchStats]);

  // FR-19: Poll every 5s for live check-in count while Check-in page is open
  usePolling(pollRefresh, 5000, Boolean(selectedEventId));

  const stats = useMemo(
    () => getEventAvailabilityStats(
      selectedEvent,
      summaries.find((summary) => summary.eventId === selectedEventId)
    ),
    [selectedEvent, selectedEventId, summaries]
  );

  const handleEventChange = (nextEventId) => {
    if (nextEventId) {
      setSearchParams({ eventId: nextEventId });
    } else {
      setSearchParams({});
    }
  };

  const runVerification = useCallback(
    async (rawCode) => {
      if (processingRef.current || !selectedEvent) return;
      const trimmed = String(rawCode || '').trim();
      if (!trimmed) {
        setCheckResult({
          outcome: 'EMPTY_CODE',
          canConfirm: false,
          title: 'กรุณากรอกรหัสบัตร',
          message: 'โปรดกรอกรหัสบัตร TKT-... หรือสแกน QR Code ก่อนตรวจสอบ',
          ticket: null,
          event: selectedEvent,
          seat: null,
        });
        return;
      }

      processingRef.current = true;
      setIsVerifying(true);
      setConfirmError('');
      setManualCode(trimmed);

      try {
        const result = await verifyTicketForCheckIn(trimmed, selectedEventId);
        setCheckResult(result);
      } finally {
        setIsVerifying(false);
        processingRef.current = false;
      }
    },
    [selectedEventId, selectedEvent]
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    runVerification(manualCode);
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedEvent || !checkResult?.canConfirm || !checkResult.ticket || processingRef.current) return;

    processingRef.current = true;
    setIsConfirming(true);
    setConfirmError('');

    try {
      const outcome = await confirmCheckIn(checkResult.ticket.id, selectedEventId);
      setCheckResult(outcome.result);
      await refetchStats({ silent: true });
    } catch (err) {
      setConfirmError(
        err?.message || 'ไม่สามารถบันทึกเช็กอินได้ (API ขัดข้อง) กรุณาลองตรวจสอบใหม่อีกครั้ง'
      );
    } finally {
      setIsConfirming(false);
      processingRef.current = false;
    }
  };

  const handleReset = () => {
    setCheckResult(null);
    setConfirmError('');
    setManualCode('');
  };

  if (eventsLoading) {
    return <FeedbackState type="loading" title="กำลังโหลดรายการงาน..." />;
  }

  if (eventsError) {
    return (
      <FeedbackState
        type="error"
        title="ไม่สามารถโหลดข้อมูลงานได้"
        message={eventsError.message}
        onAction={refetchEvents}
      />
    );
  }

  const eventEnded = selectedEvent ? hasEventEnded(selectedEvent) : false;
  const scannerLocked =
    isVerifying || isConfirming || Boolean(checkResult && checkResult.canConfirm);

  return (
    <div className="page-stack">
      <div className="breadcrumb-row">
        <Link to="/staff" className="link-back">
          <Icon name="chevronLeft" size={15} />
          <span>กลับไปหน้ารายการงานเช็กอิน</span>
        </Link>
        {selectedEventId && (
          <button type="button" className="btn btn--ghost btn--xs" onClick={pollRefresh}>
            <Icon name="refresh" size={14} />
            <span>อัปเดตยอดเข้างาน</span>
          </button>
        )}
      </div>

      <div className="page-header">
        <div>
          <h1>ตรวจสอบบัตรและยืนยันเช็กอิน</h1>
          <p className="page-header__subtitle">
            เลือกงานก่อนตรวจบัตร รองรับทั้งการสแกน QR ด้วยกล้องและการกรอกรหัสบัตร TKT-... ด้วยตนเอง
          </p>
        </div>
      </div>

      <section className="card event-selector-bar">
        <div className="form-field">
          <label htmlFor="staff-event-select" className="field-label">
            1. เลือกงานที่กำลังเปิดจุดเช็กอิน <span className="required-mark">*</span>
          </label>
          <select
            id="staff-event-select"
            className="select"
            value={selectedEvent?.id || ''}
            onChange={(e) => handleEventChange(e.target.value)}
            disabled={isVerifying || isConfirming}
          >
            <option value="">-- กรุณาเลือกงานก่อนตรวจสอบบัตร --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.status === 'closed' ? 'Closed' : 'Published'}
                {hasEventEnded(ev) ? ' • จบงานแล้ว' : ''})
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="selected-event-banner">
            <div className="badge-row">
              <StatusBadge type={selectedEvent.eventType} />
              <StatusBadge type={selectedEvent.status} />
              <StatusBadge type={selectedEvent.registrationMode} />
              {eventEnded && (
                <span className="badge badge--danger">
                  <Icon name="clock" size={12} />
                  <span>เลยเวลาจบงานแล้ว</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted icon-meta-wrap">
              <span className="icon-text">
                <Icon name="calendar" size={14} />
                <span>{formatEventTimeRange(selectedEvent.startsAt, selectedEvent.endsAt)}</span>
              </span>
              <span className="meta-dot" aria-hidden="true">•</span>
              <span className="icon-text">
                <Icon name="pin" size={14} />
                <span>{selectedEvent.venue}</span>
              </span>
            </p>
          </div>
        )}
      </section>

      {selectedEventId && !selectedEvent && (
        <FeedbackState type="empty" compact title="งานนี้ไม่พร้อมสำหรับบัญชีของคุณ" />
      )}

      {selectedEvent && (
        <>
          {statsError && (
            <div className="alert alert--danger" role="alert">
              โหลดจำนวนผู้เข้างานไม่สำเร็จ: {statsError.message}{' '}
              <button
                type="button"
                className="btn btn--secondary btn--xs"
                onClick={refetchStats}
              >
                ลองใหม่
              </button>
            </div>
          )}

          <section className="stats-grid" aria-label="ยอดเช็กอินของงานที่เลือก">
            <StatCard
              label="ผู้เช็กอินแล้ว (Used)"
              value={statsLoading || statsError ? '—' : stats.usedCount}
              sublabel={`อัตราเช็กอิน ${stats.checkInRate}%`}
              tone="success"
            />
            <StatCard
              label="ผู้มีสิทธิ์ทั้งหมด (Valid + Used)"
              value={statsLoading || statsError ? '—' : stats.activeCount}
              sublabel={`ยังรอเช็กอิน (Valid): ${stats.validCount} คน`}
              tone="accent"
            />
            <StatCard
              label="บัตรที่ยกเลิก (Cancelled)"
              value={statsLoading || statsError ? '—' : stats.cancelledCount}
              tone="muted"
            />
            <StatCard
              label="ที่ว่างคงเหลือ"
              value={statsLoading || statsError ? '—' : stats.remainingLabel}
            />
          </section>
        </>
      )}

      <div className="checkin-workspace">
        <div className="checkin-workspace__inputs">
          <section className="card">
            <QRScanner
              disabled={!selectedEvent}
              locked={scannerLocked}
              onScan={(decodedText) => runVerification(decodedText)}
            />
          </section>

          <section className="card">
            <h3 className="manual-checkin__title">กรอกรหัสบัตรด้วยตนเอง (Manual Entry)</h3>
            <p className="text-muted text-sm">
              ใช้แทนกล้องได้ทุกเมื่อเมื่อไม่ได้เปิดกล้องหรือกล้องใช้งานไม่ได้ ระบบจะตัดช่องว่างหัวท้ายให้อัตโนมัติ
            </p>

            <form className="manual-checkin__form" onSubmit={handleManualSubmit}>
              <label htmlFor="manual-ticket-code" className="field-label">
                รหัสบัตร
              </label>
              <div className="manual-checkin__row">
                <input
                  id="manual-ticket-code"
                  type="text"
                  className="input"
                  placeholder="วางหรือพิมพ์รหัส TKT-..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={!selectedEvent || isVerifying || isConfirming}
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={!selectedEvent || isVerifying || isConfirming}
                >
                  {isVerifying ? 'กำลังตรวจ...' : 'ตรวจสอบบัตร'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="checkin-workspace__result">
          {isVerifying ? (
            <div className="card">
              <FeedbackState type="loading" compact title="กำลังตรวจสอบสถานะบัตรกับ API..." />
            </div>
          ) : checkResult && selectedEvent ? (
            <CheckInResult
              result={checkResult}
              isConfirming={isConfirming}
              confirmError={confirmError}
              onConfirm={handleConfirmCheckIn}
              onReset={handleReset}
            />
          ) : (
            <div className="card checkin-empty-panel">
              <span className="checkin-empty-panel__icon" aria-hidden="true">
                <Icon name="ticket" size={30} />
              </span>
              <h3>พร้อมตรวจสอบบัตรเข้างาน</h3>
              <p className="text-muted">
                {selectedEvent
                  ? 'สแกน QR จากบัตรของผู้เข้าร่วม หรือกรอกรหัสบัตรด้านซ้ายเพื่อตรวจสอบสิทธิ์ก่อนกด Confirm check-in'
                  : 'เริ่มต้นด้วยการเลือกงานจากรายการด้านบนก่อนตรวจสอบบัตร'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
