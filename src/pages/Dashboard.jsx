import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Phone, Calendar, TrendingUp, Clock, Bot, ArrowUpRight, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import SetupGuide from '@/components/dashboard/SetupGuide';

function StatCard({ label, value, sub, icon: Icon, trend, color = 'primary', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          color === 'success' ? 'bg-success/10' : color === 'warning' ? 'bg-warning/10' : 'bg-accent'
        }`}>
          <Icon className={`w-5 h-5 ${
            color === 'success' ? 'text-success' : color === 'warning' ? 'text-warning' : 'text-primary'
          }`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-syne font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { business } = useOutletContext() || {};
  const navigate = useNavigate();
  const [stats, setStats] = useState({ calls: 0, bookings: 0, missed: 0, agentStatus: 'draft' });
  const [recentCalls, setRecentCalls] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAgent, setHasAgent] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) { navigate('/onboarding'); return; }
      const biz = businesses[0];

      const [agents, calls, bookings] = await Promise.all([
        base44.entities.Agent.filter({ business_id: biz.id }),
        base44.entities.CallLog.filter({ business_id: biz.id }),
        base44.entities.Booking.filter({ business_id: biz.id }),
      ]);

      setHasAgent(agents.length > 0);
      const missed = calls.filter(c => c.status === 'missed').length;
      setStats({
        calls: calls.length,
        bookings: bookings.length,
        missed,
        agentStatus: agents[0]?.status || 'draft',
      });
      setRecentCalls(calls.slice(0, 5));
      setUpcomingBookings(bookings.filter(b => b.status !== 'cancelled').slice(0, 5));
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">
          {business ? `Welcome back${business.name ? `, ${business.name}` : ''}` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your AI agent today.</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Calls" value={stats.calls} icon={Phone} trend="+12%" delay={0} sub="Last 30 days" />
        <StatCard label="Bookings Made" value={stats.bookings} icon={Calendar} color="success" trend="+8%" delay={0.05} sub="Via AI agent" />
        <StatCard label="Missed Calls" value={stats.missed} icon={AlertCircle} color="warning" delay={0.1} sub="Follow up needed" />
        <StatCard label="Agent Status" value={stats.agentStatus === 'active' ? 'Live' : 'Offline'} icon={Bot}
          color={stats.agentStatus === 'active' ? 'success' : 'primary'} delay={0.15} sub={stats.agentStatus === 'active' ? 'Taking calls now' : 'Not yet activated'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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

        {/* Upcoming Bookings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-syne font-semibold text-lg">Upcoming Bookings</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="text-xs text-muted-foreground hover:text-foreground">
              View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No bookings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Bookings from calls will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{booking.service || 'Service'} · {booking.scheduled_at ? format(new Date(booking.scheduled_at), 'MMM d, h:mm a') : 'TBD'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'text-success bg-success/10' :
                    booking.status === 'pending' ? 'text-warning bg-warning/10' : 'bg-secondary text-foreground'
                  }`}>{booking.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}