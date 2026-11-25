export function RegistrationForm({
  event,
  attendeeName,
  attendeeEmail,
  onNameChange,
  selectedSeat,
  fieldErrors = {},
  submitError = null,
  hasPendingRetry = false,
  isSubmitting = false,
  disabled = false,
  disabledReason = '',
  onSubmit,
}) {
  const isSeated = event?.registrationMode === 'seated';

  return (
    <form className="registration-form" onSubmit={onSubmit} noValidate>
      <div className="registration-form__header">
        <div>
          <span className="pill-free">Register for free</span>
          <h2 className="registration-form__title">ลงทะเบียนเข้าร่วมฟรี</h2>
        </div>
        <p className="registration-form__subtitle">
          รับบัตร QR ได้ 1 ใบต่องานผ่านบัญชีของคุณ
        </p>
      </div>

      {disabled && disabledReason && (
        <div className="alert alert--warning" role="status">
          {disabledReason}
        </div>
      )}

      {isSeated && (
        <div className={`selected-seat-box ${fieldErrors.seatId ? 'selected-seat-box--error' : ''}`}>
          <span className="selected-seat-box__label">ที่นั่งที่เลือก</span>
          {selectedSeat ? (
            <strong className="selected-seat-box__value">
              {selectedSeat.label} (Zone {selectedSeat.zone} • แถว {selectedSeat.row})
            </strong>
          ) : (
            <span className="selected-seat-box__placeholder">
              ยังไม่ได้เลือกที่นั่ง - กรุณาคลิกเลือกจากผังที่นั่ง
            </span>
          )}
          {fieldErrors.seatId && (
            <p className="field-error" role="alert">
              {fieldErrors.seatId}
            </p>
          )}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="reg-name" className="field-label">
          ชื่อ-นามสกุลผู้เข้าร่วม <span className="required-mark">*</span>
        </label>
        <input
          id="reg-name"
          name="attendeeName"
          type="text"
          className={`input ${fieldErrors.attendeeName ? 'input--error' : ''}`}
          value={attendeeName}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled || isSubmitting}
          readOnly={hasPendingRetry}
          maxLength={120}
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.attendeeName)}
          aria-describedby={fieldErrors.attendeeName ? 'reg-name-error' : undefined}
        />
        {fieldErrors.attendeeName && (
          <p id="reg-name-error" className="field-error" role="alert">
            {fieldErrors.attendeeName}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="reg-email" className="field-label">
          อีเมลบัญชี
        </label>
        <input
          id="reg-email"
          name="attendeeEmail"
          type="email"
          className={`input ${fieldErrors.attendeeEmail ? 'input--error' : ''}`}
          value={attendeeEmail}
          readOnly
          aria-invalid={Boolean(fieldErrors.attendeeEmail)}
          aria-describedby={fieldErrors.attendeeEmail ? 'reg-email-error' : undefined}
        />
        {fieldErrors.attendeeEmail && (
          <p id="reg-email-error" className="field-error" role="alert">
            {fieldErrors.attendeeEmail}
          </p>
        )}
      </div>

      {submitError && (
        <div className="alert alert--danger" role="alert">
          <strong>ไม่สามารถลงทะเบียนได้:</strong> {submitError}
          {hasPendingRetry && (
            <p className="alert__sub">
              ระบบจะตรวจสอบรหัสบัตรเดิมก่อนส่งซ้ำเมื่อคุณกดลองใหม่ เพื่อลดโอกาสการสร้างบัตรซ้ำ
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="btn btn--primary btn--lg btn--full"
        disabled={disabled || isSubmitting}
      >
        {isSubmitting
          ? 'กำลังตรวจสอบและออกบัตร...'
          : hasPendingRetry
            ? 'ตรวจสอบผลและลองลงทะเบียนใหม่ (Retry)'
            : 'ยืนยันลงทะเบียน'}
      </button>
    </form>
  );
}
