import { Copy, X, Plus, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS = [
  { key: 'sunday',    label: 'Sunday' },
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',   label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday' },
  { key: 'friday',    label: 'Friday' },
  { key: 'saturday',  label: 'Saturday' },
];

const TIMES = [];
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    TIMES.push({ value: `${hh}:${mm}`, label: `${displayH}:${mm} ${ampm}` });
  }
}

const EMPTY_HOURS = {
  sunday:    { slots: [] },
  monday:    { slots: [] },
  tuesday:   { slots: [] },
  wednesday: { slots: [] },
  thursday:  { slots: [] },
  friday:    { slots: [] },
  saturday:  { slots: [] },
};

function TimeSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-56">
        {TIMES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function StaffScheduleTab({ workingHours, onChange }) {
  const hours = workingHours || EMPTY_HOURS;

  const setHours = (updater) => {
    const next = typeof updater === 'function' ? updater(hours) : updater;
    onChange(next);
  };

  const addSlot = (dayKey) => {
    setHours(h => {
      const slots = [...(h[dayKey]?.slots || []), { start: '09:00', end: '17:00' }];
      return { ...h, [dayKey]: { slots } };
    });
  };

  const removeSlot = (dayKey, idx) => {
    setHours(h => {
      const slots = (h[dayKey]?.slots || []).filter((_, i) => i !== idx);
      return { ...h, [dayKey]: { slots } };
    });
  };

  const duplicateSlot = (dayKey, idx) => {
    setHours(h => {
      const slots = [...(h[dayKey]?.slots || [])];
      slots.splice(idx + 1, 0, { ...slots[idx] });
      return { ...h, [dayKey]: { slots } };
    });
  };

  const updateSlot = (dayKey, idx, field, value) => {
    setHours(h => {
      const slots = [...(h[dayKey]?.slots || [])];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...h, [dayKey]: { slots } };
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Personal schedule overrides the business hours for this staff member. Leave all days empty to use business defaults.
      </div>

      {DAYS.map((day) => {
        const dayData = hours[day.key] || { slots: [] };
        const hasSlots = dayData.slots.length > 0;

        return (
          <div key={day.key} className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${hasSlots ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium text-sm flex-1">{day.label}</span>
              {hasSlots && (
                <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">
                  {dayData.slots.length} slot{dayData.slots.length !== 1 ? 's' : ''}
                </span>
              )}
              <button onClick={() => addSlot(day.key)}
                className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {dayData.slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 border-t border-border">
                <span className="text-xs text-muted-foreground w-20 shrink-0">Hours</span>
                <TimeSelect value={slot.start} onChange={v => updateSlot(day.key, idx, 'start', v)} />
                <span className="text-xs text-muted-foreground">–</span>
                <TimeSelect value={slot.end} onChange={v => updateSlot(day.key, idx, 'end', v)} />
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => duplicateSlot(day.key, idx)}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeSlot(day.key, idx)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}