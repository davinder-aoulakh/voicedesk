import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Search, Check, X, Clock, User, List, LayoutGrid, Zap, XCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CalendarView from '@/components/bookings/CalendarView';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-warning bg-warning/10 border-warning/20' },
  confirmed: { label: 'Confirmed', color: 'text-success bg-success/10 border-success/20' },
  cancelled: { label: 'Cancelled', color: 'text-destructive bg-destructive/10 border-destructive/20' },
  completed: { label: 'Completed', color: 'text-primary bg-accent border-primary/20' },
  no_show:   { label: 'No Show',   color: 'text-muted-foreground bg-secondary border-border' },
};

function BookingModal({ booking, businessId, onClose, onSave }) {
  const isNew = !booking;
  const [form, setForm] = useState(booking || {
    customer_name: '', customer_phone: '', customer_email: '', service: '',
    service_id: '', staff_id: '', scheduled_at: '', status: 'pending', notes: '', source: 'manual', business_id: businessId,
  });
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([
      base44.entities.Service.filter({ business_id: businessId, is_active: true }),
      base44.entities.Staff.filter({ business_id: businessId, is_active: true }),
    ]).then(([svcs, stf]) => { setServices(svcs); setStaff(stf); });
  }, [businessId]);

  const handleServiceChange = (serviceId) => {
    const svc = services.find(s => s.id === serviceId);
    setForm(f => ({ ...f, service_id: serviceId, service: svc?.name || '' }));
  };

  const handleSave = async () => {
    if (!form.customer_name) return toast.error('Customer name is required');
    let savedBooking;
    if (isNew) {
      savedBooking = await base44.entities.Booking.create(form);
    } else {
      await base44.entities.Booking.update(booking.id, form);
      savedBooking = { id: booking.id, ...form };
    }
    // Send confirmation SMS if status is confirmed and there's a phone
    const isConfirmed = (form.status === 'confirmed') || isNew;
    if (isConfirmed && form.customer_phone && savedBooking?.id) {
      base44.functions.invoke('sendBookingConfirmation', { booking_id: savedBooking.id }).catch(() => {});
    }
    toast.success(isNew ? 'Booking created' : 'Booking updated');
    onSave();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'New Booking' : 'Edit Booking'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Customer Name *</Label>
              <Input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} className="mt-1.5" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.customer_phone || ''} onChange={e => setForm(f => ({...f, customer_phone: e.target.value}))} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.customer_email || ''} onChange={e => setForm(f => ({...f, customer_email: e.target.value}))} className="mt-1.5" />
            </div>
            <div>
              <Label>Service</Label>
              <Select value={form.service_id || ''} onValueChange={handleServiceChange}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Staff</Label>
              <Select value={form.staff_id || ''} onValueChange={v => setForm(f => ({...f, staff_id: v}))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Scheduled Date & Time</Label>
              <Input type="datetime-local" value={form.scheduled_at ? form.scheduled_at.slice(0,16) : ''} onChange={e => setForm(f => ({...f, scheduled_at: e.target.value}))} className="mt-1.5" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="mt-1.5" placeholder="Any additional notes..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="gradient-primary border-0 text-white">{isNew ? 'Create Booking' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalBooking, setModalBooking] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState('any');
  const [upcomingFilter, setUpcomingFilter] = useState('upcoming');
  const [showCancelled, setShowCancelled] = useState(false);

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    setBusinessId(businesses[0].id);
    const data = await base44.entities.Booking.filter({ business_id: businesses[0].id }, '-scheduled_at', 200);
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const now = new Date();
    let data = bookings;

    // Upcoming / Past
    if (upcomingFilter === 'upcoming') data = data.filter(b => !b.scheduled_at || new Date(b.scheduled_at) >= now);
    else if (upcomingFilter === 'past') data = data.filter(b => b.scheduled_at && new Date(b.scheduled_at) < now);

    // Status
    if (statusFilter !== 'all') data = data.filter(b => b.status === statusFilter);

    // Show cancelled toggle
    if (!showCancelled && statusFilter === 'all') data = data.filter(b => b.status !== 'cancelled');

    // Time of day
    if (timeFilter !== 'any') {
      data = data.filter(b => {
        if (!b.scheduled_at) return false;
        const h = new Date(b.scheduled_at).getHours();
        if (timeFilter === 'morning')   return h >= 6  && h < 12;
        if (timeFilter === 'afternoon') return h >= 12 && h < 17;
        if (timeFilter === 'evening')   return h >= 17 && h < 21;
        return true;
      });
    }

    // Search
    if (search) data = data.filter(b =>
      (b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.customer_phone || '').includes(search)
    );

    setFiltered(data);
  }, [search, statusFilter, bookings, upcomingFilter, timeFilter, showCancelled]);

  const updateStatus = async (id, status) => {
    await base44.entities.Booking.update(id, { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    // Send confirmation SMS when manually confirming
    if (status === 'confirmed') {
      base44.functions.invoke('sendBookingConfirmation', { booking_id: id }).catch(() => {});
    }
    toast.success('Booking updated');
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Booking</h1>
          <p className="text-muted-foreground mt-1">Manage your bookings</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
            {[
              { key: 'list',  icon: List,     label: 'List'  },
              { key: 'day',   icon: Calendar, label: 'Day'   },
              { key: 'week',  icon: Calendar, label: 'Week'  },
              { key: 'month', icon: Calendar, label: 'Month' },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setViewMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  viewMode === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/services')} variant="outline" className="border-primary/30 bg-accent text-primary gap-1.5 rounded-full">
            <Zap className="w-4 h-4" /> Service Business
          </Button>
          <Button onClick={() => setShowNewModal(true)} className="gradient-primary border-0 text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Total Bookings */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <LayoutGrid className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-syne font-bold">{bookings.length}</p>
            <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-3xl font-syne font-bold text-destructive">{bookings.filter(b => b.status === 'cancelled').length}</p>
            <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-medium mb-2">Time Distribution</p>
          {(() => {
            const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7am–11pm
            const max = Math.max(1, ...hours.map(h => bookings.filter(b => b.scheduled_at && new Date(b.scheduled_at).getHours() === h).length));
            return (
              <div>
                <div className="flex items-end gap-0.5 h-8">
                  {hours.map(h => {
                    const count = bookings.filter(b => b.scheduled_at && new Date(b.scheduled_at).getHours() === h).length;
                    const heightPct = count / max;
                    return (
                      <div key={h} className="flex-1 flex items-end">
                        <div className="w-full rounded-sm bg-primary/60" style={{ height: `${Math.max(2, Math.round(heightPct * 24))}px` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>7am</span><span>12pm</span><span>5pm</span><span>11pm</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Date Navigator */}
      {(() => {
        const prev = () => setSelectedDate(d =>
          viewMode === 'week' ? subWeeks(d, 1) : viewMode === 'month' ? subMonths(d, 1) : subDays(d, 1)
        );
        const next = () => setSelectedDate(d =>
          viewMode === 'week' ? addWeeks(d, 1) : viewMode === 'month' ? addMonths(d, 1) : addDays(d, 1)
        );
        const label =
          viewMode === 'month' ? format(selectedDate, 'MMMM yyyy') :
          viewMode === 'week'  ? `Week of ${format(selectedDate, 'MMMM d, yyyy')}` :
          format(selectedDate, 'EEEE, MMMM d, yyyy');
        return (
          <div className="flex items-center gap-3 mb-4">
            <button onClick={prev} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm flex-1 text-center md:text-left">{label}</span>
            <button onClick={() => setSelectedDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
              Today
            </button>
            <button className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button onClick={next} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* Calendar view */}
      {viewMode !== 'list' ? (
        loading ? (
          <div className="h-96 bg-card border border-border rounded-2xl animate-pulse" />
        ) : (
          <CalendarView bookings={bookings} onSelectBooking={setModalBooking} />
        )
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-2 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." className="pl-9" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={upcomingFilter} onValueChange={setUpcomingFilter}>
                <SelectTrigger className="w-auto h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-auto h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Time</SelectItem>
                  <SelectItem value="morning">Morning (6am–12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm–9pm)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5 ml-auto">
                <Switch checked={showCancelled} onCheckedChange={setShowCancelled} />
                <span className="text-xs text-muted-foreground">Show Cancelled</span>
              </div>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="grid gap-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.filter(b => !b.scheduled_at || isSameDay(new Date(b.scheduled_at), selectedDate)).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.filter(b => !b.scheduled_at || isSameDay(new Date(b.scheduled_at), selectedDate)).map((booking, i) => {
                const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                return (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setModalBooking(booking)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{booking.customer_name}</p>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConf.color}`}>{statusConf.label}</span>
                          {booking.source === 'ai_agent' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground border border-primary/20">🤖 AI</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          {booking.service && <span>{booking.service}</span>}
                          {booking.customer_phone && <span>{booking.customer_phone}</span>}
                          {booking.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(booking.scheduled_at), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {booking.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 text-success border-success/30 hover:bg-success/10"
                              onClick={() => updateStatus(booking.id, 'confirmed')}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => updateStatus(booking.id, 'cancelled')}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showNewModal && <BookingModal businessId={businessId} onClose={() => setShowNewModal(false)} onSave={() => { setShowNewModal(false); load(); }} />}
      {modalBooking && <BookingModal booking={modalBooking} businessId={businessId} onClose={() => setModalBooking(null)} onSave={() => { setModalBooking(null); load(); }} />}
    </div>
  );
}