import { ApiError, queryDatabase, queryDatabaseRecord, queryDatabaseRows } from './apiClient';
import { getEventById } from './eventService';
import { getSupabase } from './supabaseClient';

export async function getOrganizerTickets(userId, { signal } = {}) {
  const client = getSupabase();
  return queryDatabaseRows(
    () => client.from('tickets').select('*, events!inner(owner_id)').eq('events.owner_id', userId).order('id'),
    { signal }
  );
}

export async function getTicketsByEvent(eventId, userId, { signal } = {}) {
  const client = getSupabase();
  return queryDatabaseRows(
    () => client.from('tickets').select('*, events!inner(owner_id)')
      .eq('eventId', eventId).eq('events.owner_id', userId).order('id'),
    { signal }
  );
}

export async function getTicketsByUser(userId, { signal } = {}) {
  const client = getSupabase();
  return queryDatabaseRows(
    () => client.from('tickets').select('*').eq('user_id', userId).order('id'),
    { signal }
  );
}

export async function getTicketById(ticketId, userId, { signal } = {}) {
  const query = getSupabase().from('tickets').select('*').eq('id', ticketId).eq('user_id', userId);
  return queryDatabaseRecord(query, { signal });
}

export async function getEventStats({ scope = 'public', eventId, signal } = {}) {
  const client = getSupabase();
  const procedure = scope === 'staff' ? 'staff_event_stats' : 'event_availability';
  const params = eventId ? { p_event_id: eventId } : {};
  return queryDatabaseRows(() => client.rpc(procedure, params).order('eventId'), { signal });
}

export async function registerForEvent({ ticketId, eventId, attendeeName, seatId }) {
  const query = getSupabase().rpc('register_for_event', {
    p_ticket_id: ticketId,
    p_event_id: eventId,
    p_attendee_name: attendeeName,
    p_seat_id: seatId,
  });

  return queryDatabase(query, { mutation: true });
}

export async function cancelTicket(ticketId) {
  return queryDatabase(getSupabase().rpc('cancel_ticket', { p_ticket_id: ticketId }), {
    mutation: true,
  });
}

const checkInMessages = {
  NO_EVENT_SELECTED: ['ยังไม่ได้เลือกงาน', 'กรุณาเลือกงานที่ต้องการเช็กอินก่อนตรวจสอบบัตร'],
  EMPTY_CODE: ['กรุณากรอกหรือสแกนรหัสบัตร', 'ไม่พบรหัสบัตรสำหรับตรวจสอบ'],
  NOT_FOUND: ['ไม่พบบัตรในระบบ', 'กรุณาตรวจสอบรหัสบัตรแล้วลองอีกครั้ง'],
  WRONG_EVENT: ['บัตรผิดงาน', 'รหัสบัตรนี้ใช้เข้างานที่เลือกไม่ได้'],
  CANCELLED: ['บัตรถูกยกเลิกแล้ว', 'บัตรนี้ใช้เช็กอินเข้างานไม่ได้'],
  ALREADY_USED: ['บัตรถูกใช้เช็กอินไปแล้ว', 'บัตรนี้ผ่านการเช็กอินแล้ว'],
  EVENT_NOT_OPEN: ['งานยังไม่เปิดใช้งาน', 'งานนี้ยังไม่เปิดให้เช็กอิน'],
  EVENT_ENDED: ['งานสิ้นสุดลงแล้ว', 'งานนี้เลยเวลาเช็กอินแล้ว'],
  READY: ['พร้อมเช็กอิน', 'ตรวจสอบชื่อผู้เข้าร่วมแล้วกดยืนยันเช็กอิน'],
  CHECKED_IN_SUCCESS: ['เช็กอินสำเร็จ', 'บันทึกการเข้างานเรียบร้อยแล้ว'],
};

function makeCheckInResult(outcome, ticket = null, event = null) {
  const [title, message] = checkInMessages[outcome];
  const seat = event?.seats?.find((item) => item.id === ticket?.seatId) ?? null;

  return { outcome, canConfirm: outcome === 'READY', title, message, ticket, event, seat };
}

async function loadCheckInResult(procedure, ticketId, eventId, mutation = false) {
  const query = getSupabase().rpc(procedure, { p_ticket_id: ticketId, p_event_id: eventId });
  const { outcome, ticket } = await queryDatabase(query, { mutation });
  if (!Object.hasOwn(checkInMessages, outcome)) {
    throw new ApiError('ฐานข้อมูลส่งผลการตรวจสอบบัตรไม่ถูกต้อง');
  }

  let event = null;
  if (ticket) {
    // The ticket outcome is already decided by the database.
    // Event details help show the seat label but are optional.
    try {
      event = await getEventById(eventId);
    } catch {
      // Preserve the result if the optional event request fails.
    }
  }
  return makeCheckInResult(outcome, ticket, event);
}

export async function verifyTicketForCheckIn(rawCode, selectedEventId) {
  const ticketId = String(rawCode || '').trim();
  if (!selectedEventId) return makeCheckInResult('NO_EVENT_SELECTED');
  if (!ticketId) return makeCheckInResult('EMPTY_CODE');

  try {
    return await loadCheckInResult('verify_ticket_for_check_in', ticketId, selectedEventId);
  } catch (error) {
    return {
      outcome: 'API_ERROR',
      canConfirm: false,
      title: 'ไม่สามารถตรวจสอบบัตรได้',
      message: error.message,
      ticket: null,
      event: null,
      seat: null,
    };
  }
}

export async function confirmCheckIn(ticketId, selectedEventId) {
  const result = await loadCheckInResult('confirm_check_in', ticketId, selectedEventId, true);
  return { success: result.outcome === 'CHECKED_IN_SUCCESS', result };
}
