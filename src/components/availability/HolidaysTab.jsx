import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
      style={{ background: checked ? '#6C3BFF' : '#D1D5DB' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// Format a holiday date string to "Next: Day Month Year"
function nextOccurrence(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  if (d >= today) return d;
  d.setFullYear(today.getFullYear() + 1);
  return d;
}

export default function HolidaysTab({ business, location }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [masterOn, setMasterOn] = useState(false);
  const [enabled, setEnabled]   = useState({});

  const countryCode = business?.country || location?.country || 'AU';
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setHolidays(data);
      } catch {
        setHolidays([]);
      }
      setLoading(false);
    };
    fetchHolidays();
  }, [countryCode, year]);

  const handleMasterToggle = (val) => {
    setMasterOn(val);
    if (!val) {
      setEnabled({});
    } else {
      const all = {};
      holidays.forEach(h => { all[h.date] = false; });
      setEnabled(all);
    }
  };

  const toggleHoliday = (date, val) => {
    setEnabled(e => ({ ...e, [date]: val }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-syne font-semibold text-base">Holiday schedule</h2>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-lg">
          Speako automatically blocks your availability on public holidays based on your location's country and state.
        </p>
      </div>

      {/* Master toggle card */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Holiday schedule — {location?.name || business?.name || 'Main Location'}
          </span>
        </div>
        <Toggle checked={masterOn} onChange={handleMasterToggle} />
      </div>

      {/* Holiday list */}
      {loading ? (
        <div className="space-y-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No public holidays found for {countryCode}.
        </p>
      ) : (
        <div className="space-y-1.5">
          {holidays.map((h) => {
            const next = nextOccurrence(h.date);
            const isEnabled = !!enabled[h.date];
            return (
              <div key={h.date}
                className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{h.localName || h.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Next: {format(next, 'd MMM yyyy')}
                  </p>
                </div>
                <Toggle checked={isEnabled} onChange={(val) => toggleHoliday(h.date, val)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}