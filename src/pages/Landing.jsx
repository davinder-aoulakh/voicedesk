import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Zap, Phone, Calendar, BarChart3, CheckCircle, ChevronRight,
  Users, Clock, MapPin, Wrench, Star, Menu, X, ChevronDown,
  MessageSquare, TrendingUp, Shield, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data ─────────────────────────────────────────────────────────────────────

const COUNTRY_SAMPLES = {
  AU: '+61 4XX XXX XXX', NZ: '+64 21 XXX XXXX', US: '+1 (555) XXX-XXXX',
  GB: '+44 7XXX XXXXXX', CA: '+1 (604) XXX-XXXX', SG: '+65 9XXX XXXX',
  IN: '+91 98XXX XXXXX', DEFAULT: '+1 (555) XXX-XXXX',
};

const INDUSTRIES = [
  { name: 'Restaurant',       emoji: '🍽️', persona: 'Jordan — Restaurant Host' },
  { name: 'Beauty & Salon',   emoji: '💇', persona: 'Sophie — Salon Specialist' },
  { name: 'Medical Clinic',   emoji: '🏥', persona: 'Dr. Alex — Clinic Receptionist' },
  { name: 'Tradie',           emoji: '🔧', persona: 'Mike — Trades Coordinator' },
  { name: 'Property Agency',  emoji: '🏠', persona: 'Emma — Property Concierge' },
  { name: 'Gym & Fitness',    emoji: '💪', persona: 'Jake — Fitness Advisor' },
  { name: 'Legal',            emoji: '⚖️', persona: 'Victoria — Legal Assistant' },
  { name: 'Spa & Wellness',   emoji: '🧖', persona: 'Luna — Wellness Guide' },
];

const FEATURES_TABS = [
  {
    id: 'bookings', label: 'Bookings',
    title: 'Smart Appointment Booking',
    desc: 'Your AI agent handles end-to-end booking — checking availability, confirming slots, and sending SMS confirmations automatically. No double-bookings, no missed calls.',
    bullets: ['Real-time availability checking', 'Instant SMS & email confirmations', 'Cancellation & rescheduling support', 'Multi-staff booking management'],
    icon: Calendar,
  },
  {
    id: 'staff', label: 'Staff',
    title: 'Staff & Roster Management',
    desc: 'Assign bookings to the right staff member automatically. Set individual working hours, manage rosters, and ensure customers are matched with their preferred team member.',
    bullets: ['Per-staff working hours', 'Preferred staff memory', 'Automated assignment rules', 'Staff performance analytics'],
    icon: Users,
  },
  {
    id: 'services', label: 'Services',
    title: 'Service Catalogue',
    desc: 'Define your full service menu with pricing, duration, and availability. Your AI agent knows exactly what you offer and upsells add-ons naturally during every call.',
    bullets: ['Unlimited services & categories', 'Dynamic pricing & add-ons', 'Location-specific services', 'AI-powered upsell suggestions'],
    icon: Wrench,
  },
  {
    id: 'availability', label: 'Availability',
    title: 'Flexible Scheduling',
    desc: 'Set business hours, holiday closures, and date-specific overrides. Your AI never books outside available windows, keeping your schedule perfectly managed.',
    bullets: ['Custom business hours per day', 'Holiday & closure management', 'Date-specific hour overrides', 'Time zone aware booking'],
    icon: Clock,
  },
  {
    id: 'customers', label: 'Customers',
    title: 'Customer Relationship Hub',
    desc: 'Every caller becomes a customer record. Track booking history, preferences, and contact details. Your AI greets returning customers by name for a premium experience.',
    bullets: ['Auto-created customer profiles', 'Booking & call history', 'Custom tags & segments', 'Returning caller recognition'],
    icon: MessageSquare,
  },
  {
    id: 'analytics', label: 'Analytics',
    title: 'Real-Time Performance Insights',
    desc: 'Monitor call volume, conversion rates, sentiment trends, and revenue impact in one dashboard. Make data-driven decisions to grow your business faster.',
    bullets: ['Live call & booking metrics', 'Sentiment & outcome tracking', 'Revenue attribution', 'Custom date range reporting'],
    icon: TrendingUp,
  },
];

const FAQS = [
  { q: 'How quickly can I set up VoiceDesk?', a: 'Most businesses are live in under 10 minutes. Our onboarding wizard guides you through setting up your business profile, AI agent, and phone number step by step.' },
  { q: 'Does VoiceDesk replace my existing phone number?', a: 'No. VoiceDesk provisions a dedicated AI number that you can forward calls to, or use as a separate after-hours line. Your existing number is untouched.' },
  { q: 'What happens if a customer asks something the AI doesn\'t know?', a: 'The AI is trained on your business knowledge base. For anything outside its knowledge, it politely takes a message and flags it for your team to follow up.' },
  { q: 'Can I use my own Twilio number?', a: 'Yes! If you already have a Twilio account, you can import your existing numbers directly into VoiceDesk through the Phone settings page.' },
  { q: 'Is call recording included?', a: 'Yes, call recording is included on all plans. Recordings are stored securely and accessible from your dashboard alongside AI-generated transcripts and summaries.' },
  { q: 'What industries does VoiceDesk support?', a: 'VoiceDesk is purpose-built for service businesses including restaurants, salons, medical clinics, tradies, property agencies, gyms, legal practices, and spas — with industry-specific templates for each.' },
];

const PLANS = [
  { name: 'Starter', price: '$49', calls: '200 calls/mo', features: ['1 AI Agent', 'Call recording', 'Basic analytics', 'Email support'] },
  { name: 'Growth', price: '$149', calls: '1,000 calls/mo', highlight: true, features: ['3 AI Agents', 'Call recording + transcripts', 'Full analytics', 'SMS reminders', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', calls: 'Unlimited', features: ['Unlimited agents', 'Custom integrations', 'Dedicated CSM', 'SLA guarantee'] },
];

const CORE_FEATURES = [
  { icon: Phone,    title: '24/7 AI Receptionist',  desc: 'Never miss a call. Your AI agent answers every enquiry, day or night.' },
  { icon: Calendar, title: 'Smart Booking',          desc: 'Customers book appointments during the call. Confirmations sent automatically.' },
  { icon: BarChart3,title: 'Live Analytics',         desc: 'Track call volume, conversion rates, sentiment and revenue in real time.' },
  { icon: Zap,      title: 'VAPI-Powered Voice',     desc: "Ultra-natural AI voices that callers can't distinguish from a real person." },
];

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <span className="font-medium text-sm md:text-base pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  const [samplePhone, setSamplePhone] = useState(COUNTRY_SAMPLES.DEFAULT);
  const [activeTab, setActiveTab] = useState('bookings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const featuresRef = useRef(null);
  const industriesRef = useRef(null);
  const pricingRef = useRef(null);

  const handleCTA = () => base44.auth.redirectToLogin('/dashboard');

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const code = d.country_code || 'DEFAULT';
        setSamplePhone(COUNTRY_SAMPLES[code] || COUNTRY_SAMPLES.DEFAULT);
      })
      .catch(() => {});
  }, []);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const activeFeature = FEATURES_TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── 1. Sticky Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-bold text-xl">VoiceDesk</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <button onClick={() => scrollTo(featuresRef)} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo(industriesRef)} className="hover:text-foreground transition-colors">Industries</button>
            <button onClick={() => scrollTo(pricingRef)} className="hover:text-foreground transition-colors">Pricing</button>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={handleCTA} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</button>
            <Button onClick={handleCTA} className="gradient-primary border-0 text-white shadow-lg shadow-primary/25 text-sm">
              Start Free Trial
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(v => !v)} className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="md:hidden border-t border-border/50 bg-card px-6 py-4 space-y-3">
              <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left text-sm py-2 hover:text-primary transition-colors">Features</button>
              <button onClick={() => scrollTo(industriesRef)} className="block w-full text-left text-sm py-2 hover:text-primary transition-colors">Industries</button>
              <button onClick={() => scrollTo(pricingRef)} className="block w-full text-left text-sm py-2 hover:text-primary transition-colors">Pricing</button>
              <button onClick={handleCTA} className="block w-full text-left text-sm py-2 hover:text-primary transition-colors">Log In</button>
              <Button onClick={handleCTA} className="w-full gradient-primary border-0 text-white">Start Free Trial</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── 2. Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> Powered by VAPI AI Voice Technology
            </div>
            <h1 className="text-5xl md:text-7xl font-syne font-bold leading-tight mb-6">
              Your AI Voice Agent<br />
              <span className="gradient-text">Books While You Sleep</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Deploy a 24/7 AI receptionist that answers calls, handles bookings, and grows your business — in under 10 minutes.
            </p>

            {/* Country-detected sample number */}
            <div className="inline-flex items-center gap-2.5 bg-card border border-border rounded-xl px-5 py-3 mb-8 shadow-sm">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Your AI number could look like</p>
                <p className="text-sm font-semibold font-mono">{samplePhone}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button onClick={handleCTA} size="lg" className="gradient-primary border-0 text-white shadow-xl shadow-primary/30 text-base px-8">
                Start Free Trial <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button onClick={handleCTA} size="lg" variant="outline" className="text-base px-8">
                Try a Demo Call
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">No credit card required · Setup in 10 minutes</p>
          </motion.div>
        </div>
      </section>

      {/* Live call visual */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Aria — AI Receptionist</p>
                <p className="text-sm text-success">Live call · 0:42</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { role: 'caller', msg: "Hi, I'd like to book a haircut for Saturday afternoon." },
                { role: 'agent',  msg: "Of course! I have 2pm and 4pm available this Saturday. Which works best for you?" },
                { role: 'caller', msg: "2pm sounds perfect." },
                { role: 'agent',  msg: "Great! I've booked you in for Saturday at 2pm. You'll receive a confirmation SMS shortly. Is there anything else I can help with?" },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: m.role === 'agent' ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className={`flex ${m.role === 'caller' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                    m.role === 'agent' ? 'bg-accent text-accent-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>{m.msg}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-14">Up and running in three simple steps</p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            {[
              { step: 1, icon: Wrench,   title: 'Set Up Your Business Profile', desc: 'Enter your business details, services, staff, and working hours. Our wizard takes less than 10 minutes.' },
              { step: 2, icon: Phone,    title: 'Customers Call Your AI Receptionist', desc: 'Your AI agent answers every call 24/7 — books appointments, answers FAQs, and handles requests naturally.' },
              { step: 3, icon: BarChart3,title: 'Manage Everything from Dashboard', desc: 'View bookings, call logs, analytics, and customer records in one clean dashboard. Always in control.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: step * 0.1 }}
                className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-card border-2 border-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{step}</span>
                  </div>
                </div>
                <h3 className="font-syne font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Industry Cards ───────────────────────────────────────────────── */}
      <section ref={industriesRef} className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">Built for Your Industry</h2>
          <p className="text-muted-foreground text-center mb-14">Industry-specific AI personas with pre-loaded knowledge and workflows</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {INDUSTRIES.map((ind, i) => (
              <motion.div key={ind.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer text-center">
                <div className="text-4xl mb-3">{ind.emoji}</div>
                <h3 className="font-syne font-semibold text-base mb-2">{ind.name}</h3>
                <p className="text-xs text-muted-foreground bg-secondary/60 rounded-full px-3 py-1 inline-block">{ind.persona}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button onClick={handleCTA} className="gradient-primary border-0 text-white shadow-lg shadow-primary/20">
              Start Free for Your Industry <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── 5. Features Deep-Dive ───────────────────────────────────────────── */}
      <section ref={featuresRef} className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">Everything your receptionist needs</h2>
          <p className="text-muted-foreground text-center mb-12">Built for service businesses that never want to miss a booking</p>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {FEATURES_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeFeature && (
              <motion.div key={activeFeature.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
                className="grid md:grid-cols-2 gap-10 items-center bg-card border border-border rounded-2xl p-8 md:p-12">
                <div>
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-5">
                    <activeFeature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-syne font-bold mb-4">{activeFeature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{activeFeature.desc}</p>
                  <ul className="space-y-3">
                    {activeFeature.bullets.map(b => (
                      <li key={b} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-56 h-56 gradient-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 opacity-90">
                    <activeFeature.icon className="w-24 h-24 text-white/80" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── 6. Core Features Grid ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-syne font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section ref={pricingRef} className="py-20 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-muted-foreground text-center mb-14">Start free, scale as you grow</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`p-8 rounded-2xl border ${p.highlight
                ? 'border-primary bg-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-105'
                : 'border-border bg-card'}`}>
                <p className={`text-sm font-semibold mb-1 ${p.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{p.name}</p>
                <p className="text-4xl font-syne font-bold mb-1">{p.price}</p>
                <p className={`text-sm mb-6 ${p.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{p.calls}</p>
                <ul className="space-y-2.5 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${p.highlight ? 'text-primary-foreground' : 'text-success'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCTA} className={`w-full ${p.highlight ? 'bg-white text-primary hover:bg-white/90' : 'gradient-primary border-0 text-white'}`}>
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-center mb-12">Everything you need to know about VoiceDesk</p>
          <div className="space-y-3">
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-card border border-border rounded-3xl p-12 shadow-xl shadow-primary/5">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-syne font-bold mb-4">Ready to never miss a booking?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Join hundreds of businesses using VoiceDesk to automate their front desk and grow revenue 24/7.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleCTA} size="lg" className="gradient-primary border-0 text-white shadow-xl shadow-primary/30 text-base px-10">
              Start Free Trial <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button onClick={handleCTA} size="lg" variant="outline" className="text-base px-8">
              Book a Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── 8. Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-syne font-bold text-lg">VoiceDesk</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                AI-powered voice receptionist for modern service businesses. Never miss a call, never miss a booking.
              </p>
            </div>
            {/* Product links */}
            <div>
              <p className="font-semibold text-sm mb-4">Product</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo(featuresRef)} className="hover:text-foreground transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo(industriesRef)} className="hover:text-foreground transition-colors">Industries</button></li>
                <li><button onClick={() => scrollTo(pricingRef)} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={handleCTA} className="hover:text-foreground transition-colors">Get Started</button></li>
              </ul>
            </div>
            {/* Company links */}
            <div>
              <p className="font-semibold text-sm mb-4">Company</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 VoiceDesk. All rights reserved.</p>
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}