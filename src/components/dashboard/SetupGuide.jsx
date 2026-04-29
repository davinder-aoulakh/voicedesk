import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, Check, MoreHorizontal, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'business_info',
    title: 'Update your business info',
    description: 'Add your business name, industry, address, timezone, and logo so your AI agent has the right context.',
    cta: 'Go to Business Info',
    path: '/settings/business-info',
    manualComplete: false,
  },
  {
    id: 'location',
    title: 'Setup Location',
    description: 'Add at least one location so customers can find you and the AI can reference your address.',
    cta: 'Setup Locations',
    path: '/settings/locations',
    manualComplete: false,
  },
  {
    id: 'availability',
    title: 'Set booking availability',
    description: 'Configure your business hours so the AI knows when to accept bookings.',
    cta: 'Set Availability',
    path: '/availability',
    manualComplete: false,
  },
  {
    id: 'resources',
    title: 'Setup your booking resources',
    description: 'Add at least one service and one staff member so the AI can create bookings.',
    cta: 'Manage Services',
    path: '/services',
    manualComplete: false,
  },
  {
    id: 'agent',
    title: 'Setup AI Voice Agent',
    description: 'Configure your AI agent\'s greetings, personality, and voice to match your brand.',
    cta: 'Configure Agent',
    path: '/agent/greetings',
    manualComplete: false,
  },
  {
    id: 'tools',
    title: 'Setup AI Tools',
    description: 'Enable tools so your AI can book appointments, send links, and transfer calls.',
    cta: 'Setup Tools',
    path: '/agent/tools',
    manualComplete: false,
  },
  {
    id: 'knowledge',
    title: 'Setup AI Agent Knowledges',
    description: 'Publish knowledge cards (FAQs, menus, policies) so your AI can answer customer questions accurately.',
    cta: 'Add Knowledge',
    path: '/knowledge',
    manualComplete: false,
  },
  {
    id: 'test_call',
    title: 'Make a test call',
    description: 'Call your AI number and verify it responds correctly. Click "Mark as Complete" when done.',
    cta: 'Go to Voice Settings',
    path: '/agent/voice',
    manualComplete: true,
  },
  {
    id: 'booking_page',
    title: 'Setup Online Booking Page',
    description: 'Configure your public booking page so customers can book online without calling.',
    cta: 'Setup Booking Page',
    path: '/booking-page',
    manualComplete: true,
  },
];

// ─── Completion check helper ──────────────────────────────────────────────────
function computeCompleted(data) {
  const { business, locations, services, staff, agent, knowledgeCards, setupSteps } = data;
  return {
    business_info: !!(business?.name && business?.industry && business?.timezone),
    location:      locations?.length > 0,
    availability:  !!(business?.business_hours && Object.values(business.business_hours).some(d => d?.slots?.length > 0 || d?.open === true)),
    resources:     services?.length > 0 && staff?.length > 0,
    agent:         !!agent?.vapi_assistant_id,
    tools:         (agent?.enabled_tools || []).length > 0,
    knowledge:     knowledgeCards?.filter(k => k.category !== 'business_info' && k.status === 'published').length > 0,
    test_call:     !!setupSteps?.test_call,
    booking_page:  !!setupSteps?.booking_page,
  };
}

export default function SetupGuide({ business, onDismiss }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed]       = useState(false);
  const [dismissed, setDismissed]       = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [completed, setCompleted]       = useState({});
  const [allDone, setAllDone]           = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [bizId, setBizId]               = useState(null);
  const [setupSteps, setSetupSteps]     = useState({});

  useEffect(() => {
    if (!business) return;
    setBizId(business.id);
    setSetupSteps(business.setup_steps || {});
    loadData(business);
  }, [business]);

  const loadData = async (biz) => {
    const [locations, services, staff, agents, knowledgeCards] = await Promise.all([
      base44.entities.Location.filter({ business_id: biz.id }),
      base44.entities.Service.filter({ business_id: biz.id }),
      base44.entities.Staff.filter({ business_id: biz.id }),
      base44.entities.Agent.filter({ business_id: biz.id }),
      base44.entities.KnowledgeCard.filter({ business_id: biz.id }),
    ]);
    const c = computeCompleted({
      business: biz,
      locations,
      services,
      staff,
      agent: agents[0] || null,
      knowledgeCards,
      setupSteps: biz.setup_steps || {},
    });
    setCompleted(c);
    const total = Object.values(c).filter(Boolean).length;
    if (total === 9) triggerAllDone();
  };

  const triggerAllDone = () => {
    setAllDone(true);
    setShowSuccess(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 }, colors: ['#6C3BFF', '#10B981', '#F59E0B'] });
    setTimeout(() => { setDismissed(true); if (onDismiss) onDismiss(); }, 4000);
  };

  const markManualComplete = async (stepId) => {
    const updated = { ...setupSteps, [stepId]: true };
    setSetupSteps(updated);
    await base44.entities.Business.update(bizId, { setup_steps: updated });
    const biz = { ...business, setup_steps: updated };
    await loadData(biz);
  };

  const handleDismiss = () => { setDismissed(true); if (onDismiss) onDismiss(); };
  const handleReset   = () => { setCompleted({}); setSetupSteps({}); setAllDone(false); };

  if (dismissed) return null;

  const completedCount = Object.values(completed).filter(Boolean).length;
  const pct = Math.round((completedCount / 9) * 100);

  // Success banner
  if (showSuccess) {
    return (
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-xl p-5 mb-6 flex items-center gap-4 border border-success/30"
        style={{ background: '#ECFDF5' }}>
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="font-syne font-bold text-success">Setup complete! 🎉</p>
          <p className="text-sm text-success/80">Your AI receptionist is fully configured and ready to take calls.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border mb-6 overflow-hidden" style={{ background: '#F9FAFB', borderRadius: '12px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="font-semibold text-base flex-1">Setup guide</span>
        <span className="text-sm text-muted-foreground font-medium">{completedCount} / 9 completed</span>

        {/* 3-dot menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-border transition-colors">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20 w-40">
              <button onClick={() => { setMenuOpen(false); handleDismiss(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">Dismiss guide</button>
              <button onClick={() => { setMenuOpen(false); handleReset(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">Reset progress</button>
            </div>
          )}
        </div>

        {/* Collapse */}
        <button onClick={() => setCollapsed(v => !v)}
          className="p-1.5 rounded-lg hover:bg-border transition-colors">
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-border">
        <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${pct}%`, background: '#6C3BFF' }} />
      </div>

      {/* Steps */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="divide-y divide-border">
              {STEPS.map((step) => {
                const done = !!completed[step.id];
                const isExpanded = expandedStep === step.id;

                return (
                  <div key={step.id}>
                    {/* Step row */}
                    <button
                      onClick={() => !done && setExpandedStep(isExpanded ? null : step.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/60 transition-colors"
                    >
                      {/* Circle indicator */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={done
                          ? { background: '#6C3BFF' }
                          : { background: 'transparent', border: '2px solid #D1D5DB' }
                        }>
                        {done && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>

                      <span className="flex-1 text-sm font-medium" style={done ? { color: '#9CA3AF', textDecoration: 'line-through' } : {}}>
                        {step.title}
                      </span>

                      {!done && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform shrink-0"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                      )}
                    </button>

                    {/* Expanded panel */}
                    <AnimatePresence>
                      {isExpanded && !done && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                          <div className="px-14 pb-4 space-y-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                            <div className="flex gap-2">
                              <Button size="sm" className="gap-1.5 border-0 text-white text-xs"
                                style={{ background: '#6C3BFF' }}
                                onClick={() => navigate(step.path)}>
                                {step.cta} <ChevronRight className="w-3 h-3" />
                              </Button>
                              {step.manualComplete && (
                                <Button size="sm" variant="outline" className="text-xs"
                                  onClick={() => { markManualComplete(step.id); setExpandedStep(null); }}>
                                  Mark as Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}