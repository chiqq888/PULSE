import { StatusBadge } from './StatusBadge';
import { formatBangkokDateTime } from '../utils/dateUtils';

const OUTCOME_TONE = {
  READY: 'ready',
  CHECKED_IN_SUCCESS: 'success',
  ALREADY_USED: 'warning',
  CANCELLED: 'danger',
  WRONG_EVENT: 'danger',
  NOT_FOUND: 'danger',
  EVENT_ENDED: 'warning',
  EVENT_NOT_OPEN: 'warning',
  API_ERROR: 'danger',
};

const OUTCOME_ICON = {
  READY: '✓',
  CHECKED_IN_SUCCESS: '★',
  ALREADY_USED: '!',
  CANCELLED: '✕',
  WRONG_EVENT: '⇄',
  NOT_FOUND: '?',
  EVENT_ENDED: '⏱',
  EVENT_NOT_OPEN: '✎',
  API_ERROR: '⚠',
};

export function CheckInResult({
  result,
  isConfirming = false,
  confirmError = '',
  onConfirm,
  onReset,
}) {
  if (!result) return null;

  const tone = OUTCOME_TONE[result.outcome] || 'warning';
  const icon = OUTCOME_ICON[result.outcome] || '•';
  const { ticket, seat } = result;

  return (
    <section
      className={`checkin-result checkin-result--${tone}`}
      aria-live="polite"
      aria-label="ผลการตรวจสอบบัตร"
    >
      <div className="checkin-result__header">
        <span className="checkin-result__icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3 className="checkin-result__title">{result.title}</h3>
          <p className="checkin-result__message">{result.message}</p>
        </div>
      </div>

      {ticket && (
        <dl className="checkin-result__details">
          <div>
            <dt>ผู้เข้าร่วม</dt>
            <dd>
              <strong>{ticket.attendeeName}</strong>
            </dd>
          </div>
          <div>
            <dt>อีเมล</dt>
            <dd>{ticket.attendeeEmail}</dd>
          </div>
          <div>
            <dt>รหัสบัตร</dt>
            <dd>
              <code>{ticket.id}</code>
            </dd>
          </div>
          <div>
            <dt>สถานะบัตร</dt>
            <dd>
              <StatusBadge type={ticket.status} />
            </dd>
          </div>
          {ticket.seatId && (
            <div>
              <dt>ที่นั่ง</dt>
              <dd>
                <strong>
                  {seat ? `${seat.label} (Zone ${seat.zone}, แถว ${seat.row})` : ticket.seatId}
                </strong>
              </dd>
            </div>
          )}
          {ticket.checkedInAt && (
            <div>
              <dt>เวลาเช็กอิน</dt>
              <dd>{formatBangkokDateTime(ticket.checkedInAt)}</dd>
            </div>
          )}
          {ticket.cancelledAt && (
            <div>
              <dt>เวลายกเลิก</dt>
              <dd>{formatBangkokDateTime(ticket.cancelledAt)}</dd>
            </div>
          )}
        </dl>
      )}

      {confirmError && (
        <div className="alert alert--danger" role="alert">
          {confirmError}
        </div>
      )}

      <div className="checkin-result__actions">
        {result.canConfirm && (
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'กำลังบันทึกเช็กอิน...' : 'Confirm check-in'}
          </button>
        )}
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onReset}
          disabled={isConfirming}
        >
          ตรวจบัตรใบถัดไป
        </button>
      </div>
    </section>
  );
}
