export const SITE_ORIGIN = 'https://pulse.chiqq888.me';

export const HOME_METADATA = {
  title: 'PULSE - ลงทะเบียนอีเวนต์และคอนเสิร์ตฟรี',
  description: 'ค้นหาอีเวนต์และคอนเสิร์ตฟรีบน PULSE ดูรายละเอียดงาน เลือกที่นั่ง และรับบัตร QR สำหรับเข้างาน',
  siteName: 'PULSE',
  locale: 'th_TH',
  url: `${SITE_ORIGIN}/`,
  image: `${SITE_ORIGIN}/images/pulse-share.png?v=2`,
  imageAlt: 'โปสเตอร์ PULSE พร้อมตัวอย่างหน้าอีเวนต์',
  imageType: 'image/png',
  imageWidth: 1200,
  imageHeight: 630,
};

export const EXPLORE_METADATA = {
  ...HOME_METADATA,
  title: 'สำรวจอีเวนต์และคอนเสิร์ตฟรี - PULSE',
  description: 'สำรวจงานที่เผยแพร่บน PULSE ค้นหาคอนเสิร์ตและอีเวนต์ตามหมวดหมู่ พร้อมดูวัน เวลา สถานที่ และรายละเอียดการลงทะเบียน',
  url: `${SITE_ORIGIN}/user`,
};

export const NOINDEX_METADATA = {
  ...HOME_METADATA,
  title: 'PULSE',
  url: undefined,
  robots: 'noindex,follow',
};

export function getEventUrl(eventId) {
  return `${SITE_ORIGIN}/user/events/${encodeURIComponent(eventId)}`;
}

function getPosterUrl(value) {
  const poster = value?.trim();
  if (!poster || !/^(?:\/images\/|https?:\/\/)/i.test(poster)) return null;

  try {
    const url = new URL(poster, SITE_ORIGIN);
    if (url.username || url.password) return null;
    if (poster.startsWith('/') && !url.pathname.startsWith('/images/')) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getEventMetadata({ id, title, description, posterUrl }) {
  const name = title.trim().replace(/\s+/gu, ' ');
  const summary = (description || '').trim().replace(/\s+/gu, ' ');
  const characters = [...summary];
  const image = getPosterUrl(posterUrl);

  return {
    ...HOME_METADATA,
    title: `${name} | PULSE`,
    socialTitle: name,
    description: (characters.length > 180 ? `${characters.slice(0, 179).join('').trimEnd()}…` : summary)
      || HOME_METADATA.description,
    url: getEventUrl(id),
    ...(image ? {
      image,
      imageAlt: name,
      imageType: undefined,
      imageWidth: undefined,
      imageHeight: undefined,
    } : {}),
  };
}
