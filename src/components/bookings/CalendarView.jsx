import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_DOT = {
  pending:   'bg-warning',
  confirmed: 'bg-success',
  completed: 'bg-primary',
  cancelled: 'bg-destructive',
  no_show:   'bg-muted-foreground',
};

const STATUS_PILL = {
  pending:   'text-warning bg-warning/10',
  confirmed: 'text-success bg-success/10',
  completed: 'text-primary bg-accent',
  cancelled: 'text-destructive bg-destructive/10',
  no_show:   'text-muted-foreground bg-secondary',
};

export default function CalendarView({ bookings, onSelectBooking }) {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build grid of weeks
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

  const selectedBookings = selectedDay ? bookingsForDay(selectedDay) : [];

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* Calendar grid */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-syne font-semibold text-lg">{format(current, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrent(subMonths(current, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())} className="text-xs px-3">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrent(addMonths(current, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

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
            const isSelected = selectedDay && isSameDay(d, selectedDay);
            const todayDay = isToday(d);

            return (
              <button key={i} onClick={() => setSelectedDay(isSameDay(d, selectedDay) ? null : d)}
                className={`min-h-[72px] p-1.5 border-b border-r border-border text-left transition-colors relative
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-accent' : 'hover:bg-secondary/50'}
                `}>
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail sidebar */}
      <div className="w-full lg:w-72 shrink-0">
        {selectedDay ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-accent/50">
              <p className="font-syne font-semibold">{format(selectedDay, 'EEEE, MMMM d')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="divide-y divide-border">
              {selectedBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No bookings this day</p>
              ) : (
                selectedBookings
                  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                  .map(b => (
                    <button key={b.id} onClick={() => onSelectBooking(b)}
                      className="w-full text-left p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[b.status] || 'bg-muted'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{b.customer_name}</p>
                          {b.service && <p className="text-xs text-muted-foreground truncate">{b.service}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(b.scheduled_at), 'h:mm a')}
                            {b.service_duration_minutes ? ` · ${b.service_duration_minutes}min` : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_PILL[b.status] || ''}`}>
                          {b.status}
                        </span>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Click a day to see its bookings</p>
          </div>
        )}
      </div>
    </div>
  );
}