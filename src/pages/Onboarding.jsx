import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, ChevronRight, ChevronLeft, Building2, Bot, Phone, CheckCircle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getTemplate } from '@/lib/industryTemplates';
import BusinessTypePicker from '@/components/onboarding/BusinessTypePicker';

// ─── Sub-type → template mapping ──────────────────────────────────────────────
const SUBTYPE_TO_TEMPLATE = {
  'Full-Service Restaurant': 'restaurant', 'Café / Coffee Shop': 'restaurant', 'Casual Dining': 'restaurant',
  'Formal Dining': 'restaurant', 'Dessert Shop': 'restaurant', 'Fast Food': 'restaurant',
  'Bar / Pub': 'restaurant', 'Event Venue': 'restaurant', 'Function Centre': 'restaurant',
  'Hair Salon': 'salon', 'Barber Shop': 'salon', 'Nail Salon': 'salon', 'Beauty Therapist': 'salon',
  'Massage Therapist': 'spa', 'Makeup Artist': 'salon', 'Tanning Studio': 'salon', 'Tattoo Studio': 'salon',
  'Spa & Wellness': 'spa', 'Day Spa': 'spa',
  'Accountant': 'legal', 'Lawyer / Legal': 'legal', 'Financial Advisor': 'legal',
  'Real Estate Agent': 'property', 'Insurance Broker': 'legal', 'Marketing Agency': 'other',
  'Consultant': 'other', 'IT Services': 'other',
  'Electrician': 'tradie', 'Plumber': 'tradie', 'Builder / Carpenter': 'tradie', 'Painter': 'tradie',
  'Landscaper / Gardener': 'tradie', 'HVAC Technician': 'tradie', 'Tiler': 'tradie', 'Pest Control': 'tradie',
  'GP / Medical Clinic': 'clinic', 'Dentist': 'dental', 'Physiotherapist': 'clinic', 'Chiropractor': 'clinic',
  'Psychologist': 'clinic', 'Optometrist': 'clinic', 'Naturopath': 'clinic', 'Dietitian': 'clinic',
  'Podiatrist': 'clinic', 'Pharmacy': 'clinic', 'Veterinarian': 'clinic',
  'Tutoring Centre': 'other', 'Language School': 'other', 'Music School': 'other', 'Art School': 'other',
  'Driving Instructor': 'other', 'Martial Arts': 'gym', 'Personal Trainer': 'gym', 'Yoga / Pilates': 'gym',
  'Moving Service / Removalist': 'removalist', 'Car Service / Mechanic': 'tradie', 'Car Wash / Detailing': 'other',
  'Computer Repair / IT': 'other', 'Appliance Repair': 'tradie', 'Home Maintenance': 'tradie',
  'Laundry / Dry Cleaning': 'other', 'Event Planner': 'other', 'Photography / Videography': 'other',
  'Music / Entertainment': 'other', 'Consultation Service': 'other', 'Car Detailing': 'other',
  'Pet Grooming': 'salon', 'Cleaning Service': 'other',
};

const TIMEZONES = ['Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Perth','Australia/Adelaide','America/New_York','America/Los_Angeles','Europe/London'];
const VOICES = [
  { id: 'sarah', name: 'Sarah', desc: 'Warm & professional', provider: '11labs' },
  { id: 'aria',  name: 'Aria',  desc: 'Friendly & energetic', provider: '11labs' },
  { id: 'james', name: 'James', desc: 'Clear & authoritative', provider: '11labs' },
  { id: 'emily', name: 'Emily', desc: 'Calm & reassuring', provider: '11labs' },
];

const steps = [
  { id: 1, label: 'Your Business', icon: Building2 },
  { id: 2, label: 'Business Type', icon: Tag },
  { id: 3, label: 'Agent Setup', icon: Bot },
  { id: 4, label: 'Phone Number', icon: Phone },
  { id: 5, label: 'Done', icon: CheckCircle },
];

async function seedIndustryData(businessId, industry) {
  const template = getTemplate(industry);
  const staffPromises   = template.staff.map(s =>
    base44.entities.Staff.create({ ...s, business_id: businessId, is_active: true })
  );
  const servicePromises = template.services.map(s =>
    base44.entities.Service.create({ ...s, business_id: businessId, is_active: true, currency: 'AUD', buffer_minutes: s.buffer_minutes || 0, max_bookings_per_slot: 1 })
  );
  await Promise.all([...staffPromises, ...servicePromises]);
  const faqText = template.faq.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
  await base44.entities.Business.update(businessId, { business_hours: template.businessHours, faq_content: faqText });
  return template;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading]   = useState(false);
  const [seeding, setSeeding]   = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [seedSummary, setSeedSummary]   = useState(null);

  const [business, setBusiness] = useState({
    name: '', business_type: '', industry: '',
    phone: '', email: '', timezone: 'Australia/Sydney', country: 'AU', description: '',
  });
  const [agent, setAgent] = useState({
    name: 'Aria', voice_id: 'aria', voice_provider: '11labs', greeting_message: '', persona: '', services: [],
  });
  const [createdBusiness, setCreatedBusiness] = useState(null);
  const [phoneNumber, setPhoneNumber]         = useState(null);

  // ── Step 1 → 2: just store name ───────────────────────────────────────────
  const handleNameNext = () => {
    if (!business.name.trim()) return toast.error('Please enter your business name');
    setStep(2);
  };

  // ── Step 2 → create business + seed ───────────────────────────────────────
  const handleTypeNext = async () => {
    if (!business.business_type) return toast.error('Please select a business type');
    setLoading(true);

    const industry = SUBTYPE_TO_TEMPLATE[business.business_type] || 'other';
    const bizData  = { ...business, industry };

    const user = await base44.auth.me();
    const biz  = await base44.entities.Business.create({ ...bizData, owner_id: user.id, subscription_plan: 'trial' });
    setCreatedBusiness(biz);

    // Primary location
    await base44.entities.Location.create({
      business_id: biz.id, name: business.name, country: business.country || 'AU',
      timezone: business.timezone, is_primary: true,
    });

    // Knowledge cards
    const KNOWLEDGE_CATEGORIES = ['business_info','service_menu','food_menu','locations','staff','faq','service_policy','special_promotion','custom_messages'];
    const businessInfoContent = [
      `Business Name: ${business.name}`,
      `Business Type: ${business.business_type}`,
      `Industry: ${industry}`,
      business.phone    && `Phone: ${business.phone}`,
      business.email    && `Email: ${business.email}`,
      `Timezone: ${business.timezone}`,
      business.description && `About: ${business.description}`,
    ].filter(Boolean).join('\n');

    await Promise.all(KNOWLEDGE_CATEGORIES.map(category =>
      base44.entities.KnowledgeCard.create({
        business_id: biz.id, category,
        status: category === 'business_info' ? 'published' : 'not_added',
        content: category === 'business_info' ? businessInfoContent : '',
        source: category === 'business_info' ? 'sync' : undefined,
        last_synced_at: category === 'business_info' ? new Date().toISOString() : undefined,
      })
    ));

    // Seed industry data
    setSeeding(true);
    setSeedProgress('Creating staff profiles…');
    try {
      setSeedProgress('Setting up services & hours…');
      const template = await seedIndustryData(biz.id, industry);
      setSeedSummary({ staff: template.staff.length, services: template.services.length, faq: template.faq.length });
      setSeedProgress('Done!');
    } catch (e) {
      console.warn('Auto-seed failed', e);
    }
    setSeeding(false);
    setLoading(false);
    setStep(3);
  };

  // ── Step 3: create agent ───────────────────────────────────────────────────
  const handleCreateAgent = async () => {
    if (!createdBusiness) return;
    setLoading(true);
    const greeting    = agent.greeting_message || `Hi! You've reached ${business.name}. I'm ${agent.name}, your AI assistant. How can I help you today?`;
    const systemPrompt = `You are ${agent.name}, a professional AI receptionist for ${business.name}, a ${business.business_type || business.industry} business. ${agent.persona || 'Be friendly, helpful, and professional.'} Help callers with bookings, enquiries, and information about the business.`;

    const agentData = {
      business_id: createdBusiness.id, name: agent.name, voice_id: agent.voice_id,
      voice_provider: agent.voice_provider, greeting_message: greeting,
      system_prompt: systemPrompt, persona: agent.persona, services: agent.services, status: 'draft',
    };

    let vapiId = null;
    try {
      const res = await base44.functions.invoke('createVapiAssistant', {
        business_id: createdBusiness.id, name: agent.name, voice_id: agent.voice_id,
        system_prompt: systemPrompt, greeting_message: greeting,
      });
      vapiId = res.data?.assistant_id;
    } catch (e) {
      console.warn('VAPI creation failed, saving draft', e.message);
    }

    await base44.entities.Agent.create({ ...agentData, vapi_assistant_id: vapiId, status: vapiId ? 'active' : 'draft' });
    setLoading(false);
    setStep(4);
  };

  // ── Step 4: provision phone ────────────────────────────────────────────────
  const handleProvisionPhone = async () => {
    setLoading(true);
    try {
      const provRes = await base44.functions.invoke('provisionPhoneNumber', {
        business_id: createdBusiness.id, country: business.country || 'AU',
      });
      const { phone_number, phone_sid } = provRes.data;
      setPhoneNumber(phone_number);
      await base44.entities.Business.update(createdBusiness.id, {
        twilio_phone_number: phone_number, twilio_phone_sid: phone_sid, onboarding_completed: true,
      });
      const agents = await base44.entities.Agent.filter({ business_id: createdBusiness.id });
      const vapiAssistantId = agents[0]?.vapi_assistant_id;
      if (vapiAssistantId && phone_number && phone_sid) {
        try {
          await base44.functions.invoke('linkVapiPhoneNumber', {
            business_id: createdBusiness.id, assistant_id: vapiAssistantId,
            twilio_phone_number: phone_number, twilio_phone_sid: phone_sid,
          });
        } catch (linkErr) {
          console.warn('VAPI phone linking failed (non-fatal):', linkErr.message);
        }
      }
    } catch (e) {
      toast.error('Phone provisioning failed: ' + e.message);
    }
    setLoading(false);
    setStep(5);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  // Step 2 card needs more width for the picker
  const isWideStep = step === 2;

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
        <div className="flex items-center gap-2 mb-10 flex-wrap justify-center">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-foreground' :
                  done   ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-6 h-px ${done ? 'bg-success' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`w-full bg-card border border-border rounded-2xl p-8 shadow-xl ${isWideStep ? 'max-w-2xl' : 'max-w-xl'}`}>

            {/* ── Step 1: Business Name ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-syne font-bold">What's your business name?</h2>
                  <p className="text-muted-foreground text-sm mt-1">This is how your AI agent will introduce your business to callers.</p>
                </div>
                <div>
                  <Label>Business Name *</Label>
                  <Input
                    value={business.name}
                    onChange={e => setBusiness(b => ({ ...b, name: e.target.value }))}
                    placeholder="e.g. Jolly Goods Removals"
                    className="mt-1.5 text-base h-11"
                    onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                    autoFocus
                  />
                </div>
                <Button onClick={handleNameNext} className="w-full gradient-primary border-0 text-white h-11">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ── Step 2: Business Type ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-syne font-bold">What type of business are you?</h2>
                    <p className="text-muted-foreground text-sm mt-1">Select the option that best describes your business.</p>
                  </div>
                </div>

                <div className="max-h-[55vh] overflow-y-auto pr-1">
                  <BusinessTypePicker
                    selected={business.business_type}
                    onSelect={bt => setBusiness(b => ({ ...b, business_type: bt, industry: SUBTYPE_TO_TEMPLATE[bt] || 'other' }))}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleTypeNext} disabled={!business.business_type || loading} className="flex-1 gradient-primary border-0 text-white">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {seeding ? seedProgress : 'Setting up…'}
                      </span>
                    ) : <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Agent Setup ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-syne font-bold">Configure your AI agent</h2>
                  <p className="text-muted-foreground text-sm mt-1">Choose a voice and personality for your receptionist.</p>
                </div>

                {seedSummary && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <p className="text-xs text-success leading-relaxed">
                      <strong>Workspace ready!</strong> Created {seedSummary.staff} staff members, {seedSummary.services} services & {seedSummary.faq} FAQ entries tailored to your industry.
                    </p>
                  </div>
                )}

                <div>
                  <Label>Agent Name</Label>
                  <Input value={agent.name} onChange={e => setAgent(a => ({ ...a, name: e.target.value }))} placeholder="e.g. Aria" className="mt-1.5" />
                </div>
                <div>
                  <Label className="mb-2 block">Voice</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {VOICES.map(v => (
                      <button key={v.id} onClick={() => setAgent(a => ({ ...a, voice_id: v.id }))}
                        className={`p-3 rounded-xl border text-left transition-all ${agent.voice_id === v.id ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}>
                        <p className="font-semibold text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Custom Greeting (optional)</Label>
                  <Textarea value={agent.greeting_message} onChange={e => setAgent(a => ({ ...a, greeting_message: e.target.value }))}
                    placeholder={`Hi! You've reached ${business.name}. I'm here to help!`} className="mt-1.5 h-20 resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
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

            {/* ── Step 4: Phone ── */}
            {step === 4 && (
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
                    <Select value={business.country} onValueChange={v => setBusiness(b => ({ ...b, country: v }))}>
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
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                  <Button onClick={handleProvisionPhone} disabled={loading} className="flex-1 gradient-primary border-0 text-white">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Provisioning…
                      </span>
                    ) : <>Get Phone Number <ChevronRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
                <button
                  onClick={() => { setStep(5); base44.entities.Business.update(createdBusiness.id, { onboarding_completed: true }); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                  Skip for now →
                </button>
              </div>
            )}

            {/* ── Step 5: Done ── */}
            {step === 5 && (
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
                <Button onClick={() => navigate('/dashboard')} className="w-full gradient-primary border-0 text-white">
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