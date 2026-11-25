export function FeedbackState({
  type = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}) {
  if (type === 'loading') {
    return (
      <div
        className={`feedback-state feedback-state--loading ${compact ? 'feedback-state--compact' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="spinner" aria-hidden="true" />
        <p className="feedback-state__title">{title || 'กำลังโหลดข้อมูล...'}</p>
        {message && <p className="feedback-state__message">{message}</p>}
      </div>
    );
  }

  const isError = type === 'error';

  return (
    <div
      className={`feedback-state feedback-state--${type} ${compact ? 'feedback-state--compact' : ''}`}
      role={isError ? 'alert' : 'status'}
    >
      <div className="feedback-state__icon" aria-hidden="true">
        {isError ? '!' : '○'}
      </div>
      <h3 className="feedback-state__title">
        {title || (isError ? 'ไม่สามารถโหลดข้อมูลได้' : 'ไม่พบข้อมูล')}
      </h3>
      {message && <p className="feedback-state__message">{message}</p>}
      {(onAction || onSecondaryAction) && (
        <div className="feedback-state__actions">
          {onAction && (
            <button
              type="button"
              className={isError ? 'btn btn--primary' : 'btn btn--secondary'}
              onClick={onAction}
            >
              {actionLabel || (isError ? 'ลองใหม่อีกครั้ง (Retry)' : 'ดำเนินการ')}
            </button>
          )}
          {onSecondaryAction && (
            <button type="button" className="btn btn--ghost" onClick={onSecondaryAction}>
              {secondaryActionLabel || 'กลับ'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
