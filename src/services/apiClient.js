export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', isAmbiguous = false, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isAmbiguous = isAmbiguous;
    this.details = details;
  }
}

const errorMessages = {
  AUTH_REQUIRED: 'กรุณาเข้าสู่ระบบก่อนทำรายการ',
  FORBIDDEN: 'คุณไม่มีสิทธิ์ทำรายการนี้',
  '42501': 'คุณไม่มีสิทธิ์ทำรายการนี้',
  EVENT_NOT_FOUND: 'ไม่พบงานที่ต้องการ',
  EVENT_NOT_OPEN: 'งานนี้ยังไม่เปิดรับลงทะเบียนหรือปิดรับลงทะเบียนแล้ว',
  EVENT_STARTED: 'งานนี้ถึงเวลาเริ่มแล้ว ไม่สามารถลงทะเบียนเพิ่มได้',
  INVALID_TICKET_ID: 'รหัสบัตรไม่ถูกต้อง กรุณาลองอีกครั้ง',
  INVALID_ATTENDEE_NAME: 'กรุณาระบุชื่อผู้เข้าร่วม 2–120 ตัวอักษร',
  INVALID_ACCOUNT_EMAIL: 'บัญชีนี้ไม่มีอีเมลสำหรับออกบัตร',
  DUPLICATE_EMAIL: 'อีเมลนี้มีบัตรที่ใช้งานอยู่สำหรับงานนี้แล้ว',
  DUPLICATE_REGISTRATION: 'บัญชีนี้มีบัตรที่ใช้งานอยู่สำหรับงานนี้แล้ว',
  EVENT_FULL: 'ขออภัย จำนวนผู้ลงทะเบียนเต็มแล้ว',
  INVALID_SEAT: 'ไม่พบที่นั่งที่เลือก กรุณาเลือกใหม่',
  SEAT_TAKEN: 'ที่นั่งนี้มีผู้ลงทะเบียนแล้ว กรุณาเลือกที่นั่งอื่น',
  TICKET_ID_CONFLICT: 'รหัสบัตรนี้ถูกใช้แล้ว กรุณาลองอีกครั้ง',
  NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
  ALREADY_CANCELLED: 'บัตรนี้ถูกยกเลิกไปแล้ว',
  TICKET_ALREADY_USED: 'ไม่สามารถยกเลิกบัตรที่เช็กอินแล้วได้',
  EVENT_ALREADY_STARTED: 'ไม่สามารถยกเลิกบัตรได้ เนื่องจากถึงเวลาเริ่มงานแล้ว',
  INVALID_STATUS: 'สถานะงานเปลี่ยนไปแล้ว กรุณารีเฟรชรายการงาน',
  PUBLISHED_FIELDS_LOCKED: 'เปลี่ยนได้เฉพาะชื่อ รายละเอียด และโปสเตอร์ของงานที่เผยแพร่แล้ว',
  '23503': 'ไม่สามารถทำรายการได้ เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
};

export function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ABORTED';
}

export async function queryDatabase(query, { signal, mutation = false } = {}) {
  const controller = new AbortController();
  const abortQuery = () => controller.abort();
  if (signal?.aborted) abortQuery();
  signal?.addEventListener('abort', abortQuery, { once: true });
  const timeout = setTimeout(abortQuery, 12000);

  try {
    const result = await query.abortSignal(controller.signal);
    if (result.error) {
      const { error, status } = result;
      const code = Object.hasOwn(errorMessages, error.message) ? error.message : error.code;
      const unreachable = status === 0 || status >= 500;
      if (unreachable) throw error;

      throw new ApiError(
        errorMessages[code] || 'เกิดข้อผิดพลาดในการเข้าถึงฐานข้อมูล กรุณาลองใหม่',
        { code, status }
      );
    }
    return result.data;
  } catch (error) {
    if (signal?.aborted) {
      throw new ApiError('ยกเลิกคำขอแล้ว', { code: 'ABORTED' });
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่', {
      code: 'NETWORK_ERROR',
      isAmbiguous: mutation,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortQuery);
  }
}

export async function queryDatabaseRows(buildQuery, options) {
  const pageSize = 500;
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const nextRows = await queryDatabase(buildQuery().range(offset, offset + pageSize - 1), options);
    rows.push(...nextRows);
    if (nextRows.length < pageSize) return rows;
  }
}

export async function queryDatabaseRecord(query, options) {
  const row = await queryDatabase(query.maybeSingle(), options);
  if (!row) throw new ApiError(errorMessages.NOT_FOUND, { code: 'NOT_FOUND', status: 404 });
  return row;
}
