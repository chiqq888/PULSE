import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../components/Icon';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useEvents } from '../../hooks/useEvents';
import { usePolling } from '../../hooks/usePolling';
import { useTickets } from '../../hooks/useTickets';
import { buildDashboardReport } from '../../services/reportService';
import { formatEventTimeRange } from '../../utils/dateUtils';

export function DashboardPage() {
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents('organizer');
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useTickets({ mode: 'organizer' });

  const pollRefresh = useCallback(async () => {
    await Promise.all([
      refetchEvents({ silent: true }),
      refetchTickets({ silent: true }),
    ]);
  }, [refetchEvents, refetchTickets]);

  // FR-19: Dashboard refreshes approximately every 5s while open
  usePolling(pollRefresh, 5000, true);

  const report = useMemo(
    () => buildDashboardReport(events, tickets),
    [events, tickets]
  );

  const loading = eventsLoading || ticketsLoading;
  const error = eventsError || ticketsError;

  const handleRetry = () => {
    refetchEvents();
    refetchTickets();
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Organizer Dashboard</h1>
          <p className="page-header__subtitle">
            ภาพรวมจำนวนงาน บัตรที่ยังมีสิทธิ์ ผู้เช็กอิน และที่ว่าง คำนวณสดจาก API (อัปเดตทุก 5 วินาที)
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={pollRefresh}>
            <Icon name="refresh" size={14} />
            <span>รีเฟรชทันที</span>
          </button>
          <Link to="/org/events/new" className="btn btn--primary btn--sm">
            + สร้างงานใหม่
          </Link>
        </div>
      </div>

      {loading ? (
        <FeedbackState type="loading" title="กำลังคำนวณข้อมูล Dashboard จาก API..." />
      ) : error ? (
        <FeedbackState
          type="error"
          title="ไม่สามารถโหลดข้อมูล Dashboard ได้"
          message={error.message}
          onAction={handleRetry}
        />
      ) : (
        <>
          {report.anomalies.length > 0 && (
            <div className="alert alert--danger" role="alert">
              <strong>พบความผิดปกติของข้อมูลที่ต้องตรวจสอบ ({report.anomalies.length} รายการ):</strong>
              <ul className="alert__list">
                {report.anomalies.map((item, idx) => (
                  <li key={`${item.eventId}-${idx}`}>
                    <strong>{item.eventTitle}:</strong> {item.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="stats-grid" aria-label="สถิติภาพรวม">
            <StatCard
              label="จำนวนงานทั้งหมด"
              value={report.summary.totalEvents}
              sublabel={`Published ${report.summary.publishedEvents} • Closed ${report.summary.closedEvents} • Draft ${report.summary.draftEvents}`}
            />
            <StatCard
              label="บัตรที่ยังมีสิทธิ์ (Valid + Used)"
              value={report.summary.activeRegistrations}
              sublabel={`รอเช็กอิน (Valid): ${report.summary.validTickets} ใบ`}
              tone="accent"
            />
            <StatCard
              label="ผู้เข้างานแล้ว (Checked-in)"
              value={report.summary.checkedInCount}
              sublabel={`อัตราเช็กอินรวม: ${report.summary.overallCheckInRate}%`}
              tone="success"
            />
            <StatCard
              label="ผู้ยกเลิก (Cancelled)"
              value={report.summary.cancelledCount}
              sublabel="คืนจำนวนว่าง/ที่นั่งแล้ว"
              tone="muted"
            />
          </section>

          <section className="card">
            <div className="section-heading">
              <h2>สรุปรายงานแยกรายงาน ({report.perEvent.length} งาน)</h2>
              <Link to="/org/events" className="link-inline">
                ไปหน้าจัดการงานทั้งหมด →
              </Link>
            </div>

            {report.perEvent.length === 0 ? (
              <FeedbackState
                type="empty"
                compact
                title="ยังไม่มีงานในระบบ"
                message="เริ่มสร้างงานแรกของคุณเพื่อดูสถิติการลงทะเบียนและการเช็กอิน"
              />
            ) : (
              <div className="table-scroll" role="region" aria-label="ตารางสรุปรายงานแยกรายงาน">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ชื่องาน</th>
                      <th>ประเภท / รูปแบบ</th>
                      <th>สถานะ</th>
                      <th className="text-right">มีสิทธิ์ (Valid+Used)</th>
                      <th className="text-right">เช็กอินแล้ว</th>
                      <th className="text-right">ยกเลิก</th>
                      <th className="text-right">คงเหลือว่าง</th>
                      <th className="text-right">อัตราเช็กอิน</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.perEvent.map(({ event, stats }) => (
                      <tr key={event.id} className={stats.hasAnomalies ? 'row-anomaly' : ''}>
                        <td>
                          <strong>{event.title}</strong>
                          <div className="text-muted text-xs">
                            {formatEventTimeRange(event.startsAt, event.endsAt)}
                          </div>
                          {stats.hasAnomalies && (
                            <div className="anomaly-pill icon-text">
                              <Icon name="warning" size={14} />
                              <span>ตรวจพบข้อมูลผิดปกติ (เกินความจุหรือที่นั่งซ้ำ)</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="badge-row">
                            <StatusBadge type={event.eventType} />
                            <StatusBadge type={event.registrationMode} />
                          </div>
                        </td>
                        <td>
                          <StatusBadge type={event.status} />
                        </td>
                        <td className="text-right">
                          <strong>{stats.activeCount}</strong>
                        </td>
                        <td className="text-right">{stats.usedCount}</td>
                        <td className="text-right">{stats.cancelledCount}</td>
                        <td className="text-right">
                          <span className={stats.hasOverCapacity ? 'text-danger-bold' : ''}>
                            {stats.remainingLabel}
                          </span>
                        </td>
                        <td className="text-right">{stats.checkInRate}%</td>
                        <td>
                          <div className="table-actions">
                            <Link
                              to={`/org/events/${event.id}/attendees`}
                              className="btn btn--secondary btn--xs"
                            >
                              ผู้ลงทะเบียน
                            </Link>
                            <Link
                              to={`/org/events/${event.id}/edit`}
                              className="btn btn--ghost btn--xs"
                            >
                              แก้ไข
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
