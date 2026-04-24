import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bot, Phone, Settings, Save, RefreshCw, Zap, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const VOICES = [
  { id: 'sarah', name: 'Sarah', desc: 'Warm & professional' },
  { id: 'aria', name: 'Aria', desc: 'Friendly & energetic' },
  { id: 'james', name: 'James', desc: 'Clear & authoritative' },
  { id: 'emily', name: 'Emily', desc: 'Calm & reassuring' },
];

export default function AgentSettings() {
  const { business } = useOutletContext() || {};
  const [agent, setAgent] = useState(null);
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      setBiz(businesses[0]);
      const agents = await base44.entities.Agent.filter({ business_id: businesses[0].id });
      if (agents.length) setAgent(agents[0]);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    await base44.entities.Agent.update(agent.id, agent);
    toast.success('Agent settings saved');
    setSaving(false);
  };

  const handleToggle = async () => {
    if (!agent) return;
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    const updated = { ...agent, status: newStatus };
    setAgent(updated);
    await base44.entities.Agent.update(agent.id, { status: newStatus });
    toast.success(newStatus === 'active' ? 'Agent activated' : 'Agent paused');
  };

  const handleSyncVapi = async () => {
    if (!agent || !agent.vapi_assistant_id) return toast.error('No VAPI assistant linked');
    setSyncing(true);
    try {
      await base44.functions.invoke('updateVapiAssistant', {
        assistant_id: agent.vapi_assistant_id,
        name: agent.name,
        voice_id: agent.voice_id,
        system_prompt: agent.system_prompt,
        greeting_message: agent.greeting_message,
      });
      toast.success('Synced to VAPI successfully');
    } catch (e) {
      toast.error('Sync failed: ' + e.message);
    }
    setSyncing(false);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">AI Agent</h1>
        <p className="text-muted-foreground mt-1">Configure your AI receptionist's voice and behaviour</p>
      </div>

      {!agent ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl">
          <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">No agent configured yet</p>
          <Button onClick={() => window.location.href = '/onboarding'} className="gradient-primary border-0 text-white">Complete Onboarding</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status bar */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            agent.status === 'active' ? 'border-success/30 bg-success/5' :
            agent.status === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${agent.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <div>
                <p className="font-semibold text-sm capitalize">Agent {agent.status === 'active' ? 'is Live' : agent.status}</p>
                {agent.vapi_assistant_id && <p className="text-xs text-muted-foreground">VAPI ID: {agent.vapi_assistant_id}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSyncVapi} disabled={syncing} className="text-xs">
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} /> Sync to VAPI
              </Button>
              <Button size="sm" onClick={handleToggle} className={agent.status === 'active' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'gradient-primary border-0 text-white'}>
                {agent.status === 'active' ? 'Pause Agent' : 'Activate Agent'}
              </Button>
            </div>
          </div>

          {/* Config card */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="font-syne font-semibold">Agent Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Agent Name</Label>
                <Input value={agent.name} onChange={e => setAgent(a => ({...a, name: e.target.value}))} className="mt-1.5" />
              </div>
              <div>
                <Label>Language</Label>
                <Select value={agent.language} onValueChange={v => setAgent(a => ({...a, language: v}))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-AU">English (AU)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="mb-2 block">Voice</Label>
                <div className="grid grid-cols-4 gap-2">
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setAgent(a => ({...a, voice_id: v.id}))}
                      className={`p-3 rounded-xl border text-left transition-all ${agent.voice_id === v.id ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}>
                      <p className="text-sm font-semibold">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <Label>Greeting Message</Label>
                <Textarea value={agent.greeting_message || ''} onChange={e => setAgent(a => ({...a, greeting_message: e.target.value}))} className="mt-1.5 h-20 resize-none" />
              </div>
              <div className="col-span-2">
                <Label>System Prompt</Label>
                <Textarea value={agent.system_prompt || ''} onChange={e => setAgent(a => ({...a, system_prompt: e.target.value}))} className="mt-1.5 h-32 resize-none font-mono text-xs" />
              </div>
              <div className="col-span-2">
                <Label>After-Hours Message</Label>
                <Textarea value={agent.after_hours_message || ''} onChange={e => setAgent(a => ({...a, after_hours_message: e.target.value}))} className="mt-1.5 h-16 resize-none" placeholder="We're currently closed. Please call back during business hours..." />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Phone number */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-syne font-semibold mb-4">Phone Number</h3>
            {biz?.twilio_phone_number ? (
              <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-xl">
                <Phone className="w-5 h-5 text-success" />
                <div>
                  <p className="font-semibold text-success">{biz.twilio_phone_number}</p>
                  <p className="text-xs text-muted-foreground">AI agent answers all calls to this number</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-warning/5 border border-warning/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-sm">No phone number provisioned</p>
                  <p className="text-xs text-muted-foreground">Complete onboarding to get your AI phone number</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}