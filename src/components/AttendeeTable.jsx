import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { formatBangkokDateTime } from '../utils/dateUtils';

export function AttendeeTable({ tickets = [], event }) {
  const isSeated = event?.registrationMode === 'seated';
  const seatMap = new Map(
    (Array.isArray(event?.seats) ? event.seats : []).map((seat) => [seat.id, seat])
  );

  return (
    <div className="table-scroll" role="region" aria-label="ตารางรายชื่อผู้ลงทะเบียน">
      <table className="data-table">
        <thead>
          <tr>
            <th>รหัสบัตร</th>
            <th>ชื่อผู้เข้าร่วม</th>
            <th>อีเมล</th>
            {isSeated && <th>ที่นั่ง</th>}
            <th>สถานะ</th>
            <th>ลงทะเบียนเมื่อ</th>
            <th>เช็กอิน / ยกเลิก</th>
            <th>บัตร QR</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const seat = ticket.seatId ? seatMap.get(ticket.seatId) : null;
            return (
              <tr key={ticket.id}>
                <td>
                  <code className="code-sm">{ticket.id}</code>
                </td>
                <td>
                  <strong>{ticket.attendeeName}</strong>
                </td>
                <td>{ticket.attendeeEmail}</td>
                {isSeated && (
                  <td>
                    {ticket.seatId ? (
                      <span className="badge badge--accent">
                        {seat ? `${seat.label} (Z-${seat.zone})` : ticket.seatId}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                <td>
                  <StatusBadge type={ticket.status} />
                </td>
                <td className="text-nowrap">{formatBangkokDateTime(ticket.createdAt)}</td>
                <td className="text-nowrap">
                  {ticket.checkedInAt
                    ? `เช็กอิน: ${formatBangkokDateTime(ticket.checkedInAt)}`
                    : ticket.cancelledAt
                      ? `ยกเลิก: ${formatBangkokDateTime(ticket.cancelledAt)}`
                      : '-'}
                </td>
                <td>
                  <Link
                    to={`/user/tickets/${ticket.id}`}
                    className="btn btn--ghost btn--xs"
                  >
                    เปิดบัตร
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
