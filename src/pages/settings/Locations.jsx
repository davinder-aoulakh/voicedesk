import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Plus, Pencil, Trash2, Phone, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const TIMEZONES = [
  'Australia/Sydney','Australia/Melbourne','Australia/Brisbane',
  'Australia/Perth','Australia/Adelaide','America/New_York',
  'America/Los_Angeles','America/Chicago','Europe/London',
  'Europe/Paris','Asia/Singapore','Asia/Tokyo','Asia/Dubai',
];

const EMPTY = { name: '', address: '', city: '', state: '', country: 'AU', postcode: '', timezone: 'Australia/Sydney', phone_number: '' };

function LocationForm({ location, onClose, onSave }) {
  const isNew = !location;
  const [form, setForm] = useState(location || EMPTY);
  const [saving, setSaving] = useState(false);

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'Add Location' : 'Edit Location'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Location Name *</Label>
            <Input value={form.name} onChange={e => f('name', e.target.value)} className="mt-1.5" placeholder="e.g. Main Branch" autoFocus />
          </div>
          <div>
            <Label>Full Address</Label>
            <Input value={form.address} onChange={e => f('address', e.target.value)} className="mt-1.5" placeholder="123 Main Street" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => f('city', e.target.value)} className="mt-1.5" placeholder="Sydney" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={e => f('state', e.target.value)} className="mt-1.5" placeholder="NSW" />
            </div>
            <div>
              <Label>Postcode</Label>
              <Input value={form.postcode} onChange={e => f('postcode', e.target.value)} className="mt-1.5" placeholder="2000" />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={form.country} onValueChange={v => f('country', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                  <SelectItem value="US">🇺🇸 United States</SelectItem>
                  <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="NZ">🇳🇿 New Zealand</SelectItem>
                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select value={form.timezone} onValueChange={v => f('timezone', v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={form.phone_number} onChange={e => f('phone_number', e.target.value)} className="mt-1.5" placeholder="+61 2 xxxx xxxx" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Saving…' : isNew ? 'Add Location' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | location object

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    setBusinessId(businesses[0].id);
    const locs = await base44.entities.Location.filter({ business_id: businesses[0].id });
    setLocations(locs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (form.id) {
      await base44.entities.Location.update(form.id, form);
      toast.success('Location updated');
    } else {
      await base44.entities.Location.create({ ...form, business_id: businessId });
      toast.success('Location added');
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Location.delete(id);
    setLocations(prev => prev.filter(l => l.id !== id));
    toast.success('Location removed');
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your business locations and branches</p>
        </div>
        <Button onClick={() => setModal('new')} className="gradient-primary border-0 text-white gap-1.5">
          <Plus className="w-4 h-4" /> Add Location
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : locations.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-syne font-bold text-lg mb-1">No locations yet</h3>
          <p className="text-muted-foreground text-sm mb-5">Add your first business location to get started</p>
          <Button onClick={() => setModal('new')} className="gradient-primary border-0 text-white gap-1.5">
            <Plus className="w-4 h-4" /> Add First Location
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-syne font-bold text-base">{loc.name}</p>
                  {loc.is_primary && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">Primary</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {(loc.address || loc.city) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {[loc.address, loc.city, loc.state, loc.postcode].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {loc.phone_number && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" /> {loc.phone_number}
                    </span>
                  )}
                  {loc.timezone && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> {loc.timezone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal(loc)} className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                  <Pencil className="w-4 h-4 text-blue-500" />
                </button>
                <button onClick={() => handleDelete(loc.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <LocationForm
          location={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}