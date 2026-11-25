import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EventForm } from '../../components/EventForm';
import { FeedbackState } from '../../components/FeedbackState';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { useEvent } from '../../hooks/useEvent';
import { ApiError } from '../../services/apiClient';
import {
  createEvent,
  updateEvent,
} from '../../services/eventService';

export function EventEditorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const {
    event,
    loading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useEvent(isEditMode ? id : '', 'organizer');
  const {
    categories,
    loading: catsLoading,
    error: catsError,
    refetch: refetchCats,
  } = useCategories();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [serverFieldErrors, setServerFieldErrors] = useState(null);

  const handleSave = async (payload) => {
    setIsSubmitting(true);
    setSubmitError('');
    setServerFieldErrors(null);

    try {
      if (isEditMode) {
        const updated = await updateEvent(id, payload, user.id);
        navigate('/org/events', {
          state: { flashMessage: `บันทึกการแก้ไขงาน "${updated.title}" เรียบร้อยแล้ว` },
        });
      } else {
        const created = await createEvent(payload);
        navigate('/org/events', {
          state: {
            flashMessage: `สร้างงานฉบับร่าง (Draft) "${created.title}" สำเร็จแล้ว - ยังไม่แสดงในมุมมอง User จนกว่าจะเผยแพร่`,
          },
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.details && typeof err.details === 'object') {
        setServerFieldErrors(err.details);
      }
      setSubmitError(err?.message || 'ไม่สามารถบันทึกงานได้ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPublish = async (payload) => {
    setIsSubmitting(true);
    setSubmitError('');
    setServerFieldErrors(null);

    try {
      const published = isEditMode
        ? await updateEvent(id, payload, user.id, { publish: true })
        : await createEvent(payload, { publish: true });
      navigate('/org/events', {
        state: {
          flashMessage: `บันทึกและเผยแพร่งาน "${published.title}" เรียบร้อยแล้ว (แสดงในหน้า Explore ทันที)`,
        },
      });
    } catch (err) {
      if (err instanceof ApiError && err.details && typeof err.details === 'object') {
        setServerFieldErrors(err.details);
      }
      setSubmitError(err?.message || 'ไม่สามารถเผยแพร่งานได้ กรุณาตรวจสอบข้อมูลอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (catsLoading || (isEditMode && eventLoading)) {
    return <FeedbackState type="loading" title="กำลังโหลดข้อมูลแบบฟอร์ม..." />;
  }

  if (catsError) {
    return (
      <FeedbackState
        type="error"
        title="ไม่สามารถโหลดหมวดหมู่ได้"
        message={catsError.message}
        onAction={refetchCats}
      />
    );
  }

  if (isEditMode && eventError) {
    return (
      <FeedbackState
        type={eventError instanceof ApiError && eventError.code === 'NOT_FOUND' ? 'empty' : 'error'}
        title={
          eventError instanceof ApiError && eventError.code === 'NOT_FOUND'
            ? 'ไม่พบงานที่ต้องการแก้ไข'
            : 'ไม่สามารถโหลดข้อมูลงานได้'
        }
        message={eventError.message}
        actionLabel={
          eventError instanceof ApiError && eventError.code === 'NOT_FOUND'
            ? 'กลับหน้ารายการงาน'
            : 'ลองใหม่'
        }
        onAction={
          eventError instanceof ApiError && eventError.code === 'NOT_FOUND'
            ? () => navigate('/org/events')
            : refetchEvent
        }
      />
    );
  }

  return (
    <div className="page-stack">
      <div className="breadcrumb-row">
        <Link to="/org/events" className="link-back">
          ← กลับไปรายการงานทั้งหมด
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1>{isEditMode ? `แก้ไขงาน: ${event?.title || ''}` : 'สร้างงานใหม่ (Draft)'}</h1>
          <p className="page-header__subtitle">
            {isEditMode
              ? 'ปรับปรุงรายละเอียดและโปสเตอร์ของงาน'
              : 'กรอกรายละเอียด กำหนดรูปแบบการรับคนหรือเลือกผังที่นั่ง จากนั้นบันทึกเป็น Draft หรือเผยแพร่ทันที'}
          </p>
        </div>
      </div>

      <EventForm
        mode={isEditMode ? 'edit' : 'create'}
        initialEvent={isEditMode ? event : null}
        categories={categories}
        isSubmitting={isSubmitting}
        submitError={submitError}
        serverFieldErrors={serverFieldErrors}
        onSave={handleSave}
        onSaveAndPublish={handleSaveAndPublish}
        onCancel={() => navigate('/org/events')}
      />
    </div>
  );
}
