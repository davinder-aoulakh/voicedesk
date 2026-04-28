import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import SchedulesTab, { DEFAULT_HOURS, migrateHours } from '@/components/availability/SchedulesTab';
import DateSpecificTab from '@/components/availability/DateSpecificTab';
import HolidaysTab from '@/components/availability/HolidaysTab';

const TABS = ['Schedules', 'Date-specific hours', 'Holidays'];

export default function BusinessHours() {
  const [tab, setTab]             = useState('Schedules');
  const [hours, setHours]         = useState(DEFAULT_HOURS);
  const [overrides, setOverrides] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [business, setBusiness]   = useState(null);
  const [location, setLocation]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [version, setVersion]     = useState(1);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      const biz = businesses[0];
      setBusiness(biz);
      setBusinessId(biz.id);
      setHours(migrateHours(biz.business_hours));
      setOverrides(biz.holidays || []);

      const locs = await base44.entities.Location.filter({ business_id: biz.id });
      const primaryLoc = locs.find(l => l.is_primary) || locs[0] || null;
      setLocation(primaryLoc);
      // Load hours from primary location first, fall back to business
      if (primaryLoc?.business_hours && Object.keys(primaryLoc.business_hours).length > 0) {
        setHours(migrateHours(primaryLoc.business_hours));
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const saves = [base44.entities.Business.update(businessId, { business_hours: hours, holidays: overrides })];
    if (location) saves.push(base44.entities.Location.update(location.id, { business_hours: hours }));
    await Promise.all(saves);
    setVersion(v => v + 1);
    toast.success('Availability saved');
    setSaving(false);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Availability</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your schedules, date-specific hours, and holidays</p>
        </div>
        <button className="text-sm text-primary font-medium hover:underline mt-1">Start Tour</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Schedules' && (
        <SchedulesTab
          hours={hours}
          setHours={setHours}
          business={business}
          location={location}
          version={version}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {tab === 'Date-specific hours' && (
        <DateSpecificTab
          overrides={overrides}
          setOverrides={(val) => {
            setOverrides(typeof val === 'function' ? val(overrides) : val);
          }}
        />
      )}
      {tab === 'Holidays' && (
        <HolidaysTab business={business} location={location} />
      )}
    </div>
  );
}