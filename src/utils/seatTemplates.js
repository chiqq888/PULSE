export const SEAT_MAP_VIEWBOX = {
  width: 760,
  height: 560,
};

export const IMPACT_ARENA_OVERVIEW_VIEWBOX = {
  width: 900,
  height: 740,
};

export const IMPACT_ARENA_ZONE_VIEWBOX = {
  width: 760,
  height: 340,
};

export const IMPACT_ARENA_ZONES = [
  // Floor (Level 1 — 4 Zones: A1–A4)
  { zone: 'A1', tier: 'floor', tierLabel: 'Floor (ชั้น 1)', facing: 'up', shape: 'rect', x: 244, y: 112, width: 152, height: 112, labelX: 320, labelY: 168 },
  { zone: 'A2', tier: 'floor', tierLabel: 'Floor (ชั้น 1)', facing: 'up', shape: 'rect', x: 504, y: 112, width: 152, height: 112, labelX: 580, labelY: 168 },
  { zone: 'A3', tier: 'floor', tierLabel: 'Floor (ชั้น 1)', facing: 'up', shape: 'rect', x: 244, y: 236, width: 152, height: 112, labelX: 320, labelY: 292 },
  { zone: 'A4', tier: 'floor', tierLabel: 'Floor (ชั้น 1)', facing: 'up', shape: 'rect', x: 504, y: 236, width: 152, height: 112, labelX: 580, labelY: 292 },

  // Level 2 Lower Stand (Inner Horseshoe Ring — 19 Zones: SB–ST counter-clockwise)
  { zone: 'SB', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'right', shape: 'rect', x: 124, y: 104, width: 80, height: 62, labelX: 164, labelY: 135 },
  { zone: 'SC', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'right', shape: 'rect', x: 124, y: 170, width: 80, height: 62, labelX: 164, labelY: 201 },
  { zone: 'SD', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'right', shape: 'rect', x: 124, y: 236, width: 80, height: 62, labelX: 164, labelY: 267 },
  { zone: 'SE', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'right', shape: 'rect', x: 124, y: 302, width: 80, height: 62, labelX: 164, labelY: 333 },
  { zone: 'SF', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'right', shape: 'rect', x: 124, y: 368, width: 80, height: 62, labelX: 164, labelY: 399 },
  { zone: 'SG', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up-right', shape: 'poly', points: '124,435 204,435 234,473 174,527', labelX: 184, labelY: 468 },
  { zone: 'SH', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up-right', shape: 'poly', points: '179,532 239,478 275,510 275,582', labelX: 238, labelY: 530 },
  { zone: 'SI', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up', shape: 'rect', x: 280, y: 510, width: 64, height: 72, labelX: 312, labelY: 546 },
  { zone: 'SJ', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up', shape: 'rect', x: 349, y: 510, width: 64, height: 72, labelX: 381, labelY: 546 },
  { zone: 'SK', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up', shape: 'rect', x: 418, y: 510, width: 64, height: 72, labelX: 450, labelY: 546 },
  { zone: 'SL', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up', shape: 'rect', x: 487, y: 510, width: 64, height: 72, labelX: 519, labelY: 546 },
  { zone: 'SM', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up', shape: 'rect', x: 556, y: 510, width: 64, height: 72, labelX: 588, labelY: 546 },
  { zone: 'SN', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up-left', shape: 'poly', points: '721,532 661,478 625,510 625,582', labelX: 662, labelY: 530 },
  { zone: 'SO', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'up-left', shape: 'poly', points: '776,435 696,435 666,473 726,527', labelX: 716, labelY: 468 },
  { zone: 'SP', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'left', shape: 'rect', x: 696, y: 368, width: 80, height: 62, labelX: 736, labelY: 399 },
  { zone: 'SQ', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'left', shape: 'rect', x: 696, y: 302, width: 80, height: 62, labelX: 736, labelY: 333 },
  { zone: 'SR', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'left', shape: 'rect', x: 696, y: 236, width: 80, height: 62, labelX: 736, labelY: 267 },
  { zone: 'SS', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'left', shape: 'rect', x: 696, y: 170, width: 80, height: 62, labelX: 736, labelY: 201 },
  { zone: 'ST', tier: 'level2', tierLabel: 'Level 2 (อัฒจันทร์ชั้น 2)', facing: 'left', shape: 'rect', x: 696, y: 104, width: 80, height: 62, labelX: 736, labelY: 135 },

  // Level 3 Upper Stand (Outer Horseshoe Ring — 19 Zones: B–T counter-clockwise)
  { zone: 'B', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'right', shape: 'rect', x: 26, y: 104, width: 82, height: 62, labelX: 67, labelY: 135 },
  { zone: 'C', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'right', shape: 'rect', x: 26, y: 170, width: 82, height: 62, labelX: 67, labelY: 201 },
  { zone: 'D', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'right', shape: 'rect', x: 26, y: 236, width: 82, height: 62, labelX: 67, labelY: 267 },
  { zone: 'E', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'right', shape: 'rect', x: 26, y: 302, width: 82, height: 62, labelX: 67, labelY: 333 },
  { zone: 'F', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'right', shape: 'rect', x: 26, y: 368, width: 82, height: 62, labelX: 67, labelY: 399 },
  { zone: 'G', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up-right', shape: 'poly', points: '26,435 108,435 161,538 100,594', labelX: 98, labelY: 502 },
  { zone: 'H', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up-right', shape: 'poly', points: '106,600 167,544 275,598 275,678', labelX: 206, labelY: 610 },
  { zone: 'I', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up', shape: 'rect', x: 280, y: 598, width: 64, height: 80, labelX: 312, labelY: 638 },
  { zone: 'J', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up', shape: 'rect', x: 349, y: 598, width: 64, height: 80, labelX: 381, labelY: 638 },
  { zone: 'K', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up', shape: 'rect', x: 418, y: 598, width: 64, height: 80, labelX: 450, labelY: 638 },
  { zone: 'L', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up', shape: 'rect', x: 487, y: 598, width: 64, height: 80, labelX: 519, labelY: 638 },
  { zone: 'M', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up', shape: 'rect', x: 556, y: 598, width: 64, height: 80, labelX: 588, labelY: 638 },
  { zone: 'N', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up-left', shape: 'poly', points: '794,600 733,544 625,598 625,678', labelX: 694, labelY: 610 },
  { zone: 'O', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'up-left', shape: 'poly', points: '874,435 792,435 739,538 800,594', labelX: 802, labelY: 502 },
  { zone: 'P', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'left', shape: 'rect', x: 792, y: 368, width: 82, height: 62, labelX: 833, labelY: 399 },
  { zone: 'Q', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'left', shape: 'rect', x: 792, y: 302, width: 82, height: 62, labelX: 833, labelY: 333 },
  { zone: 'R', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'left', shape: 'rect', x: 792, y: 236, width: 82, height: 62, labelX: 833, labelY: 267 },
  { zone: 'S', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'left', shape: 'rect', x: 792, y: 170, width: 82, height: 62, labelX: 833, labelY: 201 },
  { zone: 'T', tier: 'level3', tierLabel: 'Level 3 (อัฒจันทร์ชั้น 3)', facing: 'left', shape: 'rect', x: 792, y: 104, width: 82, height: 62, labelX: 833, labelY: 135 },
];

const IMPACT_ARENA_ZONE_MAP = new Map(
  IMPACT_ARENA_ZONES.map((meta) => [meta.zone, meta])
);

const IMPACT_DETECT_ZONES = new Set(['A1', 'A2', 'A3', 'A4', 'SB', 'SC', 'SK', 'ST']);

export function getImpactZoneMeta(zone) {
  return IMPACT_ARENA_ZONE_MAP.get(zone) || null;
}

export function isImpactArenaLayout(templateId, seats) {
  if (templateId === 'impact-arena') return true;
  return Array.isArray(seats) && seats.some((seat) => IMPACT_DETECT_ZONES.has(seat?.zone));
}

export function getSeatMapViewBox(templateId, seats) {
  return isImpactArenaLayout(templateId, seats)
    ? IMPACT_ARENA_ZONE_VIEWBOX
    : SEAT_MAP_VIEWBOX;
}

function buildCurvedRows(rowConfigs, centerX = SEAT_MAP_VIEWBOX.width / 2) {
  const seats = [];

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

function buildImpactArenaSeats() {
  const seats = [];
  const zoneCenterX = IMPACT_ARENA_ZONE_VIEWBOX.width / 2;
  const seatPitch = 74;
  const aisleHalf = 24;

  for (const meta of IMPACT_ARENA_ZONES) {
    const rowConfigs =
      meta.tier === 'floor'
        ? [
            { row: 'A', y: 146 },
            { row: 'B', y: 206 },
            { row: 'C', y: 266 },
          ]
        : [
            { row: 'A', y: 164 },
            { row: 'B', y: 228 },
          ];

    for (const { row, y } of rowConfigs) {
      for (let index = 0; index < 6; index += 1) {
        const number = index + 1;
        const offsetX =
          index < 3
            ? -(aisleHalf + (2 - index + 0.5) * seatPitch)
            : aisleHalf + (index - 3 + 0.5) * seatPitch;
        const x = Math.round(zoneCenterX + offsetX);
        const padded = String(number).padStart(2, '0');

        seats.push({
          id: `${meta.zone}-${row}-${padded}`,
          label: `${meta.zone}-${row}${padded}`,
          zone: meta.zone,
          row,
          number,
          x,
          y,
        });
      }
    }
  }

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
  {
    id: 'impact-arena',
    name: 'Impact Arena (42 โซน • 528 ที่นั่ง)',
    description:
      'ผังคอนเสิร์ตอิมแพ็ค อารีน่า เมืองทองธานี เต็มรูปแบบ พร้อมเวทีหลัก แคตวอล์ก B-Stage, FOH, ฟลอร์ A1–A4, ชั้น 2 (SB–ST) และชั้น 3 (B–T)',
    zones: IMPACT_ARENA_ZONES.map((z) => z.zone),
    seats: buildImpactArenaSeats(),
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
  if (map[zone]) return map[zone];

  const impactMeta = getImpactZoneMeta(zone);
  if (impactMeta) {
    return `Zone ${zone} · ${impactMeta.tierLabel}`;
  }
  return `Zone ${zone}`;
}
