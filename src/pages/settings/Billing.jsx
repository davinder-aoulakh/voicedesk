import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Check, Zap, Phone, Users, BookOpen, Bot, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    monthly: 49,
    yearly: 39,
    color: '#3B82F6',
    bg: '#EFF6FF',
    features: [
      '1 AI Voice Agent',
      '100 mins / month',
      '1 Location',
      'Up to 3 Staff',
      'Basic Bookings',
      'Email Support',
    ],
  },
  {
    key: 'advance',
    name: 'Advance',
    monthly: 79,
    yearly: 63,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    popular: true,
    features: [
      '2 AI Voice Agents',
      '300 mins / month',
      '3 Locations',
      'Up to 10 Staff',
      'Advanced Bookings',
      'Customer CRM',
      'Priority Support',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthly: 129,
    yearly: 103,
    color: '#EC4899',
    bg: '#FDF4FF',
    features: [
      '5 AI Voice Agents',
      '800 mins / month',
      '10 Locations',
      'Unlimited Staff',
      'Full CRM + Analytics',
      'Knowledge Base',
      'WhatsApp Integration',
      'Dedicated Support',
    ],
  },
  {
    key: 'expert',
    name: 'Expert',
    monthly: 249,
    yearly: 199,
    color: '#F59E0B',
    bg: '#FFFBEB',
    features: [
      'Unlimited AI Agents',
      'Unlimited Minutes',
      'Unlimited Locations',
      'Unlimited Staff',
      'Custom Integrations',
      'White-label Option',
      'SLA Guarantee',
      'Dedicated Account Manager',
    ],
  },
];

const FEATURE_ICONS = { Phone, Users, BookOpen, Bot };

function UsageStat({ label, used, limit, color }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{used} / {limit === 999 ? '∞' : limit}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Billing() {
  const [business, setBusiness] = useState(null);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (businesses.length) setBusiness(businesses[0]);
      setLoading(false);
    };
    load();
  }, []);

  const currentPlan = business?.subscription_plan || 'trial';

  const handleUpgrade = (plan) => {
    toast.info(`Redirecting to checkout for ${plan.name} plan…`);
    // Stripe checkout link would go here
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activePlan = PLANS.find(p => p.key === currentPlan);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1 text-sm">Choose the plan that fits your business</p>
      </div>

      {/* Current Plan Usage */}
      {activePlan && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: activePlan.bg }}>
                <CreditCard className="w-5 h-5" style={{ color: activePlan.color }} />
              </div>
              <div>
                <p className="font-syne font-bold">{activePlan.name} Plan</p>
                <p className="text-xs text-muted-foreground">Current subscription</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: activePlan.color }}>
              Active
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <UsageStat label="Voice Minutes" used={0} limit={100} color={activePlan.color} />
            <UsageStat label="Locations" used={1} limit={1} color={activePlan.color} />
            <UsageStat label="Staff Members" used={0} limit={3} color={activePlan.color} />
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
        <button
          onClick={() => setYearly(v => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-primary' : 'bg-secondary border border-border'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${yearly ? 'translate-x-6' : ''}`} />
        </button>
        <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Yearly <span className="text-xs text-success font-semibold">Save 20%</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan;
          const price = yearly ? plan.yearly : plan.monthly;

          return (
            <div
              key={plan.key}
              className={`relative bg-card border rounded-2xl p-5 flex flex-col transition-shadow hover:shadow-lg ${
                plan.popular ? 'border-primary shadow-md' : 'border-border'
              } ${isCurrent ? 'ring-2 ring-offset-1' : ''}`}
              style={isCurrent ? { ringColor: plan.color } : {}}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-semibold text-white"
                  style={{ background: plan.color }}>
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3 px-3 py-0.5 rounded-full text-[11px] font-semibold text-white bg-success">
                  Current Plan
                </div>
              )}

              <div className="mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: plan.bg }}>
                  <Zap className="w-4.5 h-4.5" style={{ color: plan.color }} />
                </div>
                <h3 className="font-syne font-bold text-lg">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-3xl font-syne font-bold">${price}</span>
                  <span className="text-sm text-muted-foreground mb-1">/mo</span>
                </div>
                {yearly && <p className="text-xs text-success font-medium">Billed annually (${price * 12}/yr)</p>}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: plan.color }} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => !isCurrent && handleUpgrade(plan)}
                disabled={isCurrent}
                className="w-full border-0 text-white font-semibold"
                style={isCurrent ? { background: '#e5e7eb', color: '#6b7280' } : { background: plan.color }}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade Now'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="font-syne font-bold text-lg">Need something custom?</p>
          <p className="text-sm text-muted-foreground mt-1">Contact us for enterprise pricing, custom integrations, or volume discounts.</p>
        </div>
        <Button variant="outline" className="shrink-0" onClick={() => toast.info('Contact sales@voicedesk.ai')}>
          Contact Sales
        </Button>
      </div>
    </div>
  );
}