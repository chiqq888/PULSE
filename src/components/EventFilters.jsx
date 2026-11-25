export function EventFilters({
  searchQuery,
  onSearchChange,
  eventType,
  onEventTypeChange,
  categoryId,
  onCategoryChange,
  dateFilter,
  onDateFilterChange,
  specificDate,
  onSpecificDateChange,
  categories = [],
  onClear,
  hasActiveFilters,
  resultCount,
}) {
  return (
    <section className="filters-panel" aria-label="ค้นหาและกรองงาน">
      <div className="filters-panel__row">
        <div className="filter-field filter-field--search">
          <label htmlFor="explore-search" className="field-label">
            ค้นหางาน
          </label>
          <input
            id="explore-search"
            type="search"
            className="input"
            placeholder="ค้นหาชื่ออีเวนต์ คอนเสิร์ต สถานที่ หรือผู้จัด..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="explore-type" className="field-label">
            ประเภทงาน
          </label>
          <select
            id="explore-type"
            className="select"
            value={eventType}
            onChange={(e) => onEventTypeChange(e.target.value)}
          >
            <option value="all">ทั้งหมด (Event &amp; Concert)</option>
            <option value="event">Event</option>
            <option value="concert">Concert</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="explore-category" className="field-label">
            หมวดหมู่
          </label>
          <select
            id="explore-category"
            className="select"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="explore-date-preset" className="field-label">
            ช่วงวันจัดงาน
          </label>
          <select
            id="explore-date-preset"
            className="select"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            <option value="all">ทุกวัน</option>
            <option value="upcoming">กำลังจะมาถึง</option>
            <option value="today">วันนี้</option>
            <option value="this-month">เดือนนี้</option>
            <option value="past">ที่ผ่านมาแล้ว</option>
            <option value="date">เลือกวันที่เฉพาะ</option>
          </select>
        </div>

        {dateFilter === 'date' && (
          <div className="filter-field">
            <label htmlFor="explore-specific-date" className="field-label">
              วันที่ (ICT)
            </label>
            <input
              id="explore-specific-date"
              type="date"
              className="input"
              value={specificDate}
              onChange={(e) => onSpecificDateChange(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="filters-panel__footer">
        <span className="filters-panel__count">
          พบ <strong>{resultCount}</strong> รายการ
        </span>
        {hasActiveFilters && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    </section>
  );
}
