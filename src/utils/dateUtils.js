export const DISPLAY_TIMEZONE = 'Asia/Bangkok';

function toValidDate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBangkokDate(isoString) {
  const date = toValidDate(isoString);
  if (!date) return 'ยังไม่ระบุวันที่';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: DISPLAY_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatBangkokTime(isoString) {
  const date = toValidDate(isoString);
  if (!date) return '--:--';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: DISPLAY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatBangkokDateTime(isoString) {
  const date = toValidDate(isoString);
  if (!date) return 'ยังไม่ระบุวันเวลา';
  return `${formatBangkokDate(isoString)} · ${formatBangkokTime(isoString)} ICT`;
}

export function formatEventTimeRange(startsAt, endsAt) {
  const startDate = toValidDate(startsAt);
  const endDate = toValidDate(endsAt);
  if (!startDate && !endDate) return 'ยังไม่กำหนดวันเวลา';
  if (!startDate) return `สิ้นสุด ${formatBangkokDateTime(endsAt)}`;
  if (!endDate) return `เริ่ม ${formatBangkokDateTime(startsAt)}`;

  const startDayKey = getBangkokDateKey(startsAt);
  const endDayKey = getBangkokDateKey(endsAt);

  if (startDayKey === endDayKey) {
    return `${formatBangkokDate(startsAt)} · ${formatBangkokTime(startsAt)}–${formatBangkokTime(endsAt)} ICT`;
  }

  return `${formatBangkokDate(startsAt)} ${formatBangkokTime(startsAt)} – ${formatBangkokDate(endsAt)} ${formatBangkokTime(endsAt)} ICT`;
}

export function formatEventDateShort(startsAt, endsAt) {
  const startDate = toValidDate(startsAt);
  const endDate = toValidDate(endsAt);
  if (!startDate && !endDate) return 'ยังไม่กำหนดวันเวลา';
  if (!startDate) return formatBangkokDateTime(endsAt);
  if (!endDate) return formatBangkokDateTime(startsAt);

  const startDayKey = getBangkokDateKey(startsAt);
  const endDayKey = getBangkokDateKey(endsAt);

  if (startDayKey === endDayKey) {
    return `${formatBangkokDate(startsAt)} · ${formatBangkokTime(startsAt)}–${formatBangkokTime(endsAt)} ICT`;
  }

  return `${formatBangkokDate(startsAt)} – ${formatBangkokDate(endsAt)} ICT`;
}

export function getBangkokDateKey(isoString) {
  const date = toValidDate(isoString);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : '';
}

export function isoToBangkokInputValue(isoString) {
  const date = toValidDate(isoString);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

export function bangkokInputValueToIso(inputValue) {
  if (!inputValue || typeof inputValue !== 'string') return '';
  const trimmed = inputValue.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00+07:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}+07:00`;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function hasEventStarted(event, now = Date.now()) {
  const start = toValidDate(event?.startsAt);
  if (!start) return false;
  return now >= start.getTime();
}

export function hasEventEnded(event, now = Date.now()) {
  const end = toValidDate(event?.endsAt);
  if (!end) return false;
  return now > end.getTime();
}

export function getTodayBangkokDateKey(now = new Date()) {
  return getBangkokDateKey(now.toISOString());
}
