import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { PosterImage } from './PosterImage';
import { StatusBadge } from './StatusBadge';
import { formatEventDateShort } from '../utils/dateUtils';

export function TicketCard({ ticket, event }) {
  const seatObj =
    ticket.seatId && Array.isArray(event?.seats)
      ? event.seats.find((s) => s.id === ticket.seatId)
      : null;

  return (
    <article className="ticket-card">
      <div className="ticket-card__thumb">
        <PosterImage
          src={event?.posterUrl}
          alt={event?.title || 'Event poster'}
          className="ticket-card__img"
        />
      </div>

      <div className="ticket-card__content">
        <div className="ticket-card__top">
          <div className="ticket-card__badges">
            <StatusBadge type={ticket.status} />
            {ticket.seatId && (
              <span className="badge badge--meta">
                ที่นั่ง {seatObj ? seatObj.label : ticket.seatId}
              </span>
            )}
          </div>
          <code className="ticket-card__id">{ticket.id}</code>
        </div>

        <h3 className="ticket-card__title">
          {event ? event.title : `งานรหัส ${ticket.eventId}`}
        </h3>

        {event && (
          <div className="ticket-card__meta">
            <span className="icon-text">
              <Icon name="calendar" size={14} />
              <span>{formatEventDateShort(event.startsAt, event.endsAt)}</span>
            </span>
            <span className="icon-text">
              <Icon name="pin" size={14} />
              <span>{event.venue}</span>
            </span>
          </div>
        )}

        <div className="ticket-card__footer">
          <span className="ticket-card__attendee">
            <strong>{ticket.attendeeName}</strong>
          </span>
          <Link to={`/user/tickets/${ticket.id}`} className="btn btn--primary btn--sm">
            เปิดบัตร QR
          </Link>
        </div>
      </div>
    </article>
  );
}
