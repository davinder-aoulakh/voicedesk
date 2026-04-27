import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Building2, Save, Globe, Sparkles, Quote, Pencil, Check, X,
  Upload, Info, HelpCircle, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const TIMEZONES = [
  'Australia/Sydney','Australia/Melbourne','Australia/Brisbane',
  'Australia/Perth','Australia/Adelaide','America/New_York',
  'America/Los_Angeles','America/Chicago','Europe/London',
  'Europe/Paris','Asia/Singapore','Asia/Tokyo','Asia/Dubai',
];
const INDUSTRIES = ['restaurant','salon','clinic','tradie','property','gym','spa','dental','legal','removalist','other'];

const COUNTRY_PHONES = {
  AU: { flag: '🇦🇺', code: '+61' },
  US: { flag: '🇺🇸', code: '+1' },
  GB: { flag: '🇬🇧', code: '+44' },
  NZ: { flag: '🇳🇿', code: '+64' },
  CA: { flag: '🇨🇦', code: '+1' },
};

// ─── Tour Steps ───────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  { target: 'ai-card',      title: 'AI-Generated Content',  text: 'Generate taglines, descriptions & philosophy automatically using AI.' },
  { target: 'brand-card',   title: 'Brand Awareness',       text: 'Polish your messaging with AI or edit directly in the styled fields.' },
  { target: 'contact-card', title: 'Contact Information',   text: 'Keep your website, social links & contact details up to date.' },
  { target: 'profile-card', title: 'Business Profile',      text: 'Core details: name, industry, address, timezone and logo.' },
  { target: 'save-btn',     title: 'Save Changes',          text: 'All changes are saved at once when you click Save.' },
];

// ─── AI Polish Modal ──────────────────────────────────────────────────────────
function PolishModal({ field, original, polished, onApply, onDiscard }) {
  return (
    <Dialog open onOpenChange={onDiscard}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-syne flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI Polishing — {field}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Original</p>
            <div className="bg-secondary/50 rounded-xl p-3 text-sm leading-relaxed min-h-[80px]">{original || '(empty)'}</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">AI Polished ✨</p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm leading-relaxed min-h-[80px]">{polished}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}><X className="w-3.5 h-3.5 mr-1" /> Discard</Button>
          <Button onClick={onApply} className="gradient-primary border-0 text-white"><Check className="w-3.5 h-3.5 mr-1" /> Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quote Field ──────────────────────────────────────────────────────────────
function QuoteField({ label, value, fieldKey, onPolish, onSave, polishingKey }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value || ''); }, [value]);

  return (
    <div className="bg-secondary/40 rounded-xl p-4 relative border border-border">
      <div className="flex items-start gap-3">
        <Quote className="w-5 h-5 text-primary/30 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
          {editing ? (
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="resize-none h-24 text-sm"
              autoFocus
            />
          ) : (
            <p className="text-sm leading-relaxed text-foreground min-h-[40px]">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        {editing ? (
          <>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(value || ''); }}>Cancel</Button>
            <Button size="sm" className="gradient-primary border-0 text-white" onClick={() => { onSave(fieldKey, draft); setEditing(false); }}>
              <Check className="w-3.5 h-3.5 mr-1" /> Done
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <Button size="sm" disabled={polishingKey === fieldKey}
              className="gradient-primary border-0 text-white gap-1.5"
              onClick={() => onPolish(fieldKey, value)}>
              {polishingKey === fieldKey
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Polishing…</>
                : <><Sparkles className="w-3.5 h-3.5" /> AI Polish</>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tour Tooltip ─────────────────────────────────────────────────────────────
function TourTooltip({ step, total, onNext, onClose }) {
  const s = TOUR_STEPS[step];
  return (
    <div className="fixed bottom-8 right-8 z-50 bg-card border border-primary/30 rounded-2xl shadow-2xl p-5 w-72">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Tour {step + 1}/{total}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <p className="font-syne font-bold text-base mb-1">{s.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        {step < total - 1
          ? <Button size="sm" className="gradient-primary border-0 text-white" onClick={onNext}>Next <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
          : <Button size="sm" className="gradient-primary border-0 text-white" onClick={onClose}>Done</Button>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BusinessInfo() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [polishingKey, setPolishingKey] = useState(null);
  const [polishModal, setPolishModal] = useState(null); // { field, original, polished }
  const [tourStep, setTourStep] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (businesses.length) setForm(businesses[0]);
    };
    load();
  }, []);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await base44.entities.Business.update(form.id, form);
    toast.success('Business info saved');
    setSaving(false);
  };

  const handleGenerate = async () => {
    if (!form?.name) return toast.error('Please enter a business name first');
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate brand content for a ${form.industry || 'business'} called "${form.name}".
Return a JSON with:
- tagline: a catchy 6-10 word tagline
- description: a compelling 2-3 sentence business description  
- philosophy: a 1-2 sentence mission/values statement`,
        response_json_schema: {
          type: 'object',
          properties: {
            tagline: { type: 'string' },
            description: { type: 'string' },
            philosophy: { type: 'string' },
          }
        }
      });
      setForm(f => ({ ...f, tagline: result.tagline, description: result.description, philosophy: result.philosophy }));
      toast.success('AI content generated!');
    } catch {
      toast.error('Generation failed');
    }
    setGenerating(false);
  };

  const handlePolish = async (fieldKey, original) => {
    if (!original) return toast.error('Field is empty — add some content first');
    setPolishingKey(fieldKey);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Polish this business ${fieldKey} for a ${form?.industry || 'business'} called "${form?.name}":

"${original}"

Make it more compelling, professional, and memorable. Keep a similar length. Return only the polished text, no explanation.`
      });
      setPolishModal({ field: fieldKey, original, polished: result });
    } catch {
      toast.error('Polishing failed');
    }
    setPolishingKey(null);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setField('logo_url', file_url);
    setLogoUploading(false);
    toast.success('Logo uploaded');
  };

  if (!form) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const countryPhone = COUNTRY_PHONES[form.country || 'AU'];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Business Info</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your brand identity and business details</p>
        </div>
        <Button variant="outline" onClick={() => setTourStep(0)} className="gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4" /> Start Tour
        </Button>
      </div>

      <div className="space-y-6">
        {/* ── (a) AI-Generated Variations ── */}
        <div id="ai-card" className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-syne font-semibold text-base">AI-Generated Variations</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Automatically generate business content based on your name and industry</p>
          <Button onClick={handleGenerate} disabled={generating} className="gradient-primary border-0 text-white gap-2">
            {generating
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
              : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
          </Button>
        </div>

        {/* ── (b) Brand Awareness ── */}
        <div id="brand-card" className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Quote className="w-5 h-5 text-primary" />
            <h3 className="font-syne font-semibold text-base">Brand Awareness</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Craft compelling messages that define your brand identity</p>
          <div className="space-y-4">
            <QuoteField label="Tagline" value={form.tagline} fieldKey="tagline"
              onPolish={handlePolish} onSave={setField} polishingKey={polishingKey} />
            <QuoteField label="Description" value={form.description} fieldKey="description"
              onPolish={handlePolish} onSave={setField} polishingKey={polishingKey} />
            <QuoteField label="Philosophy" value={form.philosophy} fieldKey="philosophy"
              onPolish={handlePolish} onSave={setField} polishingKey={polishingKey} />
          </div>
        </div>

        {/* ── (c) Contact Information ── */}
        <div id="contact-card" className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-syne font-semibold text-base">Contact Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Website URL</Label>
              <Input value={form.website || ''} onChange={e => setField('website', e.target.value)} className="mt-1.5" placeholder="https://" />
            </div>
            <div>
              <Label>Privacy Policy URL</Label>
              <Input value={form.privacy_policy_url || ''} onChange={e => setField('privacy_policy_url', e.target.value)} className="mt-1.5" placeholder="https://" />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input value={form.email || ''} onChange={e => setField('email', e.target.value)} className="mt-1.5" placeholder="hello@yourbusiness.com" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <div className="flex gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-secondary border border-input rounded-md px-3 text-sm shrink-0">
                  {countryPhone?.flag} {countryPhone?.code}
                </div>
                <Input value={form.phone || ''} onChange={e => setField('phone', e.target.value)} placeholder="4xx xxx xxx" />
              </div>
            </div>
            <div>
              <Label>Instagram</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">@</span>
                <Input value={form.instagram || ''} onChange={e => setField('instagram', e.target.value)} className="pl-7" placeholder="handle" />
              </div>
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={form.facebook || ''} onChange={e => setField('facebook', e.target.value)} className="mt-1.5" placeholder="https://facebook.com/" />
            </div>
          </div>
        </div>

        {/* ── (d) Business Profile ── */}
        <div id="profile-card" className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-syne font-semibold text-base">Business Profile</h3>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-secondary/40 rounded-xl">
            {form.logo_url
              ? <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
              : <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-muted-foreground/40" />
                </div>
            }
            <div>
              <p className="text-sm font-medium mb-1">Business Logo</p>
              <label className="cursor-pointer">
                <Button size="sm" variant="outline" asChild disabled={logoUploading}>
                  <span><Upload className="w-3.5 h-3.5 mr-1.5" />{logoUploading ? 'Uploading…' : 'Upload Logo'}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Name *</Label>
              <Input value={form.name || ''} onChange={e => setField('name', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Trading Name</Label>
              <Input value={form.trading_name || ''} onChange={e => setField('trading_name', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Legal Name</Label>
              <Input value={form.legal_name || ''} onChange={e => setField('legal_name', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => setField('industry', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={form.address || ''} onChange={e => setField('address', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={form.country || 'AU'} onValueChange={v => setField('country', v)}>
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
              <Select value={form.timezone || 'Australia/Sydney'} onValueChange={v => setField('timezone', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save */}
        <div id="save-btn" className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white px-8">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* AI Polish Modal */}
      {polishModal && (
        <PolishModal
          field={polishModal.field}
          original={polishModal.original}
          polished={polishModal.polished}
          onApply={() => { setField(polishModal.field, polishModal.polished); setPolishModal(null); toast.success('Applied!'); }}
          onDiscard={() => setPolishModal(null)}
        />
      )}

      {/* Tour */}
      {tourStep !== null && (
        <TourTooltip
          step={tourStep}
          total={TOUR_STEPS.length}
          onNext={() => setTourStep(s => s + 1)}
          onClose={() => setTourStep(null)}
        />
      )}
    </div>
  );
}