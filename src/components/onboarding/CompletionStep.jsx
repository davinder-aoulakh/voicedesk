import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BADGES = [
  { label: 'Creating workspace', completeAt: 600 },
  { label: 'Setting up',         completeAt: 1300 },
  { label: 'Configuring AI',     completeAt: 2100 },
  { label: 'Finalizing setup',   completeAt: 2900 },
];

function SpinnerIcon() {
  return (
    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
  );
}

function CheckBadgeIcon() {
  return (
    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#6C3BFF' }}>
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function CompletionStep({
  completing, setCompleting,
  completedBadges, setCompletedBadges,
  progressPct, setProgressPct,
  showSuccess, setShowSuccess,
  apiPromiseRef,
  seedSummary, phoneNumber,
  linkStatus,
  onNavigate,
}) {
  const timersRef = useRef([]);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!completing || hasRunRef.current) return;
    hasRunRef.current = true;

    const TOTAL_MS = 3000;

    // Animate progress bar
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));
      setProgressPct(pct);
      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    // Schedule badge completions
    BADGES.forEach((badge, idx) => {
      const t = setTimeout(() => {
        setCompletedBadges(prev => [...prev, idx]);
      }, badge.completeAt);
      timersRef.current.push(t);
    });

    // At 3000ms: wait for API then reveal success
    const finishTimer = setTimeout(async () => {
      if (apiPromiseRef.current) {
        await apiPromiseRef.current;
      }
      setProgressPct(100);
      setCompleting(false);
      setShowSuccess(true);
    }, TOTAL_MS);
    timersRef.current.push(finishTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [completing]);

  // ── Phase 1: Animated progress ────────────────────────────────────────────
  if (completing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-syne font-bold">Setting up your workspace…</h2>
          <p className="text-muted-foreground text-sm mt-1">This will only take a moment.</p>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Progress</span>
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, hsl(252 85% 60%), hsl(280 85% 65%))',
              }}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 gap-3">
          {BADGES.map((badge, idx) => {
            // Badge 2 (index 2) = "Configuring AI" — driven by real linkStatus
            let done = completedBadges.includes(idx);
            let isError = false;
            if (idx === 2) {
              if (linkStatus === 'done') done = true;
              if (linkStatus === 'error') { done = false; isError = true; }
            }
            return (
              <motion.div
                key={badge.label}
                animate={done ? { scale: 1, opacity: 1 } : { scale: 0.97, opacity: 0.85 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium"
                style={isError
                  ? { background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }
                  : done
                    ? { background: '#EDE9FF', borderColor: '#C4B5FD', color: '#6C3BFF' }
                    : { background: '#F3F4F6', borderColor: '#E5E7EB', color: '#6B7280' }
                }
              >
                {isError
                  ? <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0"><span className="text-white text-xs font-bold">!</span></div>
                  : done ? <CheckBadgeIcon /> : <SpinnerIcon />}
                <span>{isError ? 'Link failed' : badge.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Phase 2: Success state ─────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-5"
      >
        {/* Check icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, hsl(252 85% 60%), hsl(280 85% 65%))' }}>
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-syne font-bold">Welcome to VoiceDesk! 🎉</h2>
          <p className="text-muted-foreground text-sm mt-2">Your AI receptionist is live and ready to take calls.</p>
        </div>

        {/* Metrics */}
        {seedSummary && (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Staff Added',    value: seedSummary.staff },
              { label: 'Services Added', value: seedSummary.services },
              { label: 'FAQs Added',     value: seedSummary.faq },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-accent rounded-xl">
                <p className="text-2xl font-syne font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Phone number */}
        {phoneNumber && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
            <p className="text-sm text-success font-medium">Your AI phone number</p>
            <p className="text-2xl font-syne font-bold text-success mt-1">{phoneNumber}</p>
          </div>
        )}

        <Button onClick={onNavigate} className="w-full gradient-primary border-0 text-white">
          Go to Dashboard <CheckCircle className="w-4 h-4 ml-1" />
        </Button>
        <button onClick={onNavigate} className="text-sm text-muted-foreground hover:text-foreground">
          Explore your dashboard →
        </button>
      </motion.div>
    );
  }

  return null;
}