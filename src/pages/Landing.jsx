import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Zap, Phone, Calendar, BarChart3, Star, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const features = [
  { icon: Phone, title: '24/7 AI Receptionist', desc: 'Never miss a call. Your AI agent answers every enquiry, day or night.' },
  { icon: Calendar, title: 'Smart Booking', desc: 'Customers book appointments during the call. Confirmations sent automatically.' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Track call volume, conversion rates, sentiment and revenue in real time.' },
  { icon: Zap, title: 'VAPI-Powered Voice', desc: 'Ultra-natural AI voices that callers can\'t distinguish from a real person.' },
];

const plans = [
  { name: 'Starter', price: '$49', calls: '200 calls/mo', features: ['1 AI Agent', 'Call recording', 'Basic analytics', 'Email support'] },
  { name: 'Growth', price: '$149', calls: '1,000 calls/mo', highlight: true, features: ['3 AI Agents', 'Call recording + transcripts', 'Full analytics', 'SMS reminders', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', calls: 'Unlimited', features: ['Unlimited agents', 'Custom integrations', 'Dedicated CSM', 'SLA guarantee'] },
];

export default function Landing() {
  const handleLogin = () => base44.auth.redirectToLogin('/');

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-bold text-xl">VoiceDesk</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</button>
            <Button onClick={handleLogin} className="gradient-primary border-0 text-white shadow-lg shadow-primary/25">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Powered by VAPI AI Voice Technology
            </div>
            <h1 className="text-5xl md:text-7xl font-syne font-bold leading-tight mb-6">
              Your AI Voice Agent<br />
              <span className="gradient-text">Books While You Sleep</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Deploy a 24/7 AI receptionist that answers calls, handles bookings, and grows your business — in under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleLogin} size="lg" className="gradient-primary border-0 text-white shadow-xl shadow-primary/30 text-base px-8">
                Start Free Trial <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button onClick={handleLogin} size="lg" variant="outline" className="text-base px-8">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">No credit card required · Setup in 10 minutes</p>
          </motion.div>
        </div>
      </section>

      {/* Live call visual */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card animate-pulse"></span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Aria — AI Receptionist</p>
                <p className="text-sm text-success">Live call · 0:42</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { role: 'caller', msg: 'Hi, I\'d like to book a haircut for Saturday afternoon.' },
                { role: 'agent', msg: 'Of course! I have 2pm and 4pm available this Saturday. Which works best for you?' },
                { role: 'caller', msg: '2pm sounds perfect.' },
                { role: 'agent', msg: 'Great! I\'ve booked you in for Saturday at 2pm. You\'ll receive a confirmation SMS shortly. Is there anything else I can help with?' },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: m.role === 'agent' ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className={`flex ${m.role === 'caller' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                    m.role === 'agent' ? 'bg-accent text-accent-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {m.msg}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">Everything your receptionist needs</h2>
          <p className="text-muted-foreground text-center mb-14">Built for service businesses that never want to miss a booking</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
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

      {/* Pricing */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-syne font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-muted-foreground text-center mb-14">Start free, scale as you grow</p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(p => (
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
                <Button onClick={handleLogin} className={`w-full ${p.highlight ? 'bg-white text-primary hover:bg-white/90' : 'gradient-primary border-0 text-white'}`}>
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-primary rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-syne font-bold text-sm">VoiceDesk</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 VoiceDesk. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}