import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Phone, Search, Filter, Play, FileText, Clock, ChevronDown, X, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
  completed: 'text-success bg-success/10 border-success/20',
  missed: 'text-destructive bg-destructive/10 border-destructive/20',
  in_progress: 'text-warning bg-warning/10 border-warning/20',
  voicemail: 'text-blue-500 bg-blue-50 border-blue-200',
  failed: 'text-destructive bg-destructive/10 border-destructive/20',
};

const SENTIMENT_ICONS = { positive: '😊', neutral: '😐', negative: '😟' };

function CallDetailModal({ call, onClose }) {
  if (!call) return null;
  const duration = call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—';
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-syne flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Call Detail — {call.caller_name || call.caller_number || 'Unknown'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Status', value: call.status },
              { label: 'Duration', value: duration },
              { label: 'Sentiment', value: call.sentiment ? `${SENTIMENT_ICONS[call.sentiment]} ${call.sentiment}` : '—' },
              { label: 'Direction', value: call.direction || 'inbound' },
              { label: 'Started', value: call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '—' },
              { label: 'Booking Created', value: call.booking_created ? 'Yes ✓' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-medium capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {call.summary && (
            <div className="p-4 rounded-xl border border-border bg-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">AI Summary</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{call.summary}</p>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div className="p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Recording</p>
              </div>
              <audio controls src={call.recording_url} className="w-full" />
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Transcript</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 max-h-60 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{call.transcript}</pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CallLogs() {
  const { business } = useOutletContext() || {};
  const [calls, setCalls] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      const data = await base44.entities.CallLog.filter({ business_id: businesses[0].id }, '-created_date', 100);
      setCalls(data);
      setFiltered(data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let data = calls;
    if (statusFilter !== 'all') data = data.filter(c => c.status === statusFilter);
    if (search) data = data.filter(c =>
      (c.caller_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.caller_number || '').includes(search)
    );
    setFiltered(data);
  }, [search, statusFilter, calls]);

  const duration = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '—';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Call Logs</h1>
        <p className="text-muted-foreground mt-1">All calls handled by your AI agent</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or number..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Caller</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Time</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Duration</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Booking</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Sentiment</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-secondary rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Phone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No calls found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((call, i) => (
                  <motion.tr key={call.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedCall(call)}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{call.caller_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{call.caller_number || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{duration(call.duration_seconds)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[call.status] || 'bg-secondary text-foreground border-border'}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {call.booking_created
                        ? <span className="text-xs text-success font-medium">✓ Created</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {call.sentiment ? `${SENTIMENT_ICONS[call.sentiment]} ${call.sentiment}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="sm" className="text-xs">Details</Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}