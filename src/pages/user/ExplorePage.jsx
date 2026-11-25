import { useMemo, useState } from 'react';
import { EventCard } from '../../components/EventCard';
import { EventFilters } from '../../components/EventFilters';
import { FeedbackState } from '../../components/FeedbackState';
import { useCategories } from '../../hooks/useCategories';
import { useEvents } from '../../hooks/useEvents';
import { useEventStats } from '../../hooks/useTickets';
import { getEventAvailabilityStats } from '../../utils/capacityUtils';
import {
  getBangkokDateKey,
  getTodayBangkokDateKey,
  hasEventEnded,
} from '../../utils/dateUtils';

export function ExplorePage() {
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents();
  const { categories, loading: catsLoading, error: catsError, refetch: refetchCats } = useCategories();
  const {
    stats: availability,
    loading: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useEventStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [eventType, setEventType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');

  const loading = eventsLoading || catsLoading || availabilityLoading;
  const error = eventsError || catsError || availabilityError;

  const handleRetryAll = () => {
    refetchEvents();
    refetchCats();
    refetchAvailability();
  };

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const availabilityMap = useMemo(
    () => new Map(availability.map((entry) => [entry.eventId, entry])),
    [availability]
  );

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const todayKey = getTodayBangkokDateKey();
    const currentMonthPrefix = todayKey.slice(0, 7);

    return events
      .filter((event) => {
        if (eventType !== 'all' && event.eventType !== eventType) {
          return false;
        }

        if (categoryId !== 'all' && event.categoryId !== categoryId) {
          return false;
        }

        if (query) {
          const haystack = [
            event.title,
            event.description,
            event.venue,
            event.organizerName,
            categoryMap.get(event.categoryId) || '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) {
            return false;
          }
        }

        const eventDayKey = getBangkokDateKey(event.startsAt);
        const ended = hasEventEnded(event);

        if (dateFilter === 'upcoming' && ended) {
          return false;
        }
        if (dateFilter === 'past' && !ended) {
          return false;
        }
        if (dateFilter === 'today' && eventDayKey !== todayKey) {
          return false;
        }
        if (dateFilter === 'this-month' && !eventDayKey.startsWith(currentMonthPrefix)) {
          return false;
        }
        if (dateFilter === 'date' && specificDate && eventDayKey !== specificDate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Upcoming published first, then closed, then ended
        const aEnded = hasEventEnded(a) ? 1 : 0;
        const bEnded = hasEventEnded(b) ? 1 : 0;
        if (aEnded !== bEnded) return aEnded - bEnded;
        if (a.status !== b.status) return a.status === 'published' ? -1 : 1;
        return String(a.startsAt || '').localeCompare(String(b.startsAt || ''));
      });
  }, [events, searchQuery, eventType, categoryId, dateFilter, specificDate, categoryMap]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    eventType !== 'all' ||
    categoryId !== 'all' ||
    dateFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setEventType('all');
    setCategoryId('all');
    setDateFilter('all');
    setSpecificDate('');
  };

  return (
    <div className="page-stack">
      <section className="hero-banner">
        <div className="hero-banner__content">
          <span className="pill-free">Register for free</span>
          <h1 className="hero-banner__title">
            ค้นหาและลงทะเบียนอีเวนต์และคอนเสิร์ตฟรี
          </h1>
          <p className="hero-banner__subtitle">
            ค้นหางานที่สนใจ แล้วเข้าสู่ระบบเพื่อลงทะเบียนและรับบัตร QR
          </p>
        </div>
      </section>

      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        eventType={eventType}
        onEventTypeChange={setEventType}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        dateFilter={dateFilter}
        onDateFilterChange={(val) => {
          setDateFilter(val);
          if (val !== 'date') setSpecificDate('');
        }}
        specificDate={specificDate}
        onSpecificDateChange={setSpecificDate}
        categories={categories}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={filteredEvents.length}
      />

      {loading ? (
        <FeedbackState type="loading" title="กำลังโหลดรายการอีเวนต์และคอนเสิร์ต..." />
      ) : error ? (
        <FeedbackState
          type="error"
          title="ไม่สามารถโหลดรายการงานได้"
          message={error.message}
          onAction={handleRetryAll}
        />
      ) : filteredEvents.length === 0 ? (
        <FeedbackState
          type="empty"
          title={hasActiveFilters ? 'ไม่พบงานที่ตรงกับเงื่อนไขที่เลือก' : 'ยังไม่มีงานที่เปิดแสดงในขณะนี้'}
          message={
            hasActiveFilters
              ? 'ลองปรับคำค้นหา เปลี่ยนหมวดหมู่ หรือล้างตัวกรองเพื่อดูงานทั้งหมด'
              : undefined
          }
          actionLabel={hasActiveFilters ? 'ล้างตัวกรองทั้งหมด' : undefined}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
        />
      ) : (
        <section className="events-grid" aria-label="รายการอีเวนต์และคอนเสิร์ต">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              categoryName={categoryMap.get(event.categoryId)}
              stats={getEventAvailabilityStats(event, availabilityMap.get(event.id))}
            />
          ))}
        </section>
      )}
    </div>
  );
}
