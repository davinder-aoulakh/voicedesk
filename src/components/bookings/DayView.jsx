import { useState, useEffect, useRef } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7–23
const CELL_WIDTH = 120;
const FROZEN_WIDTH = 180;
const ROW_HEIGHT = 80;

const AVATAR_COLORS = ['#6C3BFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function getAvatarColor(name = '') {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatHour(h) {
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

const STATUS_COLORS = {
  pending:   { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  confirmed: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  completed: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  no_show:   { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
};

const HATCH = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)';

export default function DayView({ bookings, staff, selectedDate, onSelectBooking, onAddBooking, businessHours }) {
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to center current hour on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const currentHour = new Date().getHours();
    const hourIndex = currentHour - 7;
    if (hourIndex >= 0 && hourIndex < HOURS.length) {
      const scrollX = Math.max(0, hourIndex * CELL_WIDTH - (scrollRef.current.clientWidth - FROZEN_WIDTH) / 2);
      scrollRef.current.scrollLeft = scrollX;
    }
  }, []);

  // Current time position
  const isToday = isSameDay(selectedDate, now);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowOffset = ((nowHour - 7) + nowMinute / 60) * CELL_WIDTH;
  const showNowLine = isToday && nowHour >= 7 && nowHour <= 23;

  // Check if an hour is within business hours for a staff member
  const isInBusinessHours = (hour) => {
    if (!businessHours) return true;
    const dayName = format(selectedDate, 'EEEE').toLowerCase(); // monday, tuesday...
    const dayHours = businessHours[dayName];
    if (!dayHours || !dayHours.open) return false;
    const openHour = parseInt(dayHours.start?.split(':')[0] ?? '7');
    const closeHour = parseInt(dayHours.end?.split(':')[0] ?? '23');
    return hour >= openHour && hour < closeHour;
  };

  // Get bookings for a staff member at a specific hour on selectedDate
  const getBookingsForCell = (staffId, hour) => {
    return bookings.filter(b => {
      if (!b.scheduled_at) return false;
      const d = parseISO(b.scheduled_at);
      return b.staff_id === staffId && isSameDay(d, selectedDate) && d.getHours() === hour;
    });
  };

  const totalStaffRows = staff.length || 1;
  const gridHeight = totalStaffRows * ROW_HEIGHT;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Scrollable grid */}
      <div ref={scrollRef} className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
        <div style={{ minWidth: FROZEN_WIDTH + HOURS.length * CELL_WIDTH, position: 'relative' }}>

          {/* Header row */}
          <div className="flex sticky top-0 z-20 bg-card border-b border-border">
            {/* Frozen corner */}
            <div
              className="shrink-0 sticky left-0 z-30 bg-card border-r border-border flex items-center px-4"
              style={{ width: FROZEN_WIDTH, minWidth: FROZEN_WIDTH, height: 44 }}
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff</span>
            </div>
            {/* Time headers */}
            {HOURS.map(h => (
              <div
                key={h}
                className="shrink-0 flex items-center justify-center border-r border-border"
                style={{ width: CELL_WIDTH, height: 44 }}
              >
                <span className="text-xs font-medium text-muted-foreground">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Staff rows */}
          <div style={{ position: 'relative' }}>
            {staff.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                No staff members found
              </div>
            ) : (
              staff.map((member, rowIdx) => {
                const color = member.color || getAvatarColor(member.name);
                const initials = getInitials(member.name);
                return (
                  <div key={member.id} className="flex" style={{ height: ROW_HEIGHT, borderBottom: '1px solid hsl(var(--border))' }}>
                    {/* Frozen staff cell */}
                    <div
                      className="shrink-0 sticky left-0 z-10 bg-card border-r border-border flex items-center gap-3 px-4"
                      style={{ width: FROZEN_WIDTH, minWidth: FROZEN_WIDTH }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                        style={{ background: color }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role || 'Staff Member'}</p>
                      </div>
                    </div>

                    {/* Hour cells */}
                    {HOURS.map(h => {
                      const inHours = isInBusinessHours(h);
                      const cellBookings = getBookingsForCell(member.id, h);
                      return (
                        <div
                          key={h}
                          className="shrink-0 border-r border-border relative cursor-pointer hover:bg-accent/40 transition-colors"
                          style={{
                            width: CELL_WIDTH,
                            height: ROW_HEIGHT,
                            background: inHours ? undefined : HATCH,
                          }}
                          onClick={() => !cellBookings.length && onAddBooking?.({
                            staff_id: member.id,
                            staff_name: member.name,
                            date: selectedDate,
                            hour: h,
                          })}
                        >
                          {cellBookings.map(b => {
                            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                            return (
                              <div
                                key={b.id}
                                onClick={e => { e.stopPropagation(); onSelectBooking(b); }}
                                className="absolute inset-1 rounded-lg px-2 py-1 text-xs font-medium overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                              >
                                <p className="font-semibold truncate">{b.customer_name}</p>
                                {b.service && <p className="truncate opacity-80">{b.service}</p>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

            {/* Current time indicator */}
            {showNowLine && (
              <div
                className="absolute top-0 pointer-events-none z-20"
                style={{
                  left: FROZEN_WIDTH + nowOffset,
                  height: '100%',
                  width: 2,
                  background: 'hsl(var(--primary))',
                }}
              >
                {/* Time pill */}
                <div
                  className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-primary-foreground whitespace-nowrap"
                  style={{ background: 'hsl(var(--primary))' }}
                >
                  {format(now, 'h:mm a')}
                </div>
                {/* Dot on line */}
                <div
                  className="absolute -left-1.5 top-0 w-3 h-3 rounded-full"
                  style={{ background: 'hsl(var(--primary))' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}