import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, ChevronRight, ChevronLeft, Building2, Bot, Phone, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getTemplate } from '@/lib/industryTemplates';

const INDUSTRIES = ['restaurant','salon','clinic','tradie','property','gym','spa','dental','legal','other'];
const TIMEZONES = ['Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Perth','Australia/Adelaide','America/New_York','America/Los_Angeles','Europe/London'];
const VOICES = [
  { id: 'sarah', name: 'Sarah', desc: 'Warm & professional', provider: '11labs' },
  { id: 'aria', name: 'Aria', desc: 'Friendly & energetic', provider: '11labs' },
  { id: 'james', name: 'James', desc: 'Clear & authoritative', provider: '11labs' },
  { id: 'emily', name: 'Emily', desc: 'Calm & reassuring', provider: '11labs' },
];

const steps = [
  { id: 1, label: 'Business', icon: Building2 },
  { id: 2, label: 'Agent Setup', icon: Bot },
  { id: 3, label: 'Phone Number', icon: Phone },
  { id: 4, label: 'Done', icon: CheckCircle },
];

async function seedIndustryData(businessId, industry) {
  const template = getTemplate(industry);

  // Seed all in parallel
  const staffPromises = template.staff.map(s =>
    base44.entities.Staff.create({ ...s, business_id: businessId, is_active: true })
  );
  const servicePromises = template.services.map(s =>
    base44.entities.Service.create({ ...s, business_id: businessId, is_active: true, currency: 'AUD', buffer_minutes: s.buffer_minutes || 0, max_bookings_per_slot: 1 })
  );

  await Promise.all([...staffPromises, ...servicePromises]);

  // Save business hours + FAQ on the business record
  const faqText = template.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
  await base44.entities.Business.update(businessId, {
    business_hours: template.businessHours,
    faq_content: faqText,
  });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [business, setBusiness] = useState({
    name: '', industry: '', phone: '', email: '', timezone: 'Australia/Sydney', country: 'AU', description: ''
  });
  const [agent, setAgent] = useState({
    name: 'Aria', voice_id: 'aria', voice_provider: '11labs', greeting_message: '', persona: '', services: []
  });
  const [createdBusiness, setCreatedBusiness] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [seedSummary, setSeedSummary] = useState(null);

  const handleCreateBusiness = async () => {
    if (!business.name || !business.industry) return toast.error('Please fill in required fields');
    setLoading(true);

    const user = await base44.auth.me();
    const biz = await base44.entities.Business.create({ ...business, owner_id: user.id, subscription_plan: 'trial' });
    setCreatedBusiness(biz);

    // Auto-seed industry data
    setSeeding(true);
    setSeedProgress('Creating staff profiles…');
    try {
      const template = getTemplate(business.industry);
      setSeedProgress('Setting up services & hours…');
      await seedIndustryData(biz.id, business.industry);
      setSeedSummary({
        staff: template.staff.length,
        services: template.services.length,
        faq: template.faq.length,
      });
      setSeedProgress('Done!');
    } catch (e) {
      console.warn('Auto-seed failed', e);
    }
    setSeeding(false);
    setLoading(false);
    setStep(2);
  };

  const handleCreateAgent = async () => {
    if (!createdBusiness) return;
    setLoading(true);
    const greeting = agent.greeting_message || `Hi! You've reached ${business.name}. I'm ${agent.name}, your AI assistant. How can I help you today?`;
    const systemPrompt = `You are ${agent.name}, a professional AI receptionist for ${business.name}, a ${business.industry} business. ${agent.persona || 'Be friendly, helpful, and professional.'} Help callers with bookings, enquiries, and information about the business.`;

    const agentData = {
      business_id: createdBusiness.id,
      name: agent.name,
      voice_id: agent.voice_id,
      voice_provider: agent.voice_provider,
      greeting_message: greeting,
      system_prompt: systemPrompt,
      persona: agent.persona,
      services: agent.services,
      status: 'draft',
    };

    let vapiId = null;
    try {
      const res = await base44.functions.invoke('createVapiAssistant', {
        business_id: createdBusiness.id,
        name: agent.name,
        voice_id: agent.voice_id,
        system_prompt: systemPrompt,
        greeting_message: greeting,
      });
      vapiId = res.data?.assistant_id;
    } catch (e) {
      console.warn('VAPI creation failed, saving draft', e.message);
    }

    await base44.entities.Agent.create({ ...agentData, vapi_assistant_id: vapiId, status: vapiId ? 'active' : 'draft' });
    setLoading(false);
    setStep(3);
  };

  const handleProvisionPhone = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('provisionPhoneNumber', {
        business_id: createdBusiness.id,
        country: business.country || 'AU',
      });
      const phone = res.data?.phone_number;
      setPhoneNumber(phone);
      await base44.entities.Business.update(createdBusiness.id, { twilio_phone_number: phone, onboarding_completed: true });
    } catch (e) {
      toast.error('Phone provisioning failed: ' + e.message);
    }
    setLoading(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-8 py-5 border-b border-border">
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-syne font-bold text-lg">VoiceDesk</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-12">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-foreground' :
                  done ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-px ${done ? 'bg-success' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 shadow-xl">

            {/* Step 1: Business */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-syne font-bold">Tell us about your business</h2>
                  <p className="text-muted-foreground text-sm mt-1">This helps us configure your AI agent correctly.</p>
                </div>

                {/* Industry auto-seed callout */}
                {business.industry && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-accent border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-accent-foreground leading-relaxed">
                      <strong>Auto-setup ready!</strong> We'll instantly create sample staff, services, and business hours tailored for a <span className="capitalize font-semibold">{business.industry}</span> business.
                    </p>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Business Name *</Label>
                    <Input value={business.name} onChange={e => setBusiness(b => ({...b, name: e.target.value}))} placeholder="e.g. Luxe Hair Studio" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Industry *</Label>
                    <Select value={business.industry} onValueChange={v => setBusiness(b => ({...b, industry: v}))}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Select value={business.timezone} onValueChange={v => setBusiness(b => ({...b, timezone: v}))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={business.phone} onChange={e => setBusiness(b => ({...b, phone: e.target.value}))} placeholder="+61 4xx xxx xxx" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={business.email} onChange={e => setBusiness(b => ({...b, email: e.target.value}))} placeholder="you@business.com" className="mt-1.5" />
                  </div>
                  <div className="col-span-2">
                    <Label>Business Description</Label>
                    <Textarea value={business.description} onChange={e => setBusiness(b => ({...b, description: e.target.value}))} placeholder="Briefly describe your services..." className="mt-1.5 h-20 resize-none" />
                  </div>
                </div>

                <Button onClick={handleCreateBusiness} disabled={loading} className="w-full gradient-primary border-0 text-white mt-2">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {seeding ? seedProgress : 'Creating workspace…'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {business.industry ? <Sparkles className="w-4 h-4" /> : null}
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Agent */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-syne font-bold">Configure your AI agent</h2>
                  <p className="text-muted-foreground text-sm mt-1">Choose a voice and personality for your receptionist.</p>
                </div>

                {/* Seed summary banner */}
                {seedSummary && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <p className="text-xs text-success leading-relaxed">
                      <strong>Workspace ready!</strong> Created {seedSummary.staff} staff members, {seedSummary.services} services, business hours & {seedSummary.faq} FAQ entries tailored to your industry.
                    </p>
                  </div>
                )}

                <div>
                  <Label>Agent Name</Label>
                  <Input value={agent.name} onChange={e => setAgent(a => ({...a, name: e.target.value}))} placeholder="e.g. Aria" className="mt-1.5" />
                </div>
                <div>
                  <Label className="mb-2 block">Voice</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {VOICES.map(v => (
                      <button key={v.id} onClick={() => setAgent(a => ({...a, voice_id: v.id}))}
                        className={`p-3 rounded-xl border text-left transition-all ${agent.voice_id === v.id ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}>
                        <p className="font-semibold text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Custom Greeting (optional)</Label>
                  <Textarea value={agent.greeting_message} onChange={e => setAgent(a => ({...a, greeting_message: e.target.value}))}
                    placeholder={`Hi! You've reached ${business.name}. I'm here to help!`} className="mt-1.5 h-20 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                  <Button onClick={handleCreateAgent} disabled={loading} className="flex-1 gradient-primary border-0 text-white">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating agent…
                      </span>
                    ) : <>Create Agent <ChevronRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Phone */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-syne font-bold">Get your AI phone number</h2>
                  <p className="text-muted-foreground text-sm mt-1">We'll provision a dedicated number for your AI agent.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-secondary/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Phone Number Provisioning</span>
                  </div>
                  <p className="text-sm text-muted-foreground">We'll assign you a local phone number via Twilio. Your AI agent will answer all calls to this number automatically.</p>
                  <div className="mt-3">
                    <Label>Country</Label>
                    <Select value={business.country} onValueChange={v => setBusiness(b => ({...b, country: v}))}>
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
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                  <Button onClick={handleProvisionPhone} disabled={loading} className="flex-1 gradient-primary border-0 text-white">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Provisioning…
                      </span>
                    ) : <>Get Phone Number <ChevronRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
                <button onClick={() => { setStep(4); base44.entities.Business.update(createdBusiness.id, { onboarding_completed: true }); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                  Skip for now →
                </button>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-syne font-bold">You're all set! 🎉</h2>
                  <p className="text-muted-foreground text-sm mt-2">Your AI receptionist is ready to take calls.</p>
                </div>

                {seedSummary && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Staff', value: seedSummary.staff },
                      { label: 'Services', value: seedSummary.services },
                      { label: 'FAQs', value: seedSummary.faq },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 bg-accent rounded-xl">
                        <p className="text-2xl font-syne font-bold text-primary">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label} added</p>
                      </div>
                    ))}
                  </div>
                )}

                {phoneNumber && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                    <p className="text-sm text-success font-medium">Your AI phone number</p>
                    <p className="text-2xl font-syne font-bold text-success mt-1">{phoneNumber}</p>
                  </div>
                )}
                <Button onClick={() => navigate('/')} className="w-full gradient-primary border-0 text-white">
                  Go to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}