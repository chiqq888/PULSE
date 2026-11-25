export function isActiveTicketStatus(status) {
  return status === 'valid' || status === 'used';
}

export function getEventTicketStats(event, tickets = []) {
  const eventTickets = Array.isArray(tickets)
    ? tickets.filter((ticket) => !event?.id || ticket.eventId === event.id)
    : [];

  let validCount = 0;
  let usedCount = 0;
  let cancelledCount = 0;

  const seatCounts = new Map();

  for (const ticket of eventTickets) {
    if (ticket.status === 'valid') {
      validCount += 1;
    } else if (ticket.status === 'used') {
      usedCount += 1;
    } else if (ticket.status === 'cancelled') {
      cancelledCount += 1;
    }

    if (isActiveTicketStatus(ticket.status) && ticket.seatId) {
      seatCounts.set(ticket.seatId, (seatCounts.get(ticket.seatId) || 0) + 1);
    }
  }

  const duplicateSeatIds = [];
  for (const [seatId, count] of seatCounts.entries()) {
    if (count > 1) {
      duplicateSeatIds.push({ seatId, count });
    }
  }

  return getEventAvailabilityStats(event, {
    totalTickets: eventTickets.length,
    activeCount: validCount + usedCount,
    validCount,
    usedCount,
    cancelledCount,
    occupiedSeatIds: [...seatCounts.keys()],
    duplicateSeatIds,
  });
}

export function getEventAvailabilityStats(event, summary = {}) {
  const {
    activeCount = 0,
    validCount = 0,
    usedCount = 0,
    cancelledCount = 0,
    occupiedSeatIds: seatIds = [],
    duplicateSeatIds = [],
    totalTickets = activeCount + cancelledCount,
  } = summary;
  const occupiedSeatIds = new Set(seatIds);
  const mode = event?.registrationMode || 'unlimited';
  let totalCapacity = null;
  let remaining = null;
  let remainingLabel = 'ไม่จำกัด';

  if (mode === 'limited') {
    totalCapacity = typeof event?.capacity === 'number' ? event.capacity : 0;
    remaining = totalCapacity - activeCount;
    remainingLabel = `${remaining} / ${totalCapacity}`;
  } else if (mode === 'seated') {
    const seats = Array.isArray(event?.seats) ? event.seats : [];
    totalCapacity = seats.length;
    remaining = totalCapacity - occupiedSeatIds.size;
    remainingLabel = `${remaining} / ${totalCapacity}`;
  }

  const checkInRate =
    activeCount > 0 ? Math.round((usedCount / activeCount) * 1000) / 10 : 0;

  const hasOverCapacity = typeof remaining === 'number' && remaining < 0;
  const hasDuplicateSeats = duplicateSeatIds.length > 0;
  const hasAnomalies = hasOverCapacity || hasDuplicateSeats;

  return {
    totalTickets,
    activeCount,
    validCount,
    usedCount,
    cancelledCount,
    totalCapacity,
    remaining,
    remainingLabel,
    checkInRate,
    occupiedSeatIds,
    duplicateSeatIds,
    hasOverCapacity,
    hasDuplicateSeats,
    hasAnomalies,
  };
}

export function isEventFull(event, stats) {
  if (!event || !stats) return false;
  if (event.registrationMode === 'unlimited') return false;
  return typeof stats.remaining === 'number' && stats.remaining <= 0;
}
