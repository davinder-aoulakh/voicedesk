import { useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday, parseISO, getISOWeek } from 'date-fns';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0–23
const TIME_COL_WIDTH = 60;

const STATUS_COLORS = {
  pending:   { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  confirmed: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  completed: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  no_show:   { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
};

function formatHour(h) {
  if (h === 0)  return '12:00 AM';
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

export default function WeekView({ bookings, selectedDate, onSelectBooking, onAddBooking }) {
  const scrollRef = useRef(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Auto-scroll to 7 AM on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const rowHeight = 48;
    scrollRef.current.scrollTop = 7 * rowHeight;
  }, []);

  const getBookingsForCell = (day, hour) =>
    bookings.filter(b => {
      if (!b.scheduled_at) return false;
      const d = parseISO(b.scheduled_at);
      return isSameDay(d, day) && d.getHours() === hour;
    });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Day header row */}
      <div className="flex border-b border-border sticky top-0 z-10 bg-card">
        {/* Time gutter */}
        <div style={{ minWidth: TIME_COL_WIDTH, width: TIME_COL_WIDTH }} />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`flex-1 py-2 text-center border-l border-border ${today ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <p className="text-xs font-medium">{format(day, 'EEE')}</p>
              <p className={`text-lg font-bold leading-tight ${today ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)' }}>
        {HOURS.map(hour => (
          <div key={hour} className="flex" style={{ minHeight: 48 }}>
            {/* Time label */}
            <div
              className="shrink-0 flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground border-r border-border"
              style={{ minWidth: TIME_COL_WIDTH, width: TIME_COL_WIDTH }}
            >
              {formatHour(hour)}
            </div>

            {/* Day cells */}
            {days.map((day, di) => {
              const today = isToday(day);
              const cellBookings = getBookingsForCell(day, hour);
              return (
                <div
                  key={di}
                  className={`flex-1 border-l border-b border-border relative cursor-pointer transition-colors min-h-[48px]
                    ${today ? 'bg-purple-50 dark:bg-purple-950/20' : 'hover:bg-secondary/40'}`}
                  onClick={() => !cellBookings.length && onAddBooking?.({ date: day, hour })}
                >
                  {/* Echo time in cell (Speako style) */}
                  <span className="absolute top-1 left-1.5 text-[10px] text-muted-foreground/40 select-none pointer-events-none">
                    {formatHour(hour)}
                  </span>

                  {/* Booking pills */}
                  {cellBookings.map(b => {
                    const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                    return (
                      <div
                        key={b.id}
                        onClick={e => { e.stopPropagation(); onSelectBooking(b); }}
                        className="absolute inset-x-1 top-1 bottom-1 rounded-md px-2 py-0.5 text-xs font-medium truncate cursor-pointer hover:opacity-90 transition-opacity z-10"
                        style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                      >
                        {b.customer_name}
                        {b.service && <span className="opacity-70 ml-1">· {b.service}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}