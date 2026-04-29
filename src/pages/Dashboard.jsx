import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Phone, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SetupGuide from '@/components/dashboard/SetupGuide';

function StatCard({ label, value, sub, desc, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <p className="text-3xl font-syne font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      {desc && <p className="text-xs text-muted-foreground mt-3">{desc}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { business } = useOutletContext() || {};
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ calls: 0, bookings: 0, customers: 0, avgDuration: 0, agentStatus: 'draft' });
  const [allBookings, setAllBookings] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAgent, setHasAgent] = useState(false);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setUser(user);
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) { navigate('/onboarding'); return; }
      const biz = businesses[0];

      const [agents, calls, bookings, customers] = await Promise.all([
        base44.entities.Agent.filter({ business_id: biz.id }),
        base44.entities.CallLog.filter({ business_id: biz.id }),
        base44.entities.Booking.filter({ business_id: biz.id }),
        base44.entities.Customer.filter({ business_id: biz.id }),
      ]);

      setHasAgent(agents.length > 0);
      const callsWithDuration = calls.filter(c => c.duration_seconds);
      const avgDuration = callsWithDuration.length > 0
        ? Math.round(callsWithDuration.reduce((sum, c) => sum + c.duration_seconds, 0) / callsWithDuration.length)
        : 0;
      setStats({
        calls: calls.length,
        bookings: bookings.length,
        customers: customers.length,
        avgDuration,
        agentStatus: agents[0]?.status || 'draft',
      });
      setAllBookings(bookings);
      setRecentCalls(calls.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  const statusColors = {
    completed: 'text-success bg-success/10',
    missed: 'text-destructive bg-destructive/10',
    in_progress: 'text-warning bg-warning/10',
    voicemail: 'text-blue-500 bg-blue-50',
  };

  const PERIODS = [
    { label: 'Last 7 days', value: '7d', days: 6 },
    { label: 'Last 30 days', value: '30d', days: 29 },
    { label: 'Last 3 months', value: '90d', days: 89 },
  ];

  const periodConfig = PERIODS.find(p => p.value === period);
  const periodStart = startOfDay(subDays(new Date(), periodConfig.days));

  const filteredBookings = useMemo(() =>
    allBookings.filter(b => b.created_date && new Date(b.created_date) >= periodStart),
    [allBookings, period]
  );

  const aiCount = filteredBookings.filter(b => b.source === 'ai_agent' || b.source === 'phone').length;
  const webCount = filteredBookings.filter(b => b.source === 'online' || b.source === 'web').length;

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: periodStart, end: new Date() });
    return days.map(day => {
      const dayLabel = format(day, period === '7d' ? 'EEE' : 'MMM d');
      const dayBookings = filteredBookings.filter(b =>
        b.created_date && format(new Date(b.created_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      return {
        day: dayLabel,
        ai: dayBookings.filter(b => b.source === 'ai_agent' || b.source === 'phone').length,
        web: dayBookings.filter(b => b.source === 'online' || b.source === 'web').length,
      };
    });
  }, [filteredBookings, period]);

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">
          {(() => {
            const firstName = user?.full_name?.split(' ')[0] || user?.first_name || user?.name?.split(' ')[0] || '';
            return firstName ? `Welcome back, ${firstName}` : business ? `Welcome back, ${business.name}` : 'Welcome back';
          })()}
        </h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your business performance.</p>
      </div>

      {/* Setup Guide */}
      {business && <SetupGuide business={business} />}

      {/* Onboarding nudge */}
      {!hasAgent && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 p-4 rounded-xl border border-primary/30 bg-accent flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-sm">Complete your setup</p>
              <p className="text-xs text-muted-foreground">Finish onboarding to activate your AI agent.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/onboarding')} size="sm" className="gradient-primary border-0 text-white shrink-0">
            Complete Setup <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Bookings" value={stats.bookings} sub="No change this period" desc="Total bookings in the last 30 days" delay={0} />
        <StatCard label="Customers" value={stats.customers} sub="No change this period" desc="Total customers across all locations" delay={0.05} />
        <StatCard label="Calls" value={stats.calls} sub="No change this period" desc="Total AI calls in the last 30 days" delay={0.1} />
        <StatCard label="Duration" value={stats.avgDuration > 0 ? `${stats.avgDuration}s` : '0s'} sub="No change this period" desc="Average duration across all calls" delay={0.15} />
      </div>

      {/* Bookings Overview */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="font-syne font-semibold text-lg">Bookings Overview</h3>
          <div className="flex items-center gap-2">
            <select className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground focus:outline-none">
              <option>All Locations</option>
            </select>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-line */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-muted-foreground">All Locations · {periodConfig.label}</p>
          <p className="text-xs text-muted-foreground">
            AI: <span className="font-semibold text-foreground">{aiCount}</span>
            {' · '}
            Web: <span className="font-semibold text-foreground">{webCount}</span>
          </p>
        </div>

        {/* Chart */}
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No bookings in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="ai" name="AI" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="web" name="Web" fill="hsl(var(--muted))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" /> AI
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-muted" /> Web
          </div>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-semibold text-lg">Recent Calls</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/calls')} className="text-xs text-muted-foreground hover:text-foreground">
            View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
        {recentCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Phone className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No calls yet</p>
            <p className="text-xs text-muted-foreground mt-1">Activate your agent to start receiving calls</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCalls.map(call => (
              <div key={call.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[call.status] || 'bg-secondary text-foreground'}`}>
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{call.caller_name || call.caller_number || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '—'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[call.status] || 'bg-secondary text-foreground'}`}>
                  {call.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}