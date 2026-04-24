import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Building2, Save, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const TIMEZONES = ['Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Perth','Australia/Adelaide','America/New_York','America/Los_Angeles','Europe/London'];
const INDUSTRIES = ['restaurant','salon','clinic','tradie','property','gym','spa','dental','legal','removalist','other'];

export default function Settings() {
  const { business, setBusiness } = useOutletContext() || {};
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (businesses.length) setForm(businesses[0]);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await base44.entities.Business.update(form.id, form);
    if (setBusiness) setBusiness(form);
    toast.success('Settings saved');
    setSaving(false);
  };

  if (!form) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business profile</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-syne font-semibold">Business Profile</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Business Name</Label>
              <Input value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1.5" />
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({...f, industry: v}))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email || ''} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1.5" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website || ''} onChange={e => setForm(f => ({...f, website: e.target.value}))} className="mt-1.5" placeholder="https://" />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={form.address || ''} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="mt-1.5" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="mt-1.5 h-20 resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-syne font-semibold">Regional Settings</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Country</Label>
              <Select value={form.country || 'AU'} onValueChange={v => setForm(f => ({...f, country: v}))}>
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
            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone || 'Australia/Sydney'} onValueChange={v => setForm(f => ({...f, timezone: v}))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white px-8">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}