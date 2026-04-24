import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Sparkles, Bot } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────
const TRAIT_OPTIONS   = ['Friendly', 'Professional', 'Helpful', 'Casual', 'Formal', 'Enthusiastic', 'Calm', 'Empathetic'];
const TONE_OPTIONS    = ['Warm', 'Professional', 'Conversational', 'Direct'];
const STYLE_OPTIONS   = ['Concise', 'Balanced', 'Detailed'];

const TEMP_PRESETS = [
  { label: 'Deterministic', value: 0.0 },
  { label: 'Creative',      value: 0.5 },
  { label: 'Very Creative', value: 1.0 },
];

function tempLabel(v) {
  if (v <= 0.2)       return 'Deterministic';
  if (v <= 0.4)       return 'Focused';
  if (v <= 0.6)       return 'Creative';
  if (v <= 0.8)       return 'Expressive';
  return 'Very Creative';
}

// ─── Chip button ───────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
      style={selected
        ? { background: '#6C3BFF', color: '#fff', borderColor: '#6C3BFF' }
        : { background: 'transparent', color: '#6b7280', borderColor: '#d1d5db' }
      }
    >
      {label}
    </button>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, rightLabel, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-syne font-semibold">{title}</h3>
        {rightLabel && <span className="text-xs text-muted-foreground text-right max-w-[200px] shrink-0">{rightLabel}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function Personality() {
  const { business } = useOutletContext() || {};
  const [agent, setAgent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) { setLoading(false); return; }
      const agents = await base44.entities.Agent.filter({ business_id: businesses[0].id });
      if (agents.length) {
        const a = agents[0];
        setAgent({
          ...a,
          personality_traits: a.personality_traits || [],
          tone_of_voice:      a.tone_of_voice      || '',
          response_style:     a.response_style      || 'Balanced',
          temperature:        a.temperature         ?? 0.5,
          custom_instructions: a.custom_instructions || '',
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (field) => (val) => setAgent(a => ({ ...a, [field]: val }));

  // Trait toggle — max 3, replace oldest on 4th
  const toggleTrait = (trait) => {
    setAgent(a => {
      const traits = a.personality_traits || [];
      if (traits.includes(trait)) return { ...a, personality_traits: traits.filter(t => t !== trait) };
      if (traits.length >= 3)     return { ...a, personality_traits: [...traits.slice(1), trait] };
      return { ...a, personality_traits: [...traits, trait] };
    });
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    await base44.entities.Agent.update(agent.id, {
      name:                agent.name,
      personality_traits:  agent.personality_traits,
      tone_of_voice:       agent.tone_of_voice,
      response_style:      agent.response_style,
      temperature:         agent.temperature,
      custom_instructions: agent.custom_instructions,
    });
    if (agent.vapi_assistant_id) {
      await base44.functions.invoke('updateVapiAssistant', {
        assistant_id:        agent.vapi_assistant_id,
        name:                agent.name,
        personality_traits:  agent.personality_traits,
        tone_of_voice:       agent.tone_of_voice,
        response_style:      agent.response_style,
        temperature:         agent.temperature,
        custom_instructions: agent.custom_instructions,
      });
    }
    setSaving(false);
    toast.success('Personality saved successfully');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!agent) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-96">
      <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">No agent configured yet. Complete onboarding first.</p>
    </div>
  );

  const traits = agent.personality_traits || [];
  const tone   = agent.tone_of_voice || '';
  const style  = agent.response_style || 'Balanced';
  const temp   = agent.temperature ?? 0.5;

  // Live personality summary
  const traitText = traits.length ? traits.join(', ') : '…';
  const toneText  = tone  || '…';
  const styleText = style || '…';

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Personality</h1>
        <p className="text-muted-foreground mt-1 text-sm">Define how your AI agent interacts with customers</p>
      </div>

      {/* 1. AI Agent Name */}
      <Section title="AI Agent Name" rightLabel="Set the name your AI agent will use when introducing itself">
        <Input
          value={agent.name || ''}
          onChange={e => update('name')(e.target.value)}
          placeholder="e.g. Aria"
          className="max-w-xs"
        />
        {/* Live preview */}
        <div className="rounded-xl p-4 text-sm" style={{ background: '#EDE9FF' }}>
          <span className="text-gray-500">Preview: </span>
          <span className="font-medium" style={{ color: '#3B1FA8' }}>
            "Hi! I'm <strong>{agent.name || '[name]'}</strong>, your AI assistant. How can I help you today?"
          </span>
        </div>
      </Section>

      {/* 2. Personality Settings */}
      <Section title="Personality Settings" rightLabel="Configure your AI agent's personality and communication style">
        {/* Traits */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Personality Traits — Select up to 3 characteristics
          </p>
          <div className="flex flex-wrap gap-2">
            {TRAIT_OPTIONS.map(t => (
              <Chip key={t} label={t} selected={traits.includes(t)} onClick={() => toggleTrait(t)} />
            ))}
          </div>
          {traits.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Selected ({traits.length}/3):{' '}
              {traits.map((t, i) => (
                <span key={t}>
                  <span className="font-medium" style={{ color: '#6C3BFF' }}>{t}</span>
                  {i < traits.length - 1 && ', '}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Tone */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tone of Voice — Select one tone
          </p>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(t => (
              <Chip key={t} label={t} selected={tone === t} onClick={() => update('tone_of_voice')(tone === t ? '' : t)} />
            ))}
          </div>
        </div>

        {/* Response Style */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Response Style — How detailed should responses be
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(s => (
              <Chip key={s} label={s} selected={style === s} onClick={() => update('response_style')(s)} />
            ))}
          </div>
        </div>

        {/* Personality Summary */}
        <div className="rounded-xl p-4 flex gap-3" style={{ background: '#EDE9FF' }}>
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#6C3BFF' }} />
          <p className="text-sm" style={{ color: '#3B1FA8' }}>
            Your AI agent will be <strong>{traitText}</strong> with a <strong>{toneText}</strong> tone, providing <strong>{styleText}</strong> responses to customers.
          </p>
        </div>
      </Section>

      {/* 3. Temperature */}
      <Section title="Temperature" rightLabel="Control the creativity and randomness of AI responses">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Current: <strong>{temp.toFixed(2)}</strong> ({tempLabel(temp)})</span>
        </div>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={temp}
          onChange={e => update('temperature')(parseFloat(e.target.value))}
          className="w-full accent-[#6C3BFF]"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0.00 — Deterministic</span>
          <span>0.50 — Creative</span>
          <span>1.00 — Very Creative</span>
        </div>
        {/* Presets */}
        <div className="flex gap-2 mt-3">
          <span className="text-xs text-muted-foreground self-center mr-1">Quick Presets:</span>
          {TEMP_PRESETS.map(p => (
            <Chip
              key={p.label}
              label={p.label}
              selected={Math.abs(temp - p.value) < 0.01}
              onClick={() => update('temperature')(p.value)}
            />
          ))}
        </div>
      </Section>

      {/* 4. Custom Instructions */}
      <Section title="Custom Instructions" rightLabel="Additional behaviour guidelines for the agent">
        <Textarea
          value={agent.custom_instructions || ''}
          onChange={e => update('custom_instructions')(e.target.value)}
          placeholder="Add custom instructions... e.g. Always confirm bookings by repeating the date and time back to the customer."
          className="h-32 resize-none text-sm"
        />
      </Section>

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