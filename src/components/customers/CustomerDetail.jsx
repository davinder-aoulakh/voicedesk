import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Phone, Mail, Calendar, MessageSquare, Pencil, Trash2, X, Clock, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const STATUS_COLORS = {
  completed: 'text-success bg-success/10',
  confirmed: 'text-success bg-success/10',
  pending: 'text-warning bg-warning/10',
  cancelled: 'text-destructive bg-destructive/10',
  missed: 'text-destructive bg-destructive/10',
  in_progress: 'text-warning bg-warning/10',
  no_show: 'text-muted-foreground bg-secondary',
};

const SENTIMENT_ICON = { positive: '😊', neutral: '😐', negative: '😟' };

export default function CustomerDetail({ customer, colorFor, initials, onEdit, onDelete, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      const [bookingData, callData] = await Promise.all([
        base44.entities.Booking.filter({ business_id: customer.business_id, customer_phone: customer.phone }, '-created_date', 20),
        base44.entities.CallLog.filter({ business_id: customer.business_id, caller_number: customer.phone }, '-created_date', 20),
      ]);
      setBookings(bookingData);
      setCalls(callData);
      setLoadingHistory(false);
    };
    if (customer.phone) {
      load();
    } else {
      setLoadingHistory(false);
    }
  }, [customer.id]);

  const totalSpent = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: colorFor(customer.name) }}>
            {initials(customer.name)}
          </div>
          <div>
            <h2 className="text-xl font-syne font-bold">{customer.name}</h2>
            <div className="flex flex-col gap-1 mt-1">
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />{customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />{customer.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Bookings', value: bookings.length, icon: Calendar, color: 'text-primary' },
            { label: 'Calls', value: calls.length, icon: Phone, color: 'text-success' },
            { label: 'Total Spent', value: `$${totalSpent}`, icon: DollarSign, color: 'text-warning' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color}`} />
              <p className="text-lg font-syne font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {customer.tags?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Tag className="w-4 h-4 text-primary" /> Tags</h3>
            <div className="flex flex-wrap gap-2">
              {customer.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {customer.notes && (
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-primary" /> Notes</h3>
            <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-4 leading-relaxed">{customer.notes}</p>
          </div>
        )}

        {loadingHistory ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Booking History */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" /> Booking History
                {bookings.length > 0 && <span className="ml-auto text-xs text-muted-foreground font-normal">{bookings.length} records</span>}
              </h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-secondary/30 rounded-xl">No bookings found</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.service || 'Service'}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.scheduled_at ? format(new Date(b.scheduled_at), 'MMM d, yyyy · h:mm a') : 'Date TBD'}
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
              )}
            </div>

            {/* Call History */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-primary" /> Call History
                {calls.length > 0 && <span className="ml-auto text-xs text-muted-foreground font-normal">{calls.length} calls</span>}
              </h3>
              {calls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-secondary/30 rounded-xl">No calls found</p>
              ) : (
                <div className="space-y-2">
                  {calls.map(call => {
                    const dur = call.duration_seconds
                      ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}`
                      : '—';
                    return (
                      <div key={call.id} className="p-3 bg-card border border-border rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[call.status] || 'bg-secondary text-foreground'}`}>
                              {call.status}
                            </span>
                            {call.sentiment && <span className="text-xs">{SENTIMENT_ICON[call.sentiment]}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />{dur}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {call.started_at ? format(new Date(call.started_at), 'MMM d, yyyy · h:mm a') : '—'}
                        </p>
                        {call.summary && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{call.summary}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}