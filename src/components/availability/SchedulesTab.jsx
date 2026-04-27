import { useState } from 'react';
import { MapPin, Globe, RefreshCw, Copy, X, Plus, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

export const DEFAULT_HOURS = {
  sunday:    { slots: [] },
  monday:    { slots: [{ start: '07:00', end: '18:00' }] },
  tuesday:   { slots: [{ start: '07:00', end: '18:00' }] },
  wednesday: { slots: [{ start: '07:00', end: '18:00' }] },
  thursday:  { slots: [{ start: '07:00', end: '18:00' }] },
  friday:    { slots: [{ start: '07:00', end: '18:00' }] },
  saturday:  { slots: [{ start: '08:00', end: '16:00' }] },
};

// Migrate old format { open, open_time, close_time } → new slot format
export function migrateHours(raw) {
  if (!raw) return DEFAULT_HOURS;
  const result = {};
  for (const day of DAYS) {
    const d = raw[day.key];
    if (!d) { result[day.key] = { slots: [] }; continue; }
    if (d.slots) { result[day.key] = d; continue; }
    // old format
    if (d.open && d.open_time && d.close_time) {
      result[day.key] = { slots: [{ start: d.open_time, end: d.close_time }] };
    } else {
      result[day.key] = { slots: [] };
    }
  }
  return result;
}

function TimeSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-28 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {TIMES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function SchedulesTab({ hours, setHours, business, location, version, onSave, saving }) {
  const totalSlots = DAYS.reduce((acc, d) => acc + (hours[d.key]?.slots?.length || 0), 0);

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
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-syne font-semibold text-base">Weekly Hours</h2>
        <Button onClick={onSave} disabled={saving} size="sm" className="gradient-primary border-0 text-white gap-1.5">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl text-sm flex-wrap gap-y-2">
        <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
          {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
        </span>
        {location && (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin className="w-3.5 h-3.5" /> {location.name}
          </span>
        )}
        {business?.timezone && (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Globe className="w-3.5 h-3.5" /> {business.timezone}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-muted-foreground text-xs">
          {version}/1 <RefreshCw className="w-3 h-3" />
        </span>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        When you add a new time slot, the service duration is set to 60 minutes by default.
      </div>

      {/* Day rows */}
      <div className="space-y-1">
        {DAYS.map((day) => {
          const dayData = hours[day.key] || { slots: [] };
          const hasSlots = dayData.slots.length > 0;

          return (
            <div key={day.key} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Day header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasSlots ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium text-sm flex-1">{day.label}</span>
                {hasSlots && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {dayData.slots.length} slot{dayData.slots.length !== 1 ? 's' : ''}
                  </span>
                )}
                <button onClick={() => addSlot(day.key)}
                  className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slot rows */}
              {dayData.slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2 border-t border-border bg-secondary/20">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">Standard Hours</span>
                  <TimeSelect value={slot.start} onChange={v => updateSlot(day.key, idx, 'start', v)} />
                  <span className="text-muted-foreground text-xs">–</span>
                  <TimeSelect value={slot.end} onChange={v => updateSlot(day.key, idx, 'end', v)} />
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => duplicateSlot(day.key, idx)}
                      className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeSlot(day.key, idx)}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}