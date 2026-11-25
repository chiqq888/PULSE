export const SEAT_MAP_VIEWBOX = {
  width: 760,
  height: 560,
};

function buildCurvedRows(rowConfigs) {
  const seats = [];
  const centerX = SEAT_MAP_VIEWBOX.width / 2;

  rowConfigs.forEach(({ zone, row, count, centerY, seatPitch, aisleHalf, curveLift }) => {
    const half = count / 2;
    const maxOffset = aisleHalf + (half - 0.5) * seatPitch;

    for (let index = 0; index < count; index += 1) {
      const number = index + 1;
      let offsetX;
      if (index < half) {
        const stepsFromAisle = half - 1 - index;
        offsetX = -(aisleHalf + (stepsFromAisle + 0.5) * seatPitch);
      } else {
        const stepsFromAisle = index - half;
        offsetX = aisleHalf + (stepsFromAisle + 0.5) * seatPitch;
      }

      const norm = maxOffset === 0 ? 0 : offsetX / maxOffset;
      const x = Math.round(centerX + offsetX);
      const y = Math.round(centerY - norm * norm * curveLift);
      const padded = String(number).padStart(2, '0');

      seats.push({
        id: `${row}-${padded}`,
        label: `${row}${padded}`,
        zone,
        row,
        number,
        x,
        y,
      });
    }
  });

  return seats;
}

export const SEAT_TEMPLATES = [
  {
    id: 'curved-hall',
    name: 'Curved Concert Hall (3 โซน • 36 ที่นั่ง)',
    description: 'ผังคอนเสิร์ตทรงโค้ง 3 โซน (A, B, C) แบ่ง 6 แถว เหมาะสำหรับงานคอนเสิร์ตหลัก',
    zones: ['A', 'B', 'C'],
    seats: buildCurvedRows([
      { zone: 'A', row: 'A', count: 6, centerY: 150, seatPitch: 56, aisleHalf: 22, curveLift: 12 },
      { zone: 'A', row: 'B', count: 6, centerY: 198, seatPitch: 58, aisleHalf: 22, curveLift: 13 },
      { zone: 'B', row: 'C', count: 6, centerY: 304, seatPitch: 60, aisleHalf: 24, curveLift: 14 },
      { zone: 'B', row: 'D', count: 6, centerY: 352, seatPitch: 62, aisleHalf: 24, curveLift: 15 },
      { zone: 'C', row: 'E', count: 6, centerY: 458, seatPitch: 64, aisleHalf: 26, curveLift: 16 },
      { zone: 'C', row: 'F', count: 6, centerY: 506, seatPitch: 66, aisleHalf: 26, curveLift: 17 },
    ]),
  },
  {
    id: 'intimate-stage',
    name: 'Intimate Stage (2 โซน • 24 ที่นั่ง)',
    description: 'ผังเวทีใกล้ชิด 2 โซน (A, B) 4 แถว เหมาะสำหรับโชว์อะคูสติกหรือทอล์กโชว์',
    zones: ['A', 'B'],
    seats: buildCurvedRows([
      { zone: 'A', row: 'A', count: 6, centerY: 172, seatPitch: 58, aisleHalf: 22, curveLift: 12 },
      { zone: 'A', row: 'B', count: 6, centerY: 226, seatPitch: 60, aisleHalf: 22, curveLift: 13 },
      { zone: 'B', row: 'C', count: 6, centerY: 344, seatPitch: 62, aisleHalf: 24, curveLift: 14 },
      { zone: 'B', row: 'D', count: 6, centerY: 398, seatPitch: 64, aisleHalf: 24, curveLift: 15 },
    ]),
  },
  {
    id: 'grand-arena',
    name: 'Grand Arena (3 โซน • 48 ที่นั่ง)',
    description: 'ผังอัฒจันทร์โค้งขนาดใหญ่ 3 โซน (A, B, C) 6 แถว รองรับผู้เข้าร่วมจำนวนมาก',
    zones: ['A', 'B', 'C'],
    seats: buildCurvedRows([
      { zone: 'A', row: 'A', count: 8, centerY: 150, seatPitch: 52, aisleHalf: 18, curveLift: 13 },
      { zone: 'A', row: 'B', count: 8, centerY: 198, seatPitch: 53, aisleHalf: 18, curveLift: 14 },
      { zone: 'B', row: 'C', count: 8, centerY: 304, seatPitch: 55, aisleHalf: 20, curveLift: 15 },
      { zone: 'B', row: 'D', count: 8, centerY: 352, seatPitch: 56, aisleHalf: 20, curveLift: 16 },
      { zone: 'C', row: 'E', count: 8, centerY: 458, seatPitch: 58, aisleHalf: 22, curveLift: 17 },
      { zone: 'C', row: 'F', count: 8, centerY: 506, seatPitch: 59, aisleHalf: 22, curveLift: 18 },
    ]),
  },
];

export function getSeatTemplateById(templateId) {
  return SEAT_TEMPLATES.find((tpl) => tpl.id === templateId) || null;
}

export function cloneSeatsFromTemplate(templateId) {
  const template = getSeatTemplateById(templateId);
  if (!template) return [];
  return template.seats.map((seat) => ({ ...seat }));
}

export function getZoneLabel(zone) {
  const map = {
    A: 'Zone A · Front Stage',
    B: 'Zone B · Main Floor',
    C: 'Zone C · Upper Balcony',
  };
  return map[zone] || `Zone ${zone}`;
}
