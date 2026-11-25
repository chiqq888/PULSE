import { useEffect, useRef, useState } from 'react';
import { FeedbackState } from '../../components/FeedbackState';
import { addEventStaff, getEventStaff } from '../../services/staffService';

export function EventStaffPanel({ eventId, refreshVersion }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const addButton = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');

    async function loadStaff() {
      try {
        const members = await getEventStaff(eventId, { signal: controller.signal });
        if (!controller.signal.aborted) setStaff(members);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadStaff();
    return () => controller.abort();
  }, [eventId, refreshVersion, requestVersion]);

  function closeForm() {
    setAdding(false);
    setEmail('');
    setSaveError('');
    addButton.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    const staffEmail = email.trim();

    try {
      await addEventStaff(eventId, staffEmail);
      setSuccess(`${staffEmail} มีสิทธิ์เช็กอินงานนี้แล้ว`);
      setRequestVersion((version) => version + 1);
      closeForm();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card page-stack-sm" aria-labelledby="event-staff-title">
      <div className="page-header">
        <div>
          <h2 id="event-staff-title" className="section-title">Staff ประจำงาน</h2>
          <p className="text-muted text-sm">Staff ในรายการนี้ตรวจบัตรและเช็กอินผู้เข้าร่วมงานนี้ได้</p>
        </div>
        <button
          ref={addButton}
          type="button"
          className="btn btn--primary btn--sm"
          aria-expanded={adding}
          onClick={() => {
            setSuccess('');
            setAdding(true);
          }}
        >
          + เพิ่ม Staff
        </button>
      </div>

      {adding && (
        <form className="event-staff-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label" htmlFor="event-staff-email">อีเมลบัญชี Staff ที่แอดมินสร้างให้</label>
            <input
              id="event-staff-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="off"
              maxLength={254}
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
              placeholder="name@example.com"
            />
          </div>
          <div className="page-header__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'กำลังเพิ่ม…' : 'ยืนยันเพิ่ม Staff'}
            </button>
            <button type="button" className="btn btn--secondary" onClick={closeForm} disabled={saving}>
              ยกเลิก
            </button>
          </div>
          {saveError && <p className="field-error event-staff-form__error" role="alert">{saveError}</p>}
        </form>
      )}

      {success && <p className="alert alert--success" role="status">{success}</p>}

      {loading ? (
        <FeedbackState type="loading" compact title="กำลังโหลดรายชื่อ Staff…" />
      ) : loadError ? (
        <FeedbackState
          type="error"
          compact
          title="โหลดรายชื่อ Staff ไม่สำเร็จ"
          message={loadError}
          onAction={() => setRequestVersion((version) => version + 1)}
        />
      ) : staff.length === 0 ? (
        <FeedbackState type="empty" compact title="ยังไม่มี Staff สำหรับงานนี้" />
      ) : (
        <div className="table-scroll" role="region" aria-label="รายชื่อ Staff ประจำงาน">
          <table className="data-table event-staff-table">
            <thead>
              <tr>
                <th scope="col">ชื่อ</th>
                <th scope="col">อีเมล</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.full_name || '–'}</strong></td>
                  <td>{member.email || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
