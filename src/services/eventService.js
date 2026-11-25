import { ApiError, queryDatabaseRecord, queryDatabaseRows } from './apiClient';
import { getSupabase } from './supabaseClient';
import { generateEventId } from '../utils/idUtils';
import { cloneSeatsFromTemplate } from '../utils/seatTemplates';
import { validateEventDraft, validateEventForPublish } from '../utils/validation';

function normalizeRegistrationFields(formData) {
  if (formData.registrationMode === 'seated') {
    const templateId = formData.seatTemplateId || null;
    const existingSeats = Array.isArray(formData.seats) ? formData.seats : [];
    return {
      registrationMode: 'seated',
      capacity: null,
      seatTemplateId: templateId,
      seats: existingSeats.length ? existingSeats : cloneSeatsFromTemplate(templateId),
    };
  }

  const limited = formData.registrationMode === 'limited';
  return {
    registrationMode: limited ? 'limited' : 'unlimited',
    capacity: limited && formData.capacity ? Number(formData.capacity) : null,
    seatTemplateId: null,
    seats: [],
  };
}

export async function getEvents({ signal, scope = 'public', userId } = {}) {
  const client = getSupabase();
  const buildQuery = () => {
    const events = client.from('events');
    if (scope === 'organizer') return events.select('*').eq('owner_id', userId).order('id');
    if (scope === 'staff') {
      return events
        .select('*, staff_event_assignments!inner(staff_id)')
        .eq('staff_event_assignments.staff_id', userId)
        .in('status', ['published', 'closed'])
        .order('id');
    }
    return events.select('*').in('status', ['published', 'closed']).order('id');
  };
  return queryDatabaseRows(buildQuery, { signal });
}

export async function getEventById(eventId, { signal, scope = 'public', userId } = {}) {
  let query = getSupabase().from('events').select('*').eq('id', eventId);
  if (scope === 'organizer') {
    query = query.eq('owner_id', userId);
  } else {
    query = query.in('status', ['published', 'closed']);
  }
  return queryDatabaseRecord(query, { signal });
}

function getEventFields(formData) {
  return {
    title: String(formData.title || '').trim(),
    description: String(formData.description || '').trim(),
    eventType: formData.eventType || 'event',
    categoryId: String(formData.categoryId || '').trim() || null,
    organizerName: String(formData.organizerName || '').trim(),
    venue: String(formData.venue || '').trim(),
    startsAt: formData.startsAt || null,
    endsAt: formData.endsAt || null,
    posterUrl: String(formData.posterUrl || '').trim(),
    ...normalizeRegistrationFields(formData),
  };
}

function getOrganizerEvent(eventId, userId) {
  return getEventById(eventId, { scope: 'organizer', userId });
}

function updateEventRecord(event, fields) {
  const query = getSupabase()
    .from('events')
    .update(fields)
    .eq('id', event.id)
    .eq('owner_id', event.owner_id)
    .eq('status', event.status)
    .select();
  return queryDatabaseRecord(query, { mutation: true });
}

function validateDraftOrThrow(formData) {
  const validation = validateEventDraft(formData);
  if (!validation.isValid) {
    throw new ApiError('ข้อมูลฟอร์มไม่ถูกต้อง กรุณาตรวจสอบช่องที่มีข้อความแจ้งเตือน', {
      code: 'VALIDATION_ERROR',
      details: validation.errors,
    });
  }
}

function validatePublishOrThrow(event) {
  const validation = validateEventForPublish(event);
  if (!validation.isValid) {
    throw new ApiError(
      `ยังไม่สามารถเผยแพร่งานได้ เนื่องจากข้อมูลไม่ครบถ้วน (${validation.missingList.length} รายการ)`,
      { code: 'PUBLISH_VALIDATION_ERROR', details: validation.errors }
    );
  }
}

export async function createEvent(formData, { publish = false } = {}) {
  validateDraftOrThrow(formData);
  const fields = getEventFields(formData);
  if (publish) validatePublishOrThrow(fields);

  const payload = { id: generateEventId(), ...fields, status: publish ? 'published' : 'draft' };
  return queryDatabaseRecord(getSupabase().from('events').insert(payload).select(), { mutation: true });
}

export async function updateEvent(eventId, formData, userId, { publish = false } = {}) {
  const existing = await getOrganizerEvent(eventId, userId);
  if (existing.status === 'draft') {
    validateDraftOrThrow(formData);
    const fields = getEventFields(formData);
    if (publish) {
      validatePublishOrThrow(fields);
      fields.status = 'published';
    }
    return updateEventRecord(existing, fields);
  }

  if (publish) {
    throw new ApiError('สามารถเผยแพร่ได้เฉพาะงานที่อยู่ในสถานะ Draft เท่านั้น', {
      code: 'INVALID_STATUS',
    });
  }

  const errors = {};
  const title = String(formData.title || '').trim();
  const description = String(formData.description || '').trim();
  const posterUrl = String(formData.posterUrl || '').trim();
  if (!title) errors.title = 'กรุณากรอกชื่องาน';
  if (!description) errors.description = 'กรุณากรอกรายละเอียดงาน';
  if (
    posterUrl &&
    !posterUrl.startsWith('/images/') &&
    !posterUrl.startsWith('http://') &&
    !posterUrl.startsWith('https://')
  ) {
    errors.posterUrl = 'ใช้เส้นทาง /images/... หรือ URL ที่ขึ้นต้นด้วย http:// หรือ https://';
  }

  if (Object.keys(errors).length) {
    throw new ApiError('ข้อมูลที่แก้ไขไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', {
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }
  return updateEventRecord(existing, { title, description, posterUrl });
}

export async function publishEvent(eventId, userId) {
  const existing = await getOrganizerEvent(eventId, userId);
  if (existing.status !== 'draft') {
    throw new ApiError('สามารถเผยแพร่ได้เฉพาะงานที่อยู่ในสถานะ Draft เท่านั้น', {
      code: 'INVALID_STATUS',
    });
  }

  validatePublishOrThrow(existing);
  return updateEventRecord(existing, { status: 'published' });
}

export async function closeEvent(eventId, userId) {
  const existing = await getOrganizerEvent(eventId, userId);
  if (existing.status !== 'published') {
    throw new ApiError('สามารถปิดรับลงทะเบียนได้เฉพาะงานที่เผยแพร่แล้วเท่านั้น', {
      code: 'INVALID_STATUS',
    });
  }
  return updateEventRecord(existing, { status: 'closed' });
}

export async function deleteDraftEvent(eventId, userId) {
  const existing = await getOrganizerEvent(eventId, userId);
  if (existing.status !== 'draft') {
    throw new ApiError('ลบได้เฉพาะงานฉบับร่าง งานที่เผยแพร่แล้วสามารถปิดรับลงทะเบียนได้', {
      code: 'DELETE_NOT_ALLOWED',
    });
  }

  const query = getSupabase().from('events').delete()
    .eq('id', eventId)
    .eq('owner_id', userId)
    .eq('status', 'draft')
    .select('id');
  const deleted = await queryDatabaseRecord(query, { mutation: true });
  return { deletedId: deleted.id };
}
