import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Play, Check, Plus, Trash2, Sparkles, Languages, Loader2 } from 'lucide-react';

// ─── Voice Data ─────────────────────────────────────────────────────────────
const VOICES = {
  female: [
    { id: 'alexandra', name: 'Alexandra', age: 'Young',       accent: 'American',   style: 'Conversational', quality: 'Casual',        provider: '11labs' },
    { id: 'annie',     name: 'Annie',     age: 'Middle Aged', accent: 'American',   style: 'Narrative',      quality: 'Professional',  provider: '11labs' },
    { id: 'arabella',  name: 'Arabella',  age: 'Young',       accent: 'Australian', style: 'Conversational', quality: 'Raspy',         provider: '11labs' },
    { id: 'hannah',    name: 'Hannah',    age: 'Young',       accent: 'Australian', style: 'Conversational', quality: 'Confident',     provider: '11labs' },
    { id: 'jessica',   name: 'Jessica',   age: 'Middle Aged', accent: 'American',   style: 'Conversational', quality: 'Crisp',         provider: '11labs' },
    { id: 'katie',     name: 'Katie',     age: 'Middle Aged', accent: 'British',    style: 'Conversational', quality: 'Professional',  provider: '11labs' },
  ],
  male: [
    { id: 'james',     name: 'James',     age: 'Middle Aged', accent: 'American',   style: 'Conversational', quality: 'Authoritative', provider: '11labs' },
    { id: 'oliver',    name: 'Oliver',    age: 'Young',       accent: 'British',    style: 'Conversational', quality: 'Warm',          provider: '11labs' },
    { id: 'liam',      name: 'Liam',      age: 'Young',       accent: 'Australian', style: 'Conversational', quality: 'Casual',        provider: '11labs' },
    { id: 'william',   name: 'William',   age: 'Middle Aged', accent: 'British',    style: 'Narrative',      quality: 'Professional',  provider: '11labs' },
    { id: 'ethan',     name: 'Ethan',     age: 'Young',       accent: 'American',   style: 'Conversational', quality: 'Energetic',     provider: '11labs' },
    { id: 'henry',     name: 'Henry',     age: 'Middle Aged', accent: 'Australian', style: 'Conversational', quality: 'Calm',          provider: '11labs' },
  ],
};

const LANGUAGES = [
  '🇺🇸 English (US)', '🇬🇧 English (UK)', '🇦🇺 English (AU)', '🇪🇸 Spanish',
  '🇫🇷 French', '🇩🇪 German', '🇮🇹 Italian', '🇧🇷 Portuguese', '🇯🇵 Japanese',
  '🇨🇳 Mandarin', '🇰🇷 Korean', '🇦🇪 Arabic', '🇮🇳 Hindi',
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function Section({ title, subtitle, rightLabel, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-syne font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {rightLabel && <span className="shrink-0">{rightLabel}</span>}
      </div>
      {children}
    </div>
  );
}

function VoiceCard({ voice, selected, onSelect }) {
  const [previewing, setPreviewing] = useState(false);

  const handlePreview = async (e) => {
    e.stopPropagation();
    setPreviewing(true);
    try {
      const res = await base44.functions.invoke('previewVoice', {
        voice_id: voice.id,
        text: `Hi! I'm ${voice.name}, your AI receptionist. How can I help you today?`,
      });
      const { audio_base64, content_type } = res.data;
      const binary = atob(audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: content_type || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      toast.error(`Could not preview ${voice.name}. Please try again.`);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(voice)}
      className="relative rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50"
      style={selected ? { borderColor: '#6C3BFF', background: '#EDE9FF' } : {}}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#6C3BFF' }}>
          <Check className="w-3 h-3 text-white" />
        </span>
      )}
      <p className="font-semibold text-sm mb-1.5" style={selected ? { color: '#3B1FA8' } : {}}>{voice.name}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {[voice.age, voice.style, voice.quality].map(tag => (
          <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">{tag}</span>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{voice.accent} • {voice.name in VOICES.female ? 'Female' : 'Male'}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1" onClick={handlePreview} disabled={previewing}>
          {previewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {previewing ? 'Loading…' : 'Preview'}
        </Button>
        <Button size="sm" className="h-7 text-xs flex-1 border-0 text-white" style={{ background: '#6C3BFF' }} onClick={() => onSelect(voice)}>
          {selected ? 'Selected' : 'Select'}
        </Button>
      </div>
    </div>
  );
}

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

function SliderRow({ label, min, max, step, value, onChange, leftLabel, midLabel, rightLabel, display }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EDE9FF', color: '#6C3BFF' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#6C3BFF]" />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{leftLabel}</span>
        {midLabel && <span>{midLabel}</span>}
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const allVoices = [...VOICES.female, ...VOICES.male];
function findVoice(id) { return allVoices.find(v => v.id === id); }

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Voice() {
  const [agent, setAgent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [voiceTab, setVoiceTab] = useState('female');
  const [langEnabled, setLangEnabled] = useState(false);
  const [langSearch, setLangSearch]   = useState('');
  const [addedLangs, setAddedLangs]   = useState([]);
  const [newWord, setNewWord]     = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);

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
          voice_id:                a.voice_id                || 'arabella',
          voice_provider:          a.voice_provider           || '11labs',
          voice_speed:             a.voice_speed              ?? 1.0,
          turn_timeout_seconds:    a.turn_timeout_seconds     ?? 5,
          silence_end_call_enabled: a.silence_end_call_enabled ?? true,
          silence_timeout_seconds: a.silence_timeout_seconds  ?? 30,
          max_duration_seconds:    a.max_duration_seconds     ?? 300,
          custom_pronunciations:   a.custom_pronunciations    || [],
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (field) => (val) => setAgent(a => ({ ...a, [field]: val }));

  const handleSelectVoice = (voice) => {
    setAgent(a => ({ ...a, voice_id: voice.id, voice_provider: voice.provider }));
  };

  const handleAiSuggest = async () => {
    if (!newWord) return;
    setAiSuggesting(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Give only the phonetic pronunciation (IPA or simple English approximation) for: "${newWord}". Reply with just the pronunciation, nothing else.`,
    });
    setNewPhonetic(typeof res === 'string' ? res.trim() : res?.pronunciation || '');
    setAiSuggesting(false);
  };

  const handleAddPronunciation = () => {
    if (!newWord || !newPhonetic) return toast.error('Enter both word and pronunciation');
    const existing = agent.custom_pronunciations || [];
    setAgent(a => ({ ...a, custom_pronunciations: [...existing, { word: newWord, phonetic: newPhonetic }] }));
    setNewWord(''); setNewPhonetic('');
  };

  const handleDeletePronunciation = (idx) => {
    setAgent(a => ({ ...a, custom_pronunciations: a.custom_pronunciations.filter((_, i) => i !== idx) }));
  };

  const handleAddLang = (lang) => {
    if (!addedLangs.includes(lang)) setAddedLangs(l => [...l, lang]);
    setLangSearch('');
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    await base44.entities.Agent.update(agent.id, {
      voice_id:                  agent.voice_id,
      voice_provider:            agent.voice_provider,
      voice_speed:               agent.voice_speed,
      turn_timeout_seconds:      agent.turn_timeout_seconds,
      silence_end_call_enabled:  agent.silence_end_call_enabled,
      silence_timeout_seconds:   agent.silence_timeout_seconds,
      max_duration_seconds:      agent.max_duration_seconds,
      custom_pronunciations:     agent.custom_pronunciations,
    });
    if (agent.vapi_assistant_id) {
      await base44.functions.invoke('updateVapiAssistant', {
        assistant_id:  agent.vapi_assistant_id,
        voice_id:      agent.voice_id,
        voice_speed:   agent.voice_speed,
      });
    }
    setSaving(false);
    toast.success('Voice settings saved');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!agent) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-96">
      <Languages className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">No agent configured yet.</p>
    </div>
  );

  const filteredLangs = LANGUAGES.filter(l =>
    l.toLowerCase().includes(langSearch.toLowerCase()) && !addedLangs.includes(l)
  );

  const voiceList = VOICES[voiceTab];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Voice &amp; Languages</h1>
        <p className="text-muted-foreground mt-1 text-sm">Configure voice and language settings</p>
      </div>

      {/* 1. Primary Voice */}
      <Section
        title="Primary Voice"
        subtitle="Select the voice and default language for your AI agent"
        rightLabel={<span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground">🇬🇧 English</span>}
      >
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {['female', 'male'].map(tab => (
            <button
              key={tab}
              onClick={() => setVoiceTab(tab)}
              className="px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize"
              style={voiceTab === tab ? { background: '#6C3BFF', color: '#fff' } : { color: '#6b7280' }}
            >
              {tab === 'female' ? 'Female Voices' : 'Male Voices'}
            </button>
          ))}
        </div>
        {/* Voice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {voiceList.map(voice => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              selected={agent.voice_id === voice.id}
              onSelect={handleSelectVoice}
            />
          ))}
        </div>
      </Section>

      {/* 2. Additional Languages */}
      <Section title="Additional Languages" subtitle="Auto-detect caller's language and respond accordingly">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable Additional Languages</span>
          <ToggleSwitch checked={langEnabled} onChange={setLangEnabled} />
        </div>
        {langEnabled && (
          <div className="space-y-3 pt-1">
            <Input
              value={langSearch}
              onChange={e => setLangSearch(e.target.value)}
              placeholder="Search and add languages…"
              className="text-sm"
            />
            {langSearch && filteredLangs.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                {filteredLangs.slice(0, 5).map(lang => (
                  <button key={lang} onClick={() => handleAddLang(lang)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center">
                    {lang} <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            {addedLangs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addedLangs.map(lang => (
                  <span key={lang} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-secondary">
                    {lang}
                    <button onClick={() => setAddedLangs(l => l.filter(x => x !== lang))} className="hover:text-destructive">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 3. Speech Speed */}
      <Section title="Speech Speed" subtitle="Adjust how fast the agent speaks">
        <SliderRow
          label="Speed"
          min={0.7} max={1.2} step={0.05}
          value={agent.voice_speed}
          onChange={update('voice_speed')}
          leftLabel="0.7x — Slower"
          midLabel="1.0x — Normal"
          rightLabel="1.2x — Faster"
          display={`${agent.voice_speed.toFixed(2)}x`}
        />
      </Section>

      {/* 4. Turn Timeout */}
      <Section title="Turn Timeout" subtitle="How long the agent waits before taking its turn">
        <SliderRow
          label="Timeout"
          min={1} max={10} step={1}
          value={agent.turn_timeout_seconds}
          onChange={update('turn_timeout_seconds')}
          leftLabel="1s — Quick"
          midLabel="5s — Moderate"
          rightLabel="10s — Patient"
          display={`${agent.turn_timeout_seconds}s`}
        />
      </Section>

      {/* 5. Silence End Call */}
      <Section title="Silence End Call" subtitle="Automatically end the call after prolonged silence">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable silence detection</span>
          <ToggleSwitch checked={agent.silence_end_call_enabled} onChange={update('silence_end_call_enabled')} />
        </div>
        {agent.silence_end_call_enabled && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Timeout:</span>
            <Input
              type="number" min={5} max={120}
              value={agent.silence_timeout_seconds}
              onChange={e => update('silence_timeout_seconds')(parseInt(e.target.value) || 30)}
              className="w-24 text-sm"
            />
            <span className="text-sm text-muted-foreground">seconds</span>
          </div>
        )}
        {agent.silence_end_call_enabled && (
          <p className="text-xs text-muted-foreground">
            Call will end after <strong>{agent.silence_timeout_seconds}s</strong> of silence
          </p>
        )}
      </Section>

      {/* 6. Max Call Duration */}
      <Section title="Max. Call Duration" subtitle="Set the maximum length of a single call">
        <SliderRow
          label="Duration"
          min={100} max={1200} step={10}
          value={agent.max_duration_seconds}
          onChange={update('max_duration_seconds')}
          leftLabel="1.7m — Short"
          midLabel="5m — Medium"
          rightLabel="20m — Long"
          display={formatDuration(agent.max_duration_seconds)}
        />
      </Section>

      {/* 7. Custom Pronunciations */}
      <Section title="Custom Pronunciations" subtitle="Define how specific words or phrases should be spoken">
        {/* Add form */}
        <div className="flex gap-2 flex-wrap">
          <Input
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            placeholder="Word or phrase…"
            className="flex-1 min-w-[140px] text-sm"
          />
          <div className="flex gap-2 flex-1 min-w-[140px]">
            <Input
              value={newPhonetic}
              onChange={e => setNewPhonetic(e.target.value)}
              placeholder="Say this instead…"
              className="flex-1 text-sm"
            />
            <Button size="icon" variant="outline" className="shrink-0" onClick={handleAiSuggest} disabled={aiSuggesting || !newWord}>
              <Sparkles className="w-4 h-4" style={{ color: '#6C3BFF' }} />
            </Button>
          </div>
          <Button onClick={handleAddPronunciation} className="gap-1.5 border-0 text-white text-xs shrink-0" style={{ background: '#6C3BFF' }}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
        {/* Saved list */}
        {(agent.custom_pronunciations || []).length > 0 && (
          <div className="space-y-2 pt-1">
            {agent.custom_pronunciations.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary text-sm">
                <span><strong>{p.word}</strong> → <span className="text-muted-foreground">{p.phonetic}</span></span>
                <button onClick={() => handleDeletePronunciation(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

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