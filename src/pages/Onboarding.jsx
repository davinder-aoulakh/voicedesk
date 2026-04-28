import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, ChevronRight, ChevronLeft, Building2, Bot, Phone, CheckCircle, Tag, MapPin, Globe, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getTemplate } from '@/lib/industryTemplates';
import BusinessTypePicker from '@/components/onboarding/BusinessTypePicker';
import CompletionStep from '@/components/onboarding/CompletionStep';

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

// ─── Region data ───────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'NZ', label: '🇳🇿 New Zealand' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'IE', label: '🇮🇪 Ireland' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'ZA', label: '🇿🇦 South Africa' },
];

const STATES = {
  AU: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'],
  US: ['CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'AZ', 'MA', 'CO'],
  GB: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  NZ: ['Auckland', 'Wellington', 'Canterbury', 'Waikato', 'Bay of Plenty'],
  CA: ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB'],
};

const TIMEZONES_BY_COUNTRY = {
  AU: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Australia/Adelaide'],
  US: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
  GB: ['Europe/London'],
  NZ: ['Pacific/Auckland'],
  CA: ['America/Toronto', 'America/Vancouver', 'America/Winnipeg', 'America/Halifax'],
  IE: ['Europe/Dublin'],
  DE: ['Europe/Berlin'],
  FR: ['Europe/Paris'],
  SG: ['Asia/Singapore'],
  IN: ['Asia/Kolkata'],
  ZA: ['Africa/Johannesburg'],
};

// Auto-pick timezone from country+state
const DEFAULT_TZ = {
  'AU:WA': 'Australia/Perth', 'AU:QLD': 'Australia/Brisbane', 'AU:SA': 'Australia/Adelaide',
  'AU:NT': 'Australia/Darwin',
};
function pickTimezone(country, state) {
  const key = `${country}:${state}`;
  if (DEFAULT_TZ[key]) return DEFAULT_TZ[key];
  const tzs = TIMEZONES_BY_COUNTRY[country];
  return tzs ? tzs[0] : 'Australia/Sydney';
}

const VOICES = [
  { id: 'sarah', name: 'Sarah', desc: 'Warm & professional', provider: '11labs' },
  { id: 'aria',  name: 'Aria',  desc: 'Friendly & energetic', provider: '11labs' },
  { id: 'james', name: 'James', desc: 'Clear & authoritative', provider: '11labs' },
  { id: 'emily', name: 'Emily', desc: 'Calm & reassuring', provider: '11labs' },
];

const steps = [
  { id: 1, label: 'Your Business', icon: Building2 },
  { id: 2, label: 'Business Type', icon: Tag },
  { id: 3, label: 'Location', icon: MapPin },
  { id: 4, label: 'Agent Setup', icon: Bot },
  { id: 5, label: 'Phone Number', icon: Phone },
  { id: 6, label: 'Done', icon: CheckCircle },
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
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [seeding, setSeeding]   = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [seedSummary, setSeedSummary]   = useState(null);

  const [business, setBusiness] = useState({
    name: '', business_type: '', industry: '',
    location_name: '', state: '', country: 'AU', timezone: 'Australia/Sydney',
    phone: '', email: '', description: '',
  });
  const [agent, setAgent] = useState({
    name: 'Aria', voice_id: 'aria', voice_provider: '11labs', greeting_message: '', persona: '', services: [],
  });
  const [createdBusiness, setCreatedBusiness] = useState(null);
  const [phoneNumber, setPhoneNumber]         = useState(null);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [numbersLoading, setNumbersLoading]     = useState(false);
  const [numbersError, setNumbersError]         = useState(null);
  const [selectedNumber, setSelectedNumber]     = useState(null);
  const [completing, setCompleting]             = useState(false);
  const [completedBadges, setCompletedBadges]   = useState([]);
  const [progressPct, setProgressPct]           = useState(0);
  const [showSuccess, setShowSuccess]           = useState(false);
  const apiPromiseRef = useRef(null);

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  const handleNameNext = () => {
    if (!business.name.trim()) return toast.error('Please enter your business name');
    setStep(2);
  };

  // ── Step 2 → 3 (just advance, no API calls yet) ───────────────────────────
  const handleTypeNext = () => {
    if (!business.business_type) return toast.error('Please select a business type');
    // Pre-fill location name with business name as a convenience default
    setBusiness(b => ({ ...b, location_name: b.location_name || b.name }));
    setStep(3);
  };

  // ── Step 3 → 4: create business, location, knowledge cards, seed ──────────
  const handleLocationNext = async () => {
    const { location_name, state, country, timezone } = business;
    if (!location_name.trim()) return toast.error('Please enter a location name');
    if (!state.trim())         return toast.error('Please select a state / region');
    if (!country)              return toast.error('Please select a country');
    if (!timezone)             return toast.error('Please select a timezone');

    setLoading(true);
    const industry = SUBTYPE_TO_TEMPLATE[business.business_type] || 'other';
    const user = await base44.auth.me();

    const biz = await base44.entities.Business.create({
      name: business.name,
      industry,
      business_type: business.business_type,
      state: business.state,
      country: business.country,
      timezone: business.timezone,
      phone: business.phone,
      email: business.email,
      description: business.description,
      owner_id: user.id,
      subscription_plan: 'trial',
    });
    setCreatedBusiness(biz);

    // Primary location using location_name and state
    await base44.entities.Location.create({
      business_id: biz.id,
      name: business.location_name || business.name,
      address: '',
      city: '',
      state: business.state,
      country: business.country,
      timezone: business.timezone,
      is_primary: true,
    });

    // Knowledge cards
    const KNOWLEDGE_CATEGORIES = ['business_info','service_menu','food_menu','locations','staff','faq','service_policy','special_promotion','custom_messages'];
    const businessInfoContent = [
      `Business Name: ${business.name}`,
      `Business Type: ${business.business_type}`,
      `Industry: ${industry}`,
      `Location: ${business.location_name}`,
      `State: ${business.state}`,
      `Country: ${business.country}`,
      `Timezone: ${business.timezone}`,
      business.phone && `Phone: ${business.phone}`,
      business.email && `Email: ${business.email}`,
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
    setStep(4);
  };

  // ── Step 4: create agent ───────────────────────────────────────────────────
  const handleCreateAgent = async () => {
    if (!createdBusiness) return;
    setLoading(true);
    const greeting     = agent.greeting_message || `Hi! You've reached ${business.name}. I'm ${agent.name}, your AI assistant. How can I help you today?`;
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
    fetchNumbers(business.country || 'AU');
    setStep(5);
  };

  // ── Step 5: provision phone + animated completion ─────────────────────────
  const handleProvisionPhone = async () => {
    // Reset completion state and move to step 6 (animated)
    setCompleting(true);
    setCompletedBadges([]);
    setProgressPct(0);
    setShowSuccess(false);
    setStep(6);

    // Run API calls in parallel — store promise for later awaiting
    const apiPromise = (async () => {
      try {
        const provRes = await base44.functions.invoke('provisionPhoneNumber', {
          business_id: createdBusiness.id,
          country: selectedNumber?.country_code || business.country || 'AU',
          phone_number: selectedNumber?.phone_number || null,
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
    })();

    apiPromiseRef.current = apiPromise;
  };

  // ── Skip phone: go straight to animated completion with no API calls ───────
  const handleSkipPhone = async () => {
    setCompleting(true);
    setCompletedBadges([]);
    setProgressPct(0);
    setShowSuccess(false);
    setStep(6);
    apiPromiseRef.current = base44.entities.Business.update(createdBusiness.id, { onboarding_completed: true });
  };

  // ── Phone number helpers ───────────────────────────────────────────────────
  function formatPhoneLocal(e164, countryCode) {
    if (countryCode === 'AU') {
      const digits = e164.replace('+61', '0');
      if (digits.length === 10) return '(' + digits.slice(0,2) + ') ' + digits.slice(2,6) + ' ' + digits.slice(6);
    }
    if (countryCode === 'US' || countryCode === 'CA') {
      const digits = e164.replace(/^\+1/, '');
      return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6);
    }
    return e164;
  }

  const FLAG_MAP = { AU: '🇦🇺', US: '🇺🇸', GB: '🇬🇧', NZ: '🇳🇿', CA: '🇨🇦', IE: '🇮🇪', DE: '🇩🇪', FR: '🇫🇷', SG: '🇸🇬', IN: '🇮🇳', ZA: '🇿🇦' };

  const fetchNumbers = async (countryCode) => {
    setNumbersLoading(true);
    setNumbersError(null);
    setAvailableNumbers([]);
    setSelectedNumber(null);
    try {
      const res = await base44.functions.invoke('searchAvailableNumbers', { country_code: countryCode || 'AU' });
      setAvailableNumbers(res.data?.numbers || []);
    } catch (e) {
      setNumbersError('Unable to load numbers. Try a different country or skip for now.');
    }
    setNumbersLoading(false);
  };

  const isWideStep = step === 2;
  const stateOptions = STATES[business.country] || null;
  const tzOptions    = TIMEZONES_BY_COUNTRY[business.country] || ['UTC'];

  const step3Valid = business.location_name.trim() && business.state.trim() && business.country && business.timezone;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-8 py-5 border-b border-border">
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-syne font-bold text-lg">VoiceDesk</span>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-10">

        {/* Welcome header — hidden on step 6 */}
        {step < 6 && (
          <div className="w-full max-w-xl text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-syne font-bold">Welcome to VoiceDesk!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              You're on the{' '}
              <span className="font-bold" style={{ color: '#6C3BFF' }}>Starter</span>
              {' '}plan •{' '}
              <span className="text-muted-foreground">Monthly billing</span>
            </p>
          </div>
        )}

        {/* Numbered stepper — hidden on step 6 */}
        {step < 6 && (
          <div className="flex items-start gap-0 mb-8">
            {steps.filter(s => s.id < 6).map((s, i, arr) => {
              const done   = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-start">
                  <div className="flex flex-col items-center">
                    {/* Circle */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={
                        done   ? { background: '#111827', color: '#fff' } :
                        active ? { background: '#111827', color: '#fff' } :
                                 { background: '#F3F4F6', color: '#9CA3AF', border: '1.5px solid #D1D5DB' }
                      }
                    >
                      {done ? (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : s.id}
                    </div>
                    {/* Label */}
                    <span className={`hidden sm:block text-[10px] mt-1 font-medium text-center w-14 leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < arr.length - 1 && (
                    <div
                      className="h-px w-8 mt-4 transition-all"
                      style={{ background: done ? '#111827' : '#D1D5DB' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

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
                <div>
                  <h2 className="text-2xl font-syne font-bold">What type of business are you?</h2>
                  <p className="text-muted-foreground text-sm mt-1">Select the option that best describes your business.</p>
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
                  <Button onClick={handleTypeNext} disabled={!business.business_type} className="flex-1 gradient-primary border-0 text-white">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Location & Region ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-syne font-bold">Location & Region</h2>
                  <p className="text-muted-foreground text-sm mt-1">Tell us where your business is based.</p>
                </div>

                {/* Your Selections review card */}
                <div className="border border-border rounded-xl p-4 bg-secondary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Your Selections</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border border-border rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Business Name</p>
                      </div>
                      <p className="font-semibold text-sm">{business.name}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Business Type</p>
                      </div>
                      <p className="font-semibold text-sm">{business.business_type}</p>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">Location Details</span>
                  </div>
                  <div>
                    <Label>Primary location name *</Label>
                    <Input
                      value={business.location_name}
                      onChange={e => setBusiness(b => ({ ...b, location_name: e.target.value }))}
                      placeholder="e.g. Wonder Sushi Parramatta"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">This is the name of this specific location or branch.</p>
                  </div>
                </div>

                {/* Region & Timezone */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">Region & Timezone</span>
                  </div>
                  <div className="space-y-3">
                    {/* Country */}
                    <div>
                      <Label>Country *</Label>
                      <Select
                        value={business.country}
                        onValueChange={v => {
                          const tz = pickTimezone(v, '');
                          setBusiness(b => ({ ...b, country: v, state: '', timezone: tz }));
                        }}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* State */}
                    <div>
                      <Label>State / Region *</Label>
                      {stateOptions ? (
                        <Select
                          value={business.state}
                          onValueChange={v => {
                            const tz = pickTimezone(business.country, v);
                            setBusiness(b => ({ ...b, state: v, timezone: tz }));
                          }}
                        >
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={business.state}
                          onChange={e => setBusiness(b => ({ ...b, state: e.target.value }))}
                          placeholder="e.g. Bavaria"
                          className="mt-1.5"
                        />
                      )}
                    </div>

                    {/* Timezone */}
                    <div>
                      <Label>Timezone *</Label>
                      <Select
                        value={business.timezone}
                        onValueChange={v => setBusiness(b => ({ ...b, timezone: v }))}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {tzOptions.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleLocationNext} disabled={!step3Valid || loading} className="flex-1 gradient-primary border-0 text-white">
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

            {/* ── Step 4: Agent Setup ── */}
            {step === 4 && (
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
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
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

            {/* ── Step 5: Phone Number Picker ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-syne font-bold">Choose Your AI Agent Phone Number</h2>
                  </div>
                  <p className="text-muted-foreground text-sm">Select a phone number for your AI agent. You can also forward your existing business number to this number so customers reach your AI receptionist automatically.</p>
                </div>

                {/* Country selector */}
                <div>
                  <Label>Country</Label>
                  <Select
                    value={business.country}
                    onValueChange={v => { setBusiness(b => ({ ...b, country: v })); fetchNumbers(v); }}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Number list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Available Numbers</p>
                    <button onClick={() => fetchNumbers(business.country)} disabled={numbersLoading}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50">
                      <RefreshCw className={`w-4 h-4 text-muted-foreground ${numbersLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {numbersLoading && (
                    <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground text-sm">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Fetching available numbers in {COUNTRIES.find(c => c.code === business.country)?.label?.replace(/^.+?\s/, '') || business.country}…
                    </div>
                  )}

                  {numbersError && !numbersLoading && (
                    <div className="py-6 text-center text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4">
                      {numbersError}
                    </div>
                  )}

                  {!numbersLoading && !numbersError && availableNumbers.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground border border-border rounded-xl">
                      No numbers loaded yet.{' '}
                      <button onClick={() => fetchNumbers(business.country)} className="text-primary underline">Fetch numbers</button>
                    </div>
                  )}

                  {!numbersLoading && availableNumbers.length > 0 && (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {availableNumbers.map((num, i) => {
                        const isSelected = selectedNumber?.phone_number === num.phone_number;
                        const flag = FLAG_MAP[num.country_code || business.country] || '📞';
                        const formatted = formatPhoneLocal(num.phone_number, num.country_code || business.country);
                        return (
                          <button key={i} onClick={() => setSelectedNumber(num)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                            style={isSelected ? { borderColor: '#6C3BFF', background: '#FAF5FF' } : {}}>
                            <span className="text-xl shrink-0">{flag}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{formatted}</p>
                              {num.region && <p className="text-xs text-muted-foreground">{num.region}</p>}
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#6C3BFF' }}>
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected confirmation */}
                  {selectedNumber && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-success font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Selected: {FLAG_MAP[selectedNumber.country_code || business.country] || '📞'} {formatPhoneLocal(selectedNumber.phone_number, selectedNumber.country_code || business.country)}{selectedNumber.region ? ` — ${selectedNumber.region}` : ''}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                  <Button onClick={handleProvisionPhone} disabled={!selectedNumber || loading} className="flex-1 gradient-primary border-0 text-white">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Setting up…
                      </span>
                    ) : 'Complete Setup'}
                  </Button>
                </div>
                <button
                  onClick={handleSkipPhone}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                  Skip for now →
                </button>
              </div>
            )}

            {/* ── Step 6: Animated Completion ── */}
            {step === 6 && (
              <CompletionStep
                completing={completing}
                setCompleting={setCompleting}
                completedBadges={completedBadges}
                setCompletedBadges={setCompletedBadges}
                progressPct={progressPct}
                setProgressPct={setProgressPct}
                showSuccess={showSuccess}
                setShowSuccess={setShowSuccess}
                apiPromiseRef={apiPromiseRef}
                seedSummary={seedSummary}
                phoneNumber={phoneNumber}
                onNavigate={() => navigate('/dashboard')}
              />
            )}

          </motion.div>
        </AnimatePresence>

        {/* Plan features card — shown on steps 1–5 */}
        {step < 6 && (
          <div className="w-full max-w-xl mt-4 border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm">Starter</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white" style={{ background: '#6C3BFF' }}>Monthly</span>
            </div>
            <div className="space-y-2">
              {['Booking Management', 'Staff & Services Management', 'AI Voice Agent Included'].map(feature => (
                <div key={feature} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#6C3BFF' }}>
                    <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                      <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}