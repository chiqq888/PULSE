const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function isValidPosterUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return true;
  return (
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  );
}

export function validateRegistrationForm({
  attendeeName,
  attendeeEmail,
  event,
  selectedSeatId,
}) {
  const errors = {};
  const trimmedName = String(attendeeName || '').trim();
  const normalizedEmail = normalizeEmail(attendeeEmail);

  if (!trimmedName) {
    errors.attendeeName = 'กรุณากรอกชื่อ-นามสกุลผู้เข้าร่วม';
  } else if (trimmedName.length < 2) {
    errors.attendeeName = 'ชื่อผู้เข้าร่วมต้องมีอย่างน้อย 2 ตัวอักษร';
  } else if (trimmedName.length > 120) {
    errors.attendeeName = 'ชื่อผู้เข้าร่วมต้องมีไม่เกิน 120 ตัวอักษร';
  }

  if (!normalizedEmail) {
    errors.attendeeEmail = 'กรุณากรอกอีเมล';
  } else if (!isValidEmail(normalizedEmail)) {
    errors.attendeeEmail = 'รูปแบบอีเมลไม่ถูกต้อง (ตัวอย่าง: name@example.com)';
  }

  if (event?.registrationMode === 'seated' && !selectedSeatId) {
    errors.seatId = 'กรุณาเลือกที่นั่งบนผัง 1 ที่นั่งก่อนยืนยัน';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      attendeeName: trimmedName,
      attendeeEmail: normalizedEmail,
      seatId: event?.registrationMode === 'seated' ? selectedSeatId : null,
    },
  };
}

export function validateEventDraft(data) {
  const errors = {};

  if (!String(data.title || '').trim()) {
    errors.title = 'กรุณากรอกชื่องาน';
  }

  if (!['event', 'concert'].includes(data.eventType)) {
    errors.eventType = 'ประเภทงานต้องเป็น Event หรือ Concert';
  }

  if (!['unlimited', 'limited', 'seated'].includes(data.registrationMode)) {
    errors.registrationMode = 'รูปแบบการรับคนไม่ถูกต้อง';
  }

  if (data.posterUrl && !isValidPosterUrl(data.posterUrl)) {
    errors.posterUrl = 'ใช้เส้นทาง /images/... หรือ URL ที่ขึ้นต้นด้วย http:// หรือ https://';
  }

  if (data.startsAt && data.endsAt) {
    const startMs = new Date(data.startsAt).getTime();
    const endMs = new Date(data.endsAt).getTime();
    if (Number.isNaN(startMs)) {
      errors.startsAt = 'รูปแบบวันเวลาเริ่มไม่ถูกต้อง';
    }
    if (Number.isNaN(endMs)) {
      errors.endsAt = 'รูปแบบวันเวลาสิ้นสุดไม่ถูกต้อง';
    }
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs <= startMs) {
      errors.endsAt = 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มงาน';
    }
  }

  if (data.registrationMode === 'limited' && data.capacity !== '' && data.capacity !== null && data.capacity !== undefined) {
    const num = Number(data.capacity);
    if (!Number.isInteger(num) || num < 1) {
      errors.capacity = 'จำนวนที่รับต้องเป็นจำนวนเต็มมากกว่า 0';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateEventForPublish(event) {
  const errors = {};

  if (!String(event?.title || '').trim()) {
    errors.title = 'ต้องระบุชื่องาน';
  }
  if (!String(event?.description || '').trim()) {
    errors.description = 'ต้องระบุรายละเอียดงาน';
  }
  if (!['event', 'concert'].includes(event?.eventType)) {
    errors.eventType = 'ต้องเลือกประเภทงาน (Event หรือ Concert)';
  }
  if (!String(event?.categoryId || '').trim()) {
    errors.categoryId = 'ต้องเลือกหมวดหมู่งาน';
  }
  if (!String(event?.organizerName || '').trim()) {
    errors.organizerName = 'ต้องระบุชื่อผู้จัดงาน';
  }
  if (!String(event?.venue || '').trim()) {
    errors.venue = 'ต้องระบุสถานที่จัดงาน';
  }
  if (event?.posterUrl && !isValidPosterUrl(event.posterUrl)) {
    errors.posterUrl = 'รูปแบบเส้นทางโปสเตอร์ไม่ถูกต้อง';
  }

  const startMs = event?.startsAt ? new Date(event.startsAt).getTime() : Number.NaN;
  const endMs = event?.endsAt ? new Date(event.endsAt).getTime() : Number.NaN;

  if (!event?.startsAt || Number.isNaN(startMs)) {
    errors.startsAt = 'ต้องระบุวันเวลาเริ่มงาน';
  }
  if (!event?.endsAt || Number.isNaN(endMs)) {
    errors.endsAt = 'ต้องระบุวันเวลาสิ้นสุดงาน';
  } else if (!Number.isNaN(startMs) && endMs <= startMs) {
    errors.endsAt = 'วันเวลาสิ้นสุดต้องอยู่หลังวันเวลาเริ่มงาน';
  }

  if (!['unlimited', 'limited', 'seated'].includes(event?.registrationMode)) {
    errors.registrationMode = 'ต้องเลือกรูปแบบการลงทะเบียน';
  } else if (event.registrationMode === 'limited') {
    const cap = Number(event.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      errors.capacity = 'งานแบบจำกัดจำนวนต้องกำหนดความจุเป็นจำนวนเต็มมากกว่า 0';
    }
  } else if (event.registrationMode === 'seated') {
    const seats = Array.isArray(event.seats) ? event.seats : [];
    if (seats.length === 0) {
      errors.seats = 'งานแบบเลือกที่นั่งต้องเลือกผังที่นั่งก่อนเผยแพร่';
    } else {
      const ids = new Set(seats.map((s) => s.id));
      if (ids.size !== seats.length) {
        errors.seats = 'พบรหัสที่นั่งซ้ำภายในผังงานเดียวกัน';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingList: Object.values(errors),
  };
}
