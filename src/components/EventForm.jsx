import { useEffect, useState } from 'react';
import { PosterImage } from './PosterImage';
import { SeatMap } from './SeatMap';
import { StatusBadge } from './StatusBadge';
import {
  SEAT_TEMPLATES,
  cloneSeatsFromTemplate,
} from '../utils/seatTemplates';
import {
  bangkokInputValueToIso,
  isoToBangkokInputValue,
} from '../utils/dateUtils';
import { validateEventDraft, validateEventForPublish } from '../utils/validation';

function buildInitialState(initialEvent) {
  if (!initialEvent) {
    return {
      title: '',
      description: '',
      eventType: 'event',
      categoryId: '',
      organizerName: '',
      venue: '',
      startsAtInput: '',
      endsAtInput: '',
      posterUrl: '',
      registrationMode: 'unlimited',
      capacity: '50',
      seatTemplateId: 'curved-hall',
      seats: [],
    };
  }

  return {
    title: initialEvent.title || '',
    description: initialEvent.description || '',
    eventType: initialEvent.eventType || 'event',
    categoryId: initialEvent.categoryId || '',
    organizerName: initialEvent.organizerName || '',
    venue: initialEvent.venue || '',
    startsAtInput: isoToBangkokInputValue(initialEvent.startsAt),
    endsAtInput: isoToBangkokInputValue(initialEvent.endsAt),
    posterUrl: initialEvent.posterUrl || '',
    registrationMode: initialEvent.registrationMode || 'unlimited',
    capacity:
      initialEvent.capacity !== null && initialEvent.capacity !== undefined
        ? String(initialEvent.capacity)
        : '',
    seatTemplateId: initialEvent.seatTemplateId || 'curved-hall',
    seats: Array.isArray(initialEvent.seats) ? initialEvent.seats : [],
  };
}

export function EventForm({
  mode = 'create',
  initialEvent = null,
  categories = [],
  isSubmitting = false,
  submitError = '',
  serverFieldErrors = null,
  onSave,
  onSaveAndPublish,
  onCancel,
}) {
  const isLocked = mode === 'edit' && initialEvent && initialEvent.status !== 'draft';
  const [form, setForm] = useState(() => buildInitialState(initialEvent));
  const [fieldErrors, setFieldErrors] = useState({});
  const [publishMissing, setPublishMissing] = useState([]);

  useEffect(() => {
    setForm(buildInitialState(initialEvent));
    setFieldErrors({});
    setPublishMissing([]);
  }, [initialEvent]);

  useEffect(() => {
    if (serverFieldErrors && typeof serverFieldErrors === 'object') {
      setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
    }
  }, [serverFieldErrors]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setPublishMissing([]);
  };

  const handleEventTypeChange = (nextType) => {
    if (isLocked) return;
    setForm((prev) => {
      const nextMode =
        nextType === 'concert' && mode === 'create' ? 'seated' : prev.registrationMode;
      const nextTemplateId = prev.seatTemplateId || 'curved-hall';
      return {
        ...prev,
        eventType: nextType,
        registrationMode: nextMode,
        seatTemplateId: nextMode === 'seated' ? nextTemplateId : prev.seatTemplateId,
        seats:
          nextMode === 'seated' ? cloneSeatsFromTemplate(nextTemplateId) : prev.seats,
      };
    });
    setPublishMissing([]);
  };

  const handleModeChange = (nextMode) => {
    if (isLocked) return;
    setForm((prev) => {
      const tplId = prev.seatTemplateId || 'curved-hall';
      return {
        ...prev,
        registrationMode: nextMode,
        seatTemplateId: nextMode === 'seated' ? tplId : prev.seatTemplateId,
        seats: nextMode === 'seated' ? cloneSeatsFromTemplate(tplId) : [],
      };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.capacity;
      delete next.seats;
      return next;
    });
    setPublishMissing([]);
  };

  const handleTemplateChange = (templateId) => {
    if (isLocked) return;
    setForm((prev) => ({
      ...prev,
      seatTemplateId: templateId,
      seats: cloneSeatsFromTemplate(templateId),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.seats;
      return next;
    });
  };

  const buildPayload = () => {
    const startsAt = bangkokInputValueToIso(form.startsAtInput);
    const endsAt = bangkokInputValueToIso(form.endsAtInput);
    const isSeated = form.registrationMode === 'seated';
    const isLimited = form.registrationMode === 'limited';
    const seats = isSeated
      ? form.seats.length > 0
        ? form.seats
        : cloneSeatsFromTemplate(form.seatTemplateId)
      : [];

    return {
      title: form.title,
      description: form.description,
      eventType: form.eventType,
      categoryId: form.categoryId,
      organizerName: form.organizerName,
      venue: form.venue,
      startsAt,
      endsAt,
      posterUrl: form.posterUrl,
      registrationMode: form.registrationMode,
      capacity: isLimited ? (form.capacity === '' ? null : Number(form.capacity)) : null,
      seatTemplateId: isSeated ? form.seatTemplateId : null,
      seats,
    };
  };

  const handleSubmitDraft = (e) => {
    e.preventDefault();
    const payload = buildPayload();

    if (isLocked) {
      const errors = {};
      if (!String(payload.title || '').trim()) errors.title = 'กรุณากรอกชื่องาน';
      if (!String(payload.description || '').trim()) errors.description = 'กรุณากรอกรายละเอียดงาน';
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      onSave?.(payload);
      return;
    }

    const check = validateEventDraft(payload);
    if (!check.isValid) {
      setFieldErrors(check.errors);
      return;
    }

    onSave?.(payload);
  };

  const handlePublishClick = () => {
    const payload = buildPayload();
    const check = validateEventForPublish(payload);
    if (!check.isValid) {
      setFieldErrors(check.errors);
      setPublishMissing(check.missingList);
      return;
    }
    setPublishMissing([]);
    onSaveAndPublish?.(payload);
  };

  const previewSeats =
    form.registrationMode === 'seated'
      ? form.seats.length > 0
        ? form.seats
        : cloneSeatsFromTemplate(form.seatTemplateId)
      : [];

  return (
    <form className="event-form" onSubmit={handleSubmitDraft} noValidate>
      {isLocked && (
        <div className="alert alert--info" role="status">
          <strong>งานนี้เผยแพร่แล้ว ({initialEvent.status}):</strong> เพื่อคงเงื่อนไขของบัตรที่ออกไปแล้ว
          ระบบจะตรึงประเภทงาน วันเวลา สถานที่ รูปแบบลงทะเบียน ความจุ และผังที่นั่งไว้
          คุณยังสามารถแก้ไข <strong>ชื่องาน รายละเอียด และโปสเตอร์</strong> ได้ตามปกติ
        </div>
      )}

      {submitError && (
        <div className="alert alert--danger" role="alert">
          {submitError}
        </div>
      )}

      {publishMissing.length > 0 && (
        <div className="alert alert--warning" role="alert">
          <strong>ยังไม่สามารถเผยแพร่งานได้ กรุณากรอกข้อมูลให้ครบ:</strong>
          <ul className="alert__list">
            {publishMissing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="event-form__grid">
        <section className="card event-form__section">
          <div className="section-heading">
            <h2>1. ข้อมูลทั่วไปของงาน</h2>
            {initialEvent && <StatusBadge type={initialEvent.status} />}
          </div>

          <div className="form-field">
            <label htmlFor="ev-title" className="field-label">
              ชื่องาน <span className="required-mark">*</span>
            </label>
            <input
              id="ev-title"
              type="text"
              className={`input ${fieldErrors.title ? 'input--error' : ''}`}
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="ev-description" className="field-label">
              รายละเอียดงาน <span className="required-mark">* (จำเป็นก่อนเผยแพร่)</span>
            </label>
            <textarea
              id="ev-description"
              rows={4}
              className={`textarea ${fieldErrors.description ? 'input--error' : ''}`}
              placeholder="อธิบายรายละเอียดกิจกรรม ไฮไลต์ ข้อควรรู้สำหรับผู้เข้าร่วม..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.description && (
              <p className="field-error">{fieldErrors.description}</p>
            )}
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ev-type" className="field-label">
                ประเภทงาน {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
              </label>
              <select
                id="ev-type"
                className="select"
                value={form.eventType}
                onChange={(e) => handleEventTypeChange(e.target.value)}
                disabled={isLocked || isSubmitting}
              >
                <option value="event">Event (อีเวนต์ / สัมมนา / ตลาด)</option>
                <option value="concert">Concert (คอนเสิร์ต - ค่าเริ่มต้นแบบเลือกที่นั่ง)</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="ev-category" className="field-label">
                หมวดหมู่ {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
              </label>
              <select
                id="ev-category"
                className={`select ${fieldErrors.categoryId ? 'input--error' : ''}`}
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                disabled={isLocked || isSubmitting}
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <p className="field-error">{fieldErrors.categoryId}</p>
              )}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ev-organizer" className="field-label">
                ชื่อผู้จัดงาน {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
              </label>
              <input
                id="ev-organizer"
                type="text"
                className={`input ${fieldErrors.organizerName ? 'input--error' : ''}`}
                value={form.organizerName}
                onChange={(e) => updateField('organizerName', e.target.value)}
                disabled={isLocked || isSubmitting}
              />
              {fieldErrors.organizerName && (
                <p className="field-error">{fieldErrors.organizerName}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ev-venue" className="field-label">
                สถานที่จัดงาน {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
              </label>
              <input
                id="ev-venue"
                type="text"
                className={`input ${fieldErrors.venue ? 'input--error' : ''}`}
                value={form.venue}
                onChange={(e) => updateField('venue', e.target.value)}
                disabled={isLocked || isSubmitting}
              />
              {fieldErrors.venue && <p className="field-error">{fieldErrors.venue}</p>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ev-starts" className="field-label">
                วันเวลาเริ่มงาน (ICT){' '}
                {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
              </label>
              <input
                id="ev-starts"
                type="datetime-local"
                className={`input ${fieldErrors.startsAt ? 'input--error' : ''}`}
                value={form.startsAtInput}
                onChange={(e) => updateField('startsAtInput', e.target.value)}
                disabled={isLocked || isSubmitting}
              />
              {fieldErrors.startsAt && <p className="field-error">{fieldErrors.startsAt}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="ev-ends" className="field-label">
                วันเวลาสิ้นสุดงาน (ICT){' '}
                {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
              </label>
              <input
                id="ev-ends"
                type="datetime-local"
                className={`input ${fieldErrors.endsAt ? 'input--error' : ''}`}
                value={form.endsAtInput}
                onChange={(e) => updateField('endsAtInput', e.target.value)}
                disabled={isLocked || isSubmitting}
              />
              {fieldErrors.endsAt && <p className="field-error">{fieldErrors.endsAt}</p>}
            </div>
          </div>
        </section>

        <section className="card event-form__section">
          <div className="section-heading">
            <h2>2. โปสเตอร์งาน (Poster Preview)</h2>
          </div>

          <div className="poster-preview-box">
            <PosterImage
              src={form.posterUrl}
              alt={form.title || 'Poster preview'}
              className="poster-preview-box__img"
            />
          </div>

          <div className="form-field">
            <label htmlFor="ev-poster" className="field-label">
              เส้นทางรูปภาพใน public หรือ URL รูปภาพ
            </label>
            <input
              id="ev-poster"
              type="text"
              className={`input ${fieldErrors.posterUrl ? 'input--error' : ''}`}
              placeholder="https://..."
              value={form.posterUrl}
              onChange={(e) => updateField('posterUrl', e.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.posterUrl ? (
              <p className="field-error">{fieldErrors.posterUrl}</p>
            ) : (
              <p className="field-hint">
                ระบบใช้ภาพสำรองเมื่อเว้นช่องนี้ว่างหรือโหลดรูปภาพไม่ได้
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="card event-form__section">
        <div className="section-heading">
          <h2>
            3. รูปแบบการรับผู้เข้าร่วม (เข้าร่วมฟรีทั้งหมด){' '}
            {isLocked && <span className="lock-tag">ตรึงหลังเผยแพร่</span>}
          </h2>
        </div>

        <div className="mode-selector" role="radiogroup" aria-label="รูปแบบการลงทะเบียน">
          {[
            {
              value: 'unlimited',
              title: 'ไม่จำกัดจำนวน (Unlimited)',
              desc: 'ผู้เข้าร่วมใช้บัญชีลงทะเบียนและรับบัตร QR ได้ทันทีเมื่อเปิดรับ',
            },
            {
              value: 'limited',
              title: 'จำกัดจำนวน (Limited Capacity)',
              desc: 'กำหนดเพดานจำนวนผู้เข้าร่วม ตรวจสิทธิ์ว่างก่อนออกบัตร',
            },
            {
              value: 'seated',
              title: 'เลือกที่นั่ง (Seated Map)',
              desc: 'เลือกผังที่นั่งสำเร็จรูปพร้อมโซนและแถว ผู้เข้าร่วมเลือกได้ 1 ที่นั่งต่อบัตร',
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`mode-option ${
                form.registrationMode === option.value ? 'mode-option--active' : ''
              } ${isLocked ? 'mode-option--disabled' : ''}`}
            >
              <input
                type="radio"
                name="registrationMode"
                value={option.value}
                checked={form.registrationMode === option.value}
                onChange={() => handleModeChange(option.value)}
                disabled={isLocked || isSubmitting}
              />
              <div>
                <strong>{option.title}</strong>
                <p>{option.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {form.registrationMode === 'limited' && (
          <div className="form-field form-field--narrow">
            <label htmlFor="ev-capacity" className="field-label">
              จำนวนที่รับสูงสุด (คน) <span className="required-mark">*</span>
            </label>
            <input
              id="ev-capacity"
              type="number"
              min="1"
              step="1"
              className={`input ${fieldErrors.capacity ? 'input--error' : ''}`}
              value={form.capacity}
              onChange={(e) => updateField('capacity', e.target.value)}
              disabled={isLocked || isSubmitting}
            />
            {fieldErrors.capacity && <p className="field-error">{fieldErrors.capacity}</p>}
          </div>
        )}

        {form.registrationMode === 'seated' && (
          <div className="seated-config">
            <div className="form-field">
              <label htmlFor="ev-seat-template" className="field-label">
                เลือกผังที่นั่งสำเร็จรูป <span className="required-mark">*</span>
              </label>
              <select
                id="ev-seat-template"
                className="select"
                value={form.seatTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                disabled={isLocked || isSubmitting}
              >
                {SEAT_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              {fieldErrors.seats && <p className="field-error">{fieldErrors.seats}</p>}
            </div>

            <div className="seated-preview">
              <p className="field-label">
                ผังที่นั่ง ({previewSeats.length} ที่นั่ง)
              </p>
              <SeatMap seats={previewSeats} templateId={form.seatTemplateId} readOnly />
            </div>
          </div>
        )}
      </section>

      <div className="event-form__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          ยกเลิก
        </button>

        <div className="event-form__actions-right">
          <button type="submit" className="btn btn--secondary" disabled={isSubmitting}>
            {isSubmitting
              ? 'กำลังบันทึก...'
              : mode === 'create'
                ? 'บันทึกเป็น Draft'
                : isLocked
                  ? 'บันทึกการแก้ไข'
                  : 'บันทึก Draft'}
          </button>

          {!isLocked && onSaveAndPublish && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handlePublishClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : 'บันทึกและเผยแพร่งาน (Publish)'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
