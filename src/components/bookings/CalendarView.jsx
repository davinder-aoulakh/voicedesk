import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';

const STATUS_PILL = {
  pending:   'text-warning bg-warning/10',
  confirmed: 'text-success bg-success/10',
  completed: 'text-primary bg-accent',
  cancelled: 'text-destructive bg-destructive/10',
  no_show:   'text-muted-foreground bg-secondary',
};

export default function CalendarView({ bookings, onSelectBooking, onDayClick, selectedDate }) {
  const current = selectedDate || new Date();

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const bookingsForDay = (d) =>
    bookings.filter(b => b.scheduled_at && isSameDay(parseISO(b.scheduled_at), d));

  const handleDayClick = (d) => {
    const dayBookings = bookingsForDay(d);
    if (dayBookings.length > 0) {
      onSelectBooking(dayBookings[0]);
    } else if (onDayClick) {
      onDayClick(d);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {weeks.flat().map((d, i) => {
          const dayBookings = bookingsForDay(d);
          const isCurrentMonth = isSameMonth(d, current);
          const todayDay = isToday(d);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(d)}
              className={`min-h-[100px] p-1.5 border-b border-r text-left transition-colors relative
                ${todayDay ? 'border-2 border-primary' : 'border-border'}
                ${!isCurrentMonth ? 'opacity-40' : 'hover:bg-secondary/50'}
              `}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1
                ${todayDay ? 'bg-primary text-primary-foreground' : 'text-foreground'}
              `}>
                {format(d, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 2).map(b => (
                  <div key={b.id}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate cursor-pointer
                      ${STATUS_PILL[b.status] || 'bg-secondary text-foreground'}`}
                    onClick={e => { e.stopPropagation(); onSelectBooking(b); }}>
                    <span className="truncate font-medium">{b.customer_name}</span>
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-xs text-muted-foreground pl-1.5">+{dayBookings.length - 2} more</div>
                )}
              </div>
              {dayBookings.length === 0 && (
                <p className={`text-xs absolute bottom-2 left-0 right-0 text-center
                  ${isCurrentMonth ? 'text-muted-foreground/50' : 'text-muted-foreground/30'}
                `}>
                  No events
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}