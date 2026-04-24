import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Sparkles, Eye, Copy, Save, Mic, ToggleLeft, ToggleRight,
  Bot, HelpCircle,
} from 'lucide-react';

// ─── Variable chips ───────────────────────────────────────────────────────────
const BASE_CHIPS = [
  '{{business_name}}',
  '{{location_name}}',
  '{{ai_agent_name}}',
  '{{after_hours_message}}',
  '{{recording_disclosure}}',
];
const RETURN_CHIPS = [...BASE_CHIPS, '{{customer_first_name}}'];

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function FieldToolbar({ value, onAiPolish, polishing }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value || '');
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:bg-secondary transition-colors"
        title="Preview"
      >
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Copy className="w-3.5 h-3.5" /> Copy
      </button>
      <button
        onClick={onAiPolish}
        disabled={polishing}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white transition-colors disabled:opacity-60"
        style={{ background: '#6C3BFF' }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {polishing ? 'Polishing…' : 'AI Polishing'}
      </button>
    </div>
  );
}

// ─── Chip bar ─────────────────────────────────────────────────────────────────
function ChipBar({ chips, onInsert }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => onInsert(chip)}
          className="px-3 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80"
          style={{ background: '#EDE9FF', color: '#6C3BFF', borderColor: '#C4B5FD' }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

// ─── Greeting Field ───────────────────────────────────────────────────────────
function GreetingField({ label, value, onChange, chips, aiContext }) {
  const textareaRef = useRef(null);
  const [polishing, setPolishing] = useState(false);

  const insertAtCursor = (text) => {
    const el = textareaRef.current;
    if (!el) { onChange((value || '') + text); return; }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const next  = (value || '').slice(0, start) + text + (value || '').slice(end);
    onChange(next);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    }, 0);
  };

  const handleAiPolish = async () => {
    if (!value) return toast.error('Nothing to polish');
    setPolishing(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert AI receptionist copywriter. Improve and polish the following ${aiContext} to sound more professional, warm, and natural. Return ONLY the improved text, no explanation.\n\nOriginal:\n${value}`,
    });
    onChange(res);
    setPolishing(false);
    toast.success('AI polishing applied');
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
      <h3 className="font-syne font-semibold text-sm mb-3">{label}</h3>
      <FieldToolbar value={value} onAiPolish={handleAiPolish} polishing={polishing} />
      <Textarea
        ref={textareaRef}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="h-24 resize-none text-sm"
        placeholder={`Enter your ${label.toLowerCase()}…`}
      />
      <ChipBar chips={chips} onInsert={insertAtCursor} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Greetings() {
  const { business } = useOutletContext() || {};
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) { setLoading(false); return; }
      const agents = await base44.entities.Agent.filter({ business_id: businesses[0].id });
      if (agents.length) setAgent(agents[0]);
      setLoading(false);
    };
    load();
  }, []);

  const update = (field) => (val) => setAgent(a => ({ ...a, [field]: val }));

  const handleGenerateVariations = async () => {
    if (!agent) return;
    setGenerating(true);
    setVariations(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert AI receptionist copywriter for a ${business?.industry || 'service'} business called "${business?.name || 'the business'}".
Generate 3 creative variations each for the following greeting scripts. Be warm, professional, and concise.

Current initial greeting: "${agent.greeting_message || ''}"
Current return customer greeting: "${agent.return_customer_greeting || ''}"
Current after-hours message: "${agent.after_hours_message || ''}"

Return JSON with keys: initial (array of 3 strings), return_customer (array of 3 strings), after_hours (array of 3 strings).`,
      response_json_schema: {
        type: 'object',
        properties: {
          initial:         { type: 'array', items: { type: 'string' } },
          return_customer: { type: 'array', items: { type: 'string' } },
          after_hours:     { type: 'array', items: { type: 'string' } },
        },
      },
      model: 'claude_sonnet_4_6',
    });
    setVariations(res);
    setGenerating(false);
    toast.success('AI variations generated!');
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    await base44.entities.Agent.update(agent.id, {
      greeting_message:        agent.greeting_message,
      return_customer_greeting: agent.return_customer_greeting,
      after_hours_message:     agent.after_hours_message,
      call_recording_enabled:  agent.call_recording_enabled,
      recording_disclosure:    agent.recording_disclosure,
    });
    if (agent.vapi_assistant_id) {
      await base44.functions.invoke('updateVapiAssistant', {
        assistant_id:       agent.vapi_assistant_id,
        greeting_message:   agent.greeting_message,
        after_hours_message: agent.after_hours_message,
        recording_disclosure: agent.recording_disclosure,
      });
    }
    setSaving(false);
    toast.success('Greetings saved successfully');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!agent) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-96 bg-card border border-border rounded-2xl max-w-2xl mx-8 mt-8">
      <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">No agent configured yet. Complete onboarding first.</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Greetings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Customize how your AI agent greets customers</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HelpCircle className="w-4 h-4" /> Start Tour
        </Button>
      </div>

      {/* AI-Generated Variations */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#6C3BFF' }} />
            <h3 className="font-syne font-semibold">AI-Generated Variations</h3>
          </div>
          <span className="text-xs text-muted-foreground">Automatically generate greeting variations</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Let AI create multiple variations of your greetings so you can pick the best one or A/B test them.
        </p>
        <Button
          onClick={handleGenerateVariations}
          disabled={generating}
          className="gap-2 text-white border-0"
          style={{ background: '#6C3BFF' }}
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Generating…' : 'Generate with AI'}
        </Button>

        {/* Variation results */}
        {variations && (
          <div className="mt-5 space-y-4">
            {[
              { label: 'Initial Greeting', key: 'initial',         field: 'greeting_message' },
              { label: 'Return Customer',  key: 'return_customer', field: 'return_customer_greeting' },
              { label: 'After Hours',      key: 'after_hours',     field: 'after_hours_message' },
            ].map(({ label, key, field }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                <div className="space-y-2">
                  {(variations[key] || []).map((v, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/30">
                      <p className="text-sm flex-1 leading-relaxed">{v}</p>
                      <button
                        onClick={() => { update(field)(v); toast.success('Applied!'); }}
                        className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md text-white"
                        style={{ background: '#6C3BFF' }}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Initial Greeting */}
      <GreetingField
        label="Initial Greeting"
        value={agent.greeting_message}
        onChange={update('greeting_message')}
        chips={BASE_CHIPS}
        aiContext="initial greeting message"
      />

      {/* Return Customer Greeting */}
      <GreetingField
        label="Return Customer Greeting"
        value={agent.return_customer_greeting}
        onChange={update('return_customer_greeting')}
        chips={RETURN_CHIPS}
        aiContext="return customer greeting message"
      />

      {/* After Hours Message */}
      <GreetingField
        label="After Hours Message"
        value={agent.after_hours_message}
        onChange={update('after_hours_message')}
        chips={BASE_CHIPS}
        aiContext="after-hours message"
      />

      {/* Voice Recording Retention */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-syne font-semibold text-sm">Voice Recording Retention</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Store call recordings for quality and training purposes</p>
            </div>
          </div>
          <button onClick={() => update('call_recording_enabled')(!agent.call_recording_enabled)}>
            {agent.call_recording_enabled
              ? <ToggleRight className="w-9 h-9 text-primary" />
              : <ToggleLeft className="w-9 h-9 text-muted-foreground" />
            }
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            agent.call_recording_enabled
              ? 'bg-success/10 text-success'
              : 'bg-muted text-muted-foreground'
          }`}>
            {agent.call_recording_enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Recording Disclosure */}
      <GreetingField
        label="Recording Disclosure"
        value={agent.recording_disclosure}
        onChange={update('recording_disclosure')}
        chips={BASE_CHIPS}
        aiContext="recording disclosure statement"
      />

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 text-white border-0 px-8"
          style={{ background: '#6C3BFF' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}