import { useState, useEffect } from 'react';
import { X, Phone, Mail, Calendar, PhoneCall, Clock, Play, ExternalLink, Plus, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import InlineTagPicker from '@/components/staff/InlineTagPicker';

const STATUS_COLORS = {
  completed: 'text-success bg-success/10',
  confirmed: 'text-success bg-success/10',
  pending: 'text-warning bg-warning/10',
  cancelled: 'text-destructive bg-destructive/10',
  missed: 'text-destructive bg-destructive/10',
  in_progress: 'text-warning bg-warning/10',
  no_show: 'text-muted-foreground bg-secondary',
};

const AVATAR_COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6'];
const colorFor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const TABS = ['Booking History', 'Call History'];

export default function CustomerSlideOver({ customer, allTags, businessId, onClose, onSave, onQuickRebook }) {
  const [tab, setTab]       = useState('Booking History');
  const [notes, setNotes]   = useState(customer.notes || '');
  const [tagIds, setTagIds] = useState(customer.customer_tag_ids || []);
  const [bookings, setBookings] = useState([]);
  const [calls, setCalls]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);

  useEffect(() => {
    const load = async () => {
      const [bData, cData] = await Promise.all([
        base44.entities.Booking.filter({ business_id: customer.business_id || businessId, customer_phone: customer.phone }, '-created_date', 20),
        base44.entities.CallLog.filter({ business_id: customer.business_id || businessId, caller_number: customer.phone }, '-created_date', 20),
      ]);
      setBookings(bData);
      setCalls(cData);
      setLoading(false);
    };
    if (customer.phone) load();
    else setLoading(false);
  }, [customer.id]);

  // Escape key
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') attemptClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [dirty]);

  const attemptClose = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Customer.update(customer.id, {
      notes,
      customer_tag_ids: tagIds,
    });
    toast.success('Customer updated');
    setSaving(false);
    setDirty(false);
    onSave();
  };

  const memberSince = customer.created_date
    ? format(new Date(customer.created_date), 'MMM yyyy')
    : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={attemptClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.25s ease' }}>

        {/* Profile Header */}
        <div className="px-6 py-5 border-b border-border bg-card shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ background: colorFor(customer.name) }}>
                {initials(customer.name)}
              </div>
              <div>
                <h2 className="font-syne font-bold text-lg leading-tight">{customer.name}</h2>
                {customer.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span>📞</span>{customer.phone}
                  </p>
                )}
                {customer.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />{customer.email}
                  </p>
                )}
                {memberSince && (
                  <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
                )}
              </div>
            </div>
            <button onClick={attemptClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center flex-wrap gap-1.5">
            {tagIds.map(tagId => {
              const tag = allTags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span key={tagId} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ background: tag.color || '#8B5CF6' }}>
                  {tag.name}
                  <button onClick={() => { setTagIds(ids => ids.filter(x => x !== tagId)); setDirty(true); }}
                    className="hover:bg-black/20 rounded-full p-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
            <InlineTagPicker
              tags={allTags}
              selectedIds={tagIds}
              onChange={(ids) => { setTagIds(ids); setDirty(true); }}
              entityName="CustomerTag"
              businessId={businessId}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
          <Textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setDirty(true); }}
            placeholder="Add notes about this customer..."
            className="text-sm h-20 resize-none"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : tab === 'Booking History' ? (
            <div className="space-y-2">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No bookings found for this customer.</p>
              ) : bookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.service || 'Service'}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.scheduled_at ? format(new Date(b.scheduled_at), 'EEE d MMM yyyy · h:mm a') : 'Date TBD'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.price > 0 && <span className="text-xs text-muted-foreground">${b.price}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status] || 'bg-secondary text-foreground'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {calls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No calls found for this customer.</p>
              ) : calls.map(call => {
                const dur = call.duration_seconds
                  ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}`
                  : '—';
                return (
                  <div key={call.id} className="p-3 bg-card border border-border rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[call.status] || 'bg-secondary text-foreground'}`}>
                          {call.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{dur}
                        </span>
                        {call.recording_url && (
                          <a href={call.recording_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <Play className="w-3 h-3" /> Play
                          </a>
                        )}
                        {call.transcript && (
                          <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3 h-3" /> Transcript
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {call.started_at ? format(new Date(call.started_at), 'EEE d MMM yyyy · h:mm a') : '—'}
                    </p>
                    {call.summary && (
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{call.summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onQuickRebook?.(customer)} className="gap-1.5">
            <CalendarPlus className="w-3.5 h-3.5" /> Quick Rebook
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={attemptClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !dirty} className="gradient-primary border-0 text-white">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}