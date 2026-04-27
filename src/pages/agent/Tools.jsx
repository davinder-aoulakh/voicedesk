import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Save, Settings, X, Calendar, UserCheck, Clock,
  MapPin, ShoppingBag, Wrench, Phone, Plus, Trash2, Info
} from 'lucide-react';

// ─── Toggle ──────────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ background: checked ? '#6C3BFF' : '#d1d5db' }}
    >
      <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  );
}

// ─── Configure Panel ──────────────────────────────────────────────────────────
function ConfigPanel({ toolId, config, onChange, onClose }) {
  const [local, setLocal] = useState(config || {});
  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const handleSave = () => { onChange(local); onClose(); };

  const RadioGroup = ({ label, field, options }) => (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</Label>
      <div className="space-y-2">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={field} value={opt.value} checked={local[field] === opt.value}
              onChange={() => set(field, opt.value)} className="accent-[#6C3BFF]" />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <ToggleSwitch checked={!!local[field]} onChange={v => set(field, v)} />
    </div>
  );

  const [newPhrase, setNewPhrase] = useState('');
  const addPhrase = () => {
    if (!newPhrase.trim()) return;
    set('trigger_phrases', [...(local.trigger_phrases || []), newPhrase.trim()]);
    setNewPhrase('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-syne font-semibold">Configure Settings</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Booking Manager */}
        {toolId === 'booking_manager' && (
          <>
            <RadioGroup label="Booking Mode" field="booking_mode" options={[
              { value: 'ai_handling',       label: 'AI Handling — Agent books directly' },
              { value: 'staff_transfer',    label: 'Staff Transfer — Connect to a team member' },
              { value: 'send_booking_link', label: 'Send Booking Link — Send link via SMS/Email' },
            ]} />
            <div className="space-y-1 border-t border-border pt-4">
              <Toggle label="Confirm booking by reading details back" field="confirm_readback" />
              <Toggle label="Allow customers to modify bookings"       field="allow_modification" />
              <Toggle label="Allow customers to cancel bookings"       field="allow_cancellation" />
            </div>
          </>
        )}

        {/* Transfer to Human */}
        {toolId === 'transfer_human' && (
          <>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Destination Phone Number</Label>
              <Input value={local.destination_phone || ''} onChange={e => set('destination_phone', e.target.value)} placeholder="+61 4xx xxx xxx" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Trigger Phrases</Label>
              <div className="flex gap-2 mb-2">
                <Input value={newPhrase} onChange={e => setNewPhrase(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPhrase()}
                  placeholder="e.g. speak to a person" className="text-sm flex-1" />
                <Button size="sm" variant="outline" onClick={addPhrase}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(local.trigger_phrases || []).map((p, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary border border-border">
                    {p}
                    <button onClick={() => set('trigger_phrases', local.trigger_phrases.filter((_, j) => j !== i))}>
                      <X className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Transfer Message</Label>
              <Input value={local.transfer_message || ''} onChange={e => set('transfer_message', e.target.value)}
                placeholder="Please hold while I connect you…" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Fallback Message</Label>
              <Input value={local.fallback_message || ''} onChange={e => set('fallback_message', e.target.value)}
                placeholder="Sorry, no one is available right now." className="text-sm" />
            </div>
          </>
        )}

        {/* Google Map Link */}
        {toolId === 'google_map_link' && (
          <>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location / Address</Label>
              <Input value={local.location || ''} onChange={e => set('location', e.target.value)}
                placeholder="e.g. 123 Main St, Sydney NSW" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Delivery Method</Label>
              <RadioGroup label="" field="delivery_method" options={[
                { value: 'sms',   label: 'SMS' },
                { value: 'email', label: 'Email' },
                { value: 'both',  label: 'Both' },
              ]} />
            </div>
          </>
        )}

        {/* eCommerce Link */}
        {toolId === 'ecommerce_link' && (
          <>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Store URL</Label>
              <Input value={local.store_url || ''} onChange={e => set('store_url', e.target.value)}
                placeholder="https://yourstore.com" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Link Label</Label>
              <Input value={local.link_label || ''} onChange={e => set('link_label', e.target.value)}
                placeholder="e.g. Shop Now" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Delivery Method</Label>
              <RadioGroup label="" field="delivery_method" options={[
                { value: 'sms',   label: 'SMS' },
                { value: 'email', label: 'Email' },
                { value: 'both',  label: 'Both' },
              ]} />
            </div>
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} className="gap-2 border-0 text-white" style={{ background: '#6C3BFF' }}>
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, enabled, onToggle, config, onConfigChange }) {
  const [configOpen, setConfigOpen] = useState(false);
  const Icon = tool.icon;

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tool.iconBg }}>
              <Icon className="w-4 h-4" style={{ color: tool.iconColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{tool.name}</p>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={enabled
                    ? { background: '#DCFCE7', color: '#16A34A' }
                    : { background: '#F3F4F6', color: '#6B7280' }
                  }>
                  {enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <ToggleSwitch checked={enabled} onChange={onToggle} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
        {tool.hasConfig && (
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#6C3BFF' }}
          >
            <Settings className="w-3.5 h-3.5" /> Configure Settings
          </button>
        )}
      </div>
      {configOpen && (
        <ConfigPanel
          toolId={tool.id}
          config={config}
          onChange={onConfigChange}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </>
  );
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const TOOL_CATEGORIES = [
  {
    label: 'Bookings',
    tools: [
      {
        id: 'booking_manager',
        name: 'Booking Manager',
        description: 'Unified booking management: create, modify, and cancel appointments. Choose between AI handling, staff transfer, or sending a booking link.',
        icon: Calendar,
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        hasConfig: true,
        defaultOn: true,
      },
    ],
  },
  {
    label: 'Customer',
    tools: [
      {
        id: 'greetings',
        name: 'Greetings',
        description: 'Allow AI to provide personalized greetings to returning customers based on their call history.',
        icon: UserCheck,
        iconBg: '#CCFBF1',
        iconColor: '#0D9488',
        hasConfig: false,
        defaultOn: true,
      },
      {
        id: 'transfer_human',
        name: 'Transfer to Human',
        description: 'Transfer calls to a staff member for complaints, complex questions, or when the customer prefers a human.',
        icon: Phone,
        iconBg: '#F3F4F6',
        iconColor: '#6B7280',
        hasConfig: true,
        defaultOn: false,
      },
    ],
  },
  {
    label: 'Utilities',
    tools: [
      {
        id: 'tell_date',
        name: "Tell Today's Date",
        description: "AI answers customer inquiries about today's date in the merchant's timezone accurately.",
        icon: Clock,
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        hasConfig: false,
        defaultOn: true,
      },
    ],
  },
  {
    label: 'Call to Action',
    tools: [
      {
        id: 'google_map_link',
        name: 'Send Google Map Link',
        description: 'Send Google Map links to customers via SMS or Email to help them find your location.',
        icon: MapPin,
        iconBg: '#EDE9FF',
        iconColor: '#6C3BFF',
        hasConfig: true,
        defaultOn: false,
      },
      {
        id: 'ecommerce_link',
        name: 'Send eCommerce Link',
        description: 'Send eCommerce store links to customers via SMS or Email to drive online purchases.',
        icon: ShoppingBag,
        iconBg: '#EDE9FF',
        iconColor: '#6C3BFF',
        hasConfig: true,
        defaultOn: false,
      },
    ],
  },
];

const ALL_TOOLS = TOOL_CATEGORIES.flatMap(c => c.tools);
const DEFAULT_ENABLED = ALL_TOOLS.filter(t => t.defaultOn).map(t => t.id);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Tools() {
  const [agent, setAgent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [enabled, setEnabled]   = useState(DEFAULT_ENABLED);
  const [configs, setConfigs]   = useState({});

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) { setLoading(false); return; }
      const agents = await base44.entities.Agent.filter({ business_id: businesses[0].id });
      if (agents.length) {
        const a = agents[0];
        setAgent(a);
        setEnabled(a.enabled_tools?.length ? a.enabled_tools : DEFAULT_ENABLED);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = (toolId) => {
    setEnabled(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    await base44.entities.Agent.update(agent.id, { enabled_tools: enabled });
    if (agent.vapi_assistant_id) {
      await base44.functions.invoke('updateVapiAssistant', {
        assistant_id:  agent.vapi_assistant_id,
        enabled_tools: enabled,
        tool_configs:  configs,
      });
    }
    setSaving(false);
    toast.success('Tools saved successfully');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Tools &amp; Integrations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Connect external tools and services your AI agent can access and use</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
          <Info className="w-3.5 h-3.5" /> Start Tour
        </Button>
      </div>

      {/* Categories */}
      {TOOL_CATEGORIES.map(cat => (
        <div key={cat.label}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-syne font-semibold text-base">{cat.label}</h2>
            <span className="text-xs text-muted-foreground">{cat.tools.length} tool{cat.tools.length !== 1 ? 's' : ''}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cat.tools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                enabled={enabled.includes(tool.id)}
                onToggle={() => handleToggle(tool.id)}
                config={configs[tool.id] || {}}
                onConfigChange={(cfg) => setConfigs(prev => ({ ...prev, [tool.id]: cfg }))}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} className="gap-2 border-0 text-white px-8" style={{ background: '#6C3BFF' }}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}