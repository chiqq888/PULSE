import { getEventTicketStats } from '../utils/capacityUtils';

export function buildDashboardReport(events = [], tickets = []) {
  const safeEvents = Array.isArray(events) ? events : [];
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  let draftEvents = 0;
  let publishedEvents = 0;
  let closedEvents = 0;

  let activeRegistrations = 0;
  let validTickets = 0;
  let checkedInCount = 0;
  let cancelledCount = 0;

  const anomalies = [];

  const perEvent = safeEvents.map((event) => {
    if (event.status === 'draft') draftEvents += 1;
    else if (event.status === 'published') publishedEvents += 1;
    else if (event.status === 'closed') closedEvents += 1;

    const stats = getEventTicketStats(event, safeTickets);
    activeRegistrations += stats.activeCount;
    validTickets += stats.validCount;
    checkedInCount += stats.usedCount;
    cancelledCount += stats.cancelledCount;

    if (stats.hasOverCapacity) {
      anomalies.push({
        eventId: event.id,
        eventTitle: event.title,
        type: 'OVER_CAPACITY',
        message: `จำนวนผู้ลงทะเบียนเกินความจุ (ที่ว่างคงเหลือ ${stats.remaining})`,
      });
    }

    if (stats.hasDuplicateSeats) {
      const seatList = stats.duplicateSeatIds
        .map((item) => `${item.seatId} (${item.count} บัตร)`)
        .join(', ');
      anomalies.push({
        eventId: event.id,
        eventTitle: event.title,
        type: 'DUPLICATE_SEAT',
        message: `พบที่นั่งที่มีบัตรใช้งานซ้ำกัน: ${seatList}`,
      });
    }

    return {
      event,
      stats,
    };
  });

  // Sort: published first, then closed, then draft, then by startsAt desc
  const statusOrder = { published: 0, closed: 1, draft: 2 };
  perEvent.sort((a, b) => {
    const orderDiff = (statusOrder[a.event.status] ?? 9) - (statusOrder[b.event.status] ?? 9);
    if (orderDiff !== 0) return orderDiff;
    return String(a.event.startsAt || '').localeCompare(String(b.event.startsAt || ''));
  });

  const overallCheckInRate =
    activeRegistrations > 0
      ? Math.round((checkedInCount / activeRegistrations) * 1000) / 10
      : 0;

  return {
    summary: {
      totalEvents: safeEvents.length,
      draftEvents,
      publishedEvents,
      closedEvents,
      activeRegistrations,
      validTickets,
      checkedInCount,
      cancelledCount,
      overallCheckInRate,
      anomalyCount: anomalies.length,
    },
    perEvent,
    anomalies,
  };
}
