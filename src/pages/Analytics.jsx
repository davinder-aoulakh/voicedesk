import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Phone, Calendar, Clock, Target, Mic } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';

const COLORS = ['hsl(252,85%,60%)', 'hsl(142,72%,45%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)'];

function KpiCard({ label, value, sub, icon: Icon, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-3xl font-syne font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function Analytics() {
  const { business } = useOutletContext() || {};
  const [calls, setCalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      const [callData, bookingData] = await Promise.all([
        base44.entities.CallLog.filter({ business_id: businesses[0].id }),
        base44.entities.Booking.filter({ business_id: businesses[0].id }),
      ]);
      setCalls(callData);
      setBookings(bookingData);
      setLoading(false);
    };
    load();
  }, []);

  // Daily call volume (last 14 days)
  const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const dailyData = last14.map(day => {
    const dayStr = format(day, 'MMM d');
    const dayCalls = calls.filter(c => c.started_at && format(new Date(c.started_at), 'MMM d') === dayStr);
    return {
      day: dayStr,
      calls: dayCalls.length,
      bookings: dayCalls.filter(c => c.booking_created).length,
    };
  });

  // Status breakdown
  const statusCounts = ['completed', 'missed', 'in_progress', 'voicemail'].map(s => ({
    name: s.replace('_', ' '),
    value: calls.filter(c => c.status === s).length,
  })).filter(s => s.value > 0);

  // Sentiment
  const sentimentCounts = ['positive', 'neutral', 'negative'].map(s => ({
    name: s,
    value: calls.filter(c => c.sentiment === s).length,
  }));

  // KPIs
  const totalCalls = calls.length;
  const totalBookings = bookings.length;
  const conversionRate = totalCalls > 0 ? Math.round((calls.filter(c => c.booking_created).length / totalCalls) * 100) : 0;
  const avgDuration = calls.filter(c => c.duration_seconds).length > 0
    ? Math.round(calls.filter(c => c.duration_seconds).reduce((a, c) => a + c.duration_seconds, 0) / calls.filter(c => c.duration_seconds).length)
    : 0;

  // Voice minutes this month
  const PLAN_LIMITS = { trial: 15, starter: 100, advance: 300, growth: 300, pro: 800, expert: 2000, enterprise: 2000 };
  const plan = business?.subscription_plan || 'trial';
  const voiceLimit = PLAN_LIMITS[plan] ?? 15;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const voiceMinutesUsed = Math.round(
    calls
      .filter(c => c.started_at && new Date(c.started_at) >= monthStart && c.duration_seconds)
      .reduce((sum, c) => sum + c.duration_seconds, 0) / 60
  );
  const voicePct = voiceLimit > 0 ? Math.min(100, Math.round((voiceMinutesUsed / voiceLimit) * 100)) : 0;
  const voiceBarColor = voicePct >= 100 ? '#EF4444' : voicePct >= 80 ? '#F59E0B' : '#10B981';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance metrics for your AI agent</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Total Calls" value={totalCalls} icon={Phone} delay={0} sub="All time" />
        <KpiCard label="Bookings Made" value={totalBookings} icon={Calendar} delay={0.05} sub="Via AI agent" />
        <KpiCard label="Conversion Rate" value={`${conversionRate}%`} icon={Target} delay={0.1} sub="Calls → bookings" />
        <KpiCard label="Avg Call Duration" value={avgDuration ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : '—'} icon={Clock} delay={0.15} sub="Per call" />
      </div>

      {/* Voice Minutes KPI + progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Voice Minutes Used"
          value={`${voiceMinutesUsed} min`}
          icon={Mic}
          delay={0.2}
          sub={`/ ${voiceLimit} min on ${planLabel} plan`}
        />
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Voice Minutes This Month</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: voicePct >= 80 ? '#FEF3C7' : '#ECFDF5', color: voiceBarColor }}>
              {voicePct}% used
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${voicePct}%`, background: voiceBarColor }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{voiceMinutesUsed} min used</span>
            <span>{Math.max(0, voiceLimit - voiceMinutesUsed)} min remaining</span>
          </div>
          {voicePct >= 80 && (
            <p className="text-xs mt-2 font-medium" style={{ color: voiceBarColor }}>
              {voicePct >= 100 ? '⚠️ Limit reached — upgrade to continue using AI calls.' : '⚠️ Approaching your monthly voice limit.'}
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Call volume chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-syne font-semibold mb-5">Call Volume — Last 14 Days</h3>
          {loading ? (
            <div className="h-52 bg-secondary/50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dailyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Calls" />
                <Bar dataKey="bookings" fill="hsl(var(--success))" radius={[4,4,0,0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-primary" /> Calls
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-success" /> Bookings
            </div>
          </div>
        </div>

        {/* Status pie */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-syne font-semibold mb-5">Call Outcomes</h3>
          {loading || statusCounts.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusCounts.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground capitalize">{s.name}</span>
                    </div>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sentiment */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-syne font-semibold mb-5">Caller Sentiment</h3>
        <div className="grid grid-cols-3 gap-4">
          {sentimentCounts.map((s, i) => (
            <div key={s.name} className="text-center p-4 rounded-xl bg-secondary/40">
              <p className="text-2xl mb-1">{['😊', '😐', '😟'][i]}</p>
              <p className="text-2xl font-syne font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{s.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}