import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, Save, ToggleLeft, ToggleRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
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

const DEFAULT_HOURS = {
  monday:    { open: true,  open_time: '09:00', close_time: '17:00' },
  tuesday:   { open: true,  open_time: '09:00', close_time: '17:00' },
  wednesday: { open: true,  open_time: '09:00', close_time: '17:00' },
  thursday:  { open: true,  open_time: '09:00', close_time: '17:00' },
  friday:    { open: true,  open_time: '09:00', close_time: '17:00' },
  saturday:  { open: true,  open_time: '09:00', close_time: '14:00' },
  sunday:    { open: false, open_time: '10:00', close_time: '15:00' },
};

function TimeSelect({ value, onChange, label }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 h-9 text-sm">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {TIMES.map(t => <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function BusinessHours() {
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', label: '' });

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      const biz = businesses[0];
      setBusinessId(biz.id);
      if (biz.business_hours) {
        setHours({ ...DEFAULT_HOURS, ...biz.business_hours });
      }
      if (biz.holidays) setHolidays(biz.holidays);
      setLoading(false);
    };
    load();
  }, []);

  const toggleDay = (day) => {
    setHours(h => ({ ...h, [day]: { ...h[day], open: !h[day].open } }));
  };

  const updateTime = (day, field, value) => {
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Business.update(businessId, { business_hours: hours, holidays });
    toast.success('Business hours saved');
    setSaving(false);
  };

  const addHoliday = () => {
    if (!newHoliday.date) return;
    setHolidays(h => [...h, { ...newHoliday }]);
    setNewHoliday({ date: '', label: '' });
  };

  const removeHoliday = (idx) => setHolidays(h => h.filter((_, i) => i !== idx));

  const applyToAll = (day) => {
    const src = hours[day];
    setHours(h => {
      const updated = { ...h };
      DAYS.forEach(d => {
        if (updated[d.key].open) {
          updated[d.key] = { ...updated[d.key], open_time: src.open_time, close_time: src.close_time };
        }
      });
      return updated;
    });
    toast.success('Times applied to all open days');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Business Hours</h1>
          <p className="text-muted-foreground mt-1">Set when your AI agent accepts bookings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white shadow-lg shadow-primary/20">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Hours'}
        </Button>
      </div>

      {/* Weekly hours */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="font-syne font-semibold mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Weekly Schedule
        </h3>
        <div className="space-y-3">
          {DAYS.map((day, i) => {
            const dayHours = hours[day.key] || { open: false, open_time: '09:00', close_time: '17:00' };
            return (
              <motion.div key={day.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${dayHours.open ? 'border-border bg-background' : 'border-dashed border-border bg-secondary/30 opacity-60'}`}>
                {/* Toggle */}
                <button onClick={() => toggleDay(day.key)} className="shrink-0">
                  {dayHours.open
                    ? <ToggleRight className="w-6 h-6 text-success" />
                    : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                </button>

                {/* Day name */}
                <span className="w-28 font-medium text-sm shrink-0">{day.label}</span>

                {dayHours.open ? (
                  <>
                    <TimeSelect value={dayHours.open_time} onChange={v => updateTime(day.key, 'open_time', v)} label="Open" />
                    <span className="text-muted-foreground text-sm">to</span>
                    <TimeSelect value={dayHours.close_time} onChange={v => updateTime(day.key, 'close_time', v)} label="Close" />
                    <button onClick={() => applyToAll(day.key)}
                      className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 hidden sm:block">
                      Apply to all
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Closed</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Holiday overrides */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-syne font-semibold mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Holiday Closures
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Dates when you'll be closed (e.g. public holidays, shutdowns)</p>

        {/* Add holiday */}
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={newHoliday.date}
            onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))}
            className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <input
            type="text"
            value={newHoliday.label}
            onChange={e => setNewHoliday(h => ({ ...h, label: e.target.value }))}
            placeholder="e.g. Christmas Day"
            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button variant="outline" onClick={addHoliday}><Plus className="w-4 h-4" /></Button>
        </div>

        {holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No holiday closures added</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg">
                <div>
                  <span className="text-sm font-medium">{h.label || 'Closed'}</span>
                  <span className="text-xs text-muted-foreground ml-2">{h.date}</span>
                </div>
                <button onClick={() => removeHoliday(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}