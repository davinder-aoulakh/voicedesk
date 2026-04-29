import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Phone, Check, ChevronDown, ChevronUp, Search, Mic, MessageSquare,
  RefreshCw, AlertCircle, Zap, PhoneCall, PhoneIncoming, Calendar,
  Link2, Info, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const COUNTRY_INFO = {
  AU: { flag: '🇦🇺', name: 'Australia',     dial: '+61' },
  US: { flag: '🇺🇸', name: 'United States', dial: '+1' },
  GB: { flag: '🇬🇧', name: 'United Kingdom',dial: '+44' },
  NZ: { flag: '🇳🇿', name: 'New Zealand',   dial: '+64' },
  CA: { flag: '🇨🇦', name: 'Canada',        dial: '+1' },
  IE: { flag: '🇮🇪', name: 'Ireland',       dial: '+353' },
  DE: { flag: '🇩🇪', name: 'Germany',       dial: '+49' },
  FR: { flag: '🇫🇷', name: 'France',        dial: '+33' },
  NL: { flag: '🇳🇱', name: 'Netherlands',   dial: '+31' },
  SE: { flag: '🇸🇪', name: 'Sweden',        dial: '+46' },
  SG: { flag: '🇸🇬', name: 'Singapore',     dial: '+65' },
  JP: { flag: '🇯🇵', name: 'Japan',         dial: '+81' },
  ZA: { flag: '🇿🇦', name: 'South Africa',  dial: '+27' },
  IN: { flag: '🇮🇳', name: 'India',         dial: '+91' },
};

// ─── Confirm Provision Modal ──────────────────────────────────────────────────
function ConfirmModal({ number, onConfirm, onCancel, provisioning }) {
  const c = COUNTRY_INFO[number.country_code] || {};
  return (
    <Dialog open onOpenChange={provisioning ? undefined : onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-syne">Confirm Phone Number</DialogTitle>
        </DialogHeader>
        <div className="py-3 space-y-4">
          <div className="bg-accent/50 rounded-xl p-4 flex items-center gap-4">
            <span className="text-3xl">{c.flag || '📞'}</span>
            <div>
              <p className="font-syne font-bold text-lg">{number.friendly_name}</p>
              <p className="text-sm text-muted-foreground">{number.country_name} · {number.region || 'Local'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Monthly Cost</p>
              <p className="font-semibold">{number.monthly_cost || '$2.00'}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Capabilities</p>
              <p className="font-semibold flex gap-1.5">
                {number.capabilities?.voice && <span className="text-success">Voice</span>}
                {number.capabilities?.sms && <span className="text-primary">SMS</span>}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            This number will be provisioned from your Twilio account and linked to your AI agent. Provisioning may take 5–15 seconds.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={provisioning}>Cancel</Button>
          <Button onClick={onConfirm} disabled={provisioning} className="gradient-primary border-0 text-white gap-2">
            {provisioning
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</>
              : <><Check className="w-4 h-4" /> Confirm & Provision</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Number Picker (state A) ──────────────────────────────────────────────────
function NumberPicker({ defaultCountry, business, agent, onProvisioned }) {
  const [country, setCountry] = useState(defaultCountry || 'AU');
  const [numbers, setNumbers] = useState([]);
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [provisioning, setProvisioning] = useState(false);
  const [supportedCountries, setSupportedCountries] = useState([]);

  const fetchNumbers = async (reset = true) => {
    setLoading(true);
    const newPage = reset ? 0 : page + 1;
    if (reset) { setNumbers([]); setPage(0); setAllLoaded(false); }
    const res = await base44.functions.invoke('searchAvailableNumbers', {
      country_code: country,
      page: newPage,
      page_size: 10,
    });
    const list = res.data?.numbers || [];
    if (res.data?.supported_countries?.length && supportedCountries.length === 0) {
      setSupportedCountries(res.data.supported_countries);
    }
    if (reset) {
      setNumbers(list);
    } else {
      setNumbers(prev => [...prev, ...list]);
      setPage(newPage);
    }
    if (list.length < 10) setAllLoaded(true);
    setLoading(false);
  };

  useEffect(() => { fetchNumbers(true); }, [country]);

  const handleProvision = async () => {
    if (!confirmTarget) return;
    setProvisioning(true);
    try {
      // Provision (purchase) the number
      const provRes = await base44.functions.invoke('provisionPhoneNumber', {
        business_id: business.id,
        country: confirmTarget.country_code,
      });
      if (provRes.data?.error) throw new Error(provRes.data.error);

      const { phone_number, phone_sid } = provRes.data;

      // Save to business
      await base44.entities.Business.update(business.id, {
        twilio_phone_number: phone_number,
        twilio_phone_sid: phone_sid,
      });

      // Atomically link to VAPI if agent exists
      if (agent?.vapi_assistant_id) {
        const activateRes = await base44.functions.invoke('activateVapiAgent', {
          business_id: business.id,
          assistant_id: agent.vapi_assistant_id,
          phone_number,
          phone_sid,
        });
        if (activateRes.data?.error) {
          toast.warning('Number provisioned but VAPI link failed: ' + activateRes.data.error);
        }
      }

      toast.success('Phone number provisioned successfully!');
      setConfirmTarget(null);
      onProvisioned(phone_number, phone_sid);
    } catch (err) {
      toast.error('Provisioning failed: ' + err.message);
    }
    setProvisioning(false);
  };

  const filtered = numbers.filter(n =>
    !regionFilter || (n.region || '').toLowerCase().includes(regionFilter.toLowerCase()) ||
    n.friendly_name.includes(regionFilter)
  );

  const countryList = supportedCountries.length > 0
    ? supportedCountries
    : Object.entries(COUNTRY_INFO).map(([code, info]) => ({ code, ...info }));

  return (
    <div className="space-y-5">
      {/* Country + Region filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="min-w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Country</Label>
          <Select value={country} onValueChange={v => setCountry(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countryList.map(c => {
                const info = COUNTRY_INFO[c.code] || c;
                return (
                  <SelectItem key={c.code} value={c.code}>
                    {info.flag || c.flag} {info.name || c.name} ({info.dial || ''})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by region / city</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
              placeholder="e.g. Sydney, London..." className="pl-9" />
          </div>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={() => fetchNumbers(true)} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading && numbers.length === 0 ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Phone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No numbers found for this country/region</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
              <span>Phone Number</span>
              <span>Region</span>
              <span>Capabilities</span>
              <span>Monthly</span>
              <span></span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((num, i) => {
                const c = COUNTRY_INFO[num.country_code] || {};
                return (
                  <div key={i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-2.5 font-medium text-sm">
                      <span className="text-lg">{num.country_flag || c.flag}</span>
                      {num.friendly_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{num.region || '—'}</div>
                    <div className="flex gap-1 flex-wrap">
                      {num.capabilities?.voice && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded-md font-medium">
                          <Mic className="w-3 h-3" /> Voice
                        </span>
                      )}
                      {num.capabilities?.sms && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-medium">
                          <MessageSquare className="w-3 h-3" /> SMS
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium">{num.monthly_cost || '$2.00'}</div>
                    <Button size="sm" onClick={() => setConfirmTarget(num)}
                      className="gradient-primary border-0 text-white shrink-0 text-xs">
                      Select
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {!allLoaded && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchNumbers(false)} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {confirmTarget && (
        <ConfirmModal
          number={confirmTarget}
          provisioning={provisioning}
          onConfirm={handleProvision}
          onCancel={() => !provisioning && setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Active Number Card (state B) ────────────────────────────────────────────
function ActiveNumber({ business, agent, callStats, onChangeNumber }) {
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState({ phone_number: '', account_sid: '', auth_token: '' });
  const [importing, setImporting] = useState(false);

  const flag = COUNTRY_INFO[business?.country]?.flag || '📞';
  const vapiLinked = !!(agent?.vapi_assistant_id && business?.vapi_phone_number_id);

  const handleImport = async () => {
    if (!importForm.phone_number || !importForm.account_sid || !importForm.auth_token) {
      return toast.error('All fields are required');
    }
    if (!agent?.vapi_assistant_id) return toast.error('No AI agent configured yet');
    setImporting(true);
    try {
      const res = await base44.functions.invoke('linkVapiPhoneNumber', {
        business_id: business.id,
        assistant_id: agent.vapi_assistant_id,
        twilio_phone_number: importForm.phone_number,
        twilio_phone_sid: importForm.account_sid, // using SID as phone_sid for import
      });
      if (res.data?.error) throw new Error(res.data.error);
      await base44.entities.Business.update(business.id, {
        twilio_phone_number: importForm.phone_number,
      });
      toast.success('Number imported and linked to VAPI!');
      setImportOpen(false);
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-5">
      {/* Active number card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
              {flag}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <p className="font-syne font-bold text-xl">{business.twilio_phone_number}</p>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">● Active</span>
              </div>
              <p className="text-sm text-muted-foreground">{COUNTRY_INFO[business.country]?.name || 'Unknown Country'}</p>
              <a href="#" className="text-sm text-primary font-medium mt-1 inline-block hover:underline">
                Set up call forwarding →
              </a>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onChangeNumber} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Change Number
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
          {[
            { label: 'Today', value: callStats.today, Icon: PhoneCall },
            { label: 'This Week', value: callStats.week, Icon: PhoneIncoming },
            { label: 'This Month', value: callStats.month, Icon: Calendar },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="text-center">
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-syne font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* VAPI status */}
        <div className={`mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${vapiLinked ? 'bg-success/10' : 'bg-warning/10'}`}>
          <div className={`w-2 h-2 rounded-full ${vapiLinked ? 'bg-success' : 'bg-warning'}`} />
          <Zap className={`w-4 h-4 ${vapiLinked ? 'text-success' : 'text-warning'}`} />
          <span className={`text-sm font-medium ${vapiLinked ? 'text-success' : 'text-warning'}`}>
            {vapiLinked ? 'VAPI Agent Linked' : 'VAPI Agent not linked yet'}
          </span>
          {!vapiLinked && (
            <span className="text-xs text-muted-foreground ml-auto">Go to Agent settings to configure</span>
          )}
        </div>
      </div>

      {/* Import Your Own Number */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setImportOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Import Your Own Number</span>
            <span className="text-xs text-muted-foreground">Bring an existing Twilio number</span>
          </div>
          {importOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {importOpen && (
          <div className="px-6 pb-5 pt-1 border-t border-border space-y-4">
            <div>
              <Label>Phone Number</Label>
              <Input value={importForm.phone_number}
                onChange={e => setImportForm(f => ({ ...f, phone_number: e.target.value }))}
                className="mt-1.5" placeholder="+61 2 xxxx xxxx" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Twilio Account SID</Label>
                <Input value={importForm.account_sid}
                  onChange={e => setImportForm(f => ({ ...f, account_sid: e.target.value }))}
                  className="mt-1.5" placeholder="ACxxxxxxxx..." />
              </div>
              <div>
                <Label>Twilio Auth Token</Label>
                <Input type="password" value={importForm.auth_token}
                  onChange={e => setImportForm(f => ({ ...f, auth_token: e.target.value }))}
                  className="mt-1.5" placeholder="••••••••••••" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Your Twilio credentials are sent securely and used only to link the number.
            </div>
            <Button onClick={handleImport} disabled={importing} className="gradient-primary border-0 text-white gap-2">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Link2 className="w-4 h-4" /> Import Number</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PhonePage() {
  const [business, setBusiness] = useState(null);
  const [agent, setAgent] = useState(null);
  const [callStats, setCallStats] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const [businesses, calls] = await Promise.all([
        base44.entities.Business.filter({ owner_id: user.id }),
        base44.entities.CallLog.filter({ business_id: '' }, '-created_date', 1), // pre-warm
      ]);
      if (!businesses.length) { setLoading(false); return; }
      const biz = businesses[0];
      setBusiness(biz);

      const [agents, allCalls] = await Promise.all([
        base44.entities.Agent.filter({ business_id: biz.id }),
        base44.entities.CallLog.filter({ business_id: biz.id }, '-created_date', 500),
      ]);
      if (agents.length) setAgent(agents[0]);

      // Compute stats
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const weekAgo = new Date(now - 7 * 86400000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      setCallStats({
        today: allCalls.filter(c => c.created_date?.slice(0, 10) === todayStr).length,
        week:  allCalls.filter(c => new Date(c.created_date) >= weekAgo).length,
        month: allCalls.filter(c => new Date(c.created_date) >= monthAgo).length,
      });
      setLoading(false);
    };
    load();
  }, []);

  const handleProvisioned = async (phone_number, phone_sid) => {
    setBusiness(prev => ({ ...prev, twilio_phone_number: phone_number, twilio_phone_sid: phone_sid }));
    setShowPicker(false);
  };

  const hasNumber = !!(business?.twilio_phone_number);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Phone Number</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your AI agent's phone number and call forwarding settings</p>
      </div>

      {hasNumber && !showPicker ? (
        <ActiveNumber
          business={business}
          agent={agent}
          callStats={callStats}
          onChangeNumber={() => setShowPicker(true)}
        />
      ) : (
        <div className="space-y-5">
          {hasNumber && (
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" size="sm" onClick={() => setShowPicker(false)} className="gap-1.5">
                ← Back to current number
              </Button>
              <span className="text-sm text-muted-foreground">Choosing a new number will replace your existing one</span>
            </div>
          )}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <Phone className="w-5 h-5 text-primary" />
              <h3 className="font-syne font-semibold">Choose a Phone Number</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Select a number for your AI agent to receive calls on</p>
            {business && (
              <NumberPicker
                defaultCountry={business.country || 'AU'}
                business={business}
                agent={agent}
                onProvisioned={handleProvisioned}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}