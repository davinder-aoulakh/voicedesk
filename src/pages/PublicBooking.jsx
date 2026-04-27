import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, User, Phone, Mail, FileText, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, startOfDay, isBefore, isSameDay } from 'date-fns';

// Generate time slots from business hours for a given day
function generateSlots(businessHours, date, durationMins = 60) {
  const dayName = format(date, 'EEEE').toLowerCase(); // monday, tuesday...
  const dayHours = businessHours?.[dayName];
  if (!dayHours || !dayHours.open) return [];

  const parseTime = (t) => {
    const [h, m] = (t || '09:00').split(':').map(Number);
    return h * 60 + m;
  };

  const openMin  = parseTime(dayHours.start || '09:00');
  const closeMin = parseTime(dayHours.end   || '17:00');
  const slots = [];
  for (let m = openMin; m + durationMins <= closeMin; m += durationMins) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

// ─── Step indicators ──────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Service', 'Date & Time', 'Your Details'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              active ? 'bg-primary text-white' : done ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'
            }`}>
              {done ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect, businessHours }) {
  const [month, setMonth] = useState(startOfDay(new Date()));
  const today = startOfDay(new Date());

  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end   = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const cells = [];

  // Leading blanks
  for (let i = 0; i < start.getDay(); i++) cells.push(null);
  for (let d = 1; d <= end.getDate(); d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  const isDayOpen = (date) => {
    if (!businessHours) return true;
    const dayName = format(date, 'EEEE').toLowerCase();
    return businessHours[dayName]?.open !== false;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-1 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{format(start, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="p-1 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(d => <span key={d} className="text-[10px] text-muted-foreground font-medium pb-1">{d}</span>)}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const past = isBefore(date, today) && !isSameDay(date, today);
          const isSelected = selected && isSameDay(date, selected);
          const open = isDayOpen(date);
          const disabled = past || !open;
          return (
            <button key={i}
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all mx-auto ${
                isSelected ? 'bg-primary text-white' :
                disabled ? 'text-muted-foreground/30 cursor-not-allowed' :
                'hover:bg-primary/10 text-foreground'
              }`}>
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ booking, service, business }) {
  const calUrl = () => {
    const start = new Date(booking.scheduled_at);
    const end   = new Date(start.getTime() + (service?.duration_minutes || 60) * 60000);
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${service?.name || 'Appointment'} at ${business?.name}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `Booking at ${business?.name}`,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  };

  return (
    <div className="flex flex-col items-center text-center py-10 px-6 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-5">
        <Check className="w-10 h-10 text-success" />
      </div>
      <h2 className="text-2xl font-syne font-bold mb-2">You're booked!</h2>
      <p className="text-muted-foreground text-sm mb-6">Your appointment has been confirmed.</p>

      <div className="w-full bg-secondary/40 rounded-xl p-4 text-left space-y-3 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{service?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{format(new Date(booking.scheduled_at), 'EEEE, d MMMM yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium">{format(new Date(booking.scheduled_at), 'h:mm a')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{booking.customer_name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg px-4 py-3 mb-6 text-center">
        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
        You'll receive a confirmation SMS shortly.
      </div>

      <a href={calUrl()} target="_blank" rel="noreferrer" className="w-full">
        <Button variant="outline" className="w-full gap-2">
          <Calendar className="w-4 h-4" /> Add to Google Calendar
        </Button>
      </a>
    </div>
  );
}

// ─── Main public booking page ─────────────────────────────────────────────────
export default function PublicBooking() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking state
  const [step, setStep]               = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff]     = useState(null);
  const [selectedDate, setSelectedDate]       = useState(null);
  const [selectedTime, setSelectedTime]       = useState(null);
  const [slots, setSlots]                     = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting]           = useState(false);
  const [booking, setBooking]                 = useState(null); // created booking

  useEffect(() => {
    const load = async () => {
      // Find business by booking_slug or by slugified name
      let businesses = await base44.entities.Business.filter({ booking_slug: slug });
      if (!businesses.length) {
        // fallback: get all and match
        const all = await base44.entities.Business.list();
        businesses = all.filter(b => {
          const s = b.booking_slug || (b.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return s === slug;
        });
      }
      if (!businesses.length) { setNotFound(true); setLoading(false); return; }
      const biz = businesses[0];
      if (biz.booking_page_enabled === false) { setNotFound(true); setLoading(false); return; }
      setBusiness(biz);

      const [svcData, staffData] = await Promise.all([
        base44.entities.Service.filter({ business_id: biz.id }),
        base44.entities.Staff.filter({ business_id: biz.id }),
      ]);
      setServices(svcData.filter(s => s.is_active !== false));
      setStaff(staffData.filter(s => s.is_active !== false));
      setLoading(false);
    };
    load();
  }, [slug]);

  // Compute slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !business) { setSlots([]); return; }
    const dur = selectedService?.duration_minutes || 60;
    setSlots(generateSlots(business.business_hours, selectedDate, dur));
    setSelectedTime(null);
  }, [selectedDate, selectedService, business]);

  const handleConfirm = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    const dt = new Date(selectedDate);
    const [h, m] = selectedTime.split(':').map(Number);
    dt.setHours(h, m, 0, 0);

    const newBooking = await base44.entities.Booking.create({
      business_id:      business.id,
      customer_name:    form.name,
      customer_phone:   form.phone,
      customer_email:   form.email || undefined,
      notes:            form.notes || undefined,
      service:          selectedService?.name,
      service_id:       selectedService?.id,
      staff_id:         selectedStaff?.id,
      scheduled_at:     dt.toISOString(),
      service_duration_minutes: selectedService?.duration_minutes,
      price:            selectedService?.price,
      status:           'pending',
      source:           'online',
    });

    // Mark setup step
    await base44.entities.Business.update(business.id, {
      setup_steps: { ...(business.setup_steps || {}), booking_page: true },
    });

    setBooking(newBooking);
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-syne font-bold mb-2">Booking page not found</h2>
      <p className="text-muted-foreground text-sm">This booking link is inactive or doesn't exist.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Business header */}
        <div className="text-center mb-8">
          {business.logo_url
            ? <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow" />
            : <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 text-white font-syne font-bold text-2xl shadow">
                {(business.name || 'B')[0]}
              </div>
          }
          <h1 className="text-2xl font-syne font-bold">{business.name}</h1>
          {business.description && <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">{business.description}</p>}
        </div>

        {/* Success screen */}
        {booking ? (
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <SuccessScreen booking={booking} service={selectedService} business={business} />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <Steps current={step} />

              {/* Step 0: Select service */}
              {step === 0 && (
                <div className="space-y-3">
                  <h3 className="font-syne font-semibold mb-4">Choose a Service</h3>
                  {services.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-8">No services available yet.</p>
                  )}
                  {services.map(svc => (
                    <button key={svc.id}
                      onClick={() => { setSelectedService(svc); setStep(1); }}
                      className={`w-full flex items-start justify-between p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                        selectedService?.id === svc.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                      <div>
                        <p className="font-semibold text-sm">{svc.name}</p>
                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{svc.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes || 60}min</span>
                        </div>
                      </div>
                      {svc.price > 0 && (
                        <span className="font-syne font-bold text-primary shrink-0 ml-3">${svc.price}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 1: Date & Time (+ optional staff) */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setStep(0)} className="text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-syne font-semibold">Pick Date & Time</h3>
                  </div>

                  {/* Staff selector */}
                  {staff.length > 1 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Staff member (optional)</Label>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedStaff(null)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                            !selectedStaff ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                          }`}>
                          Any Staff
                        </button>
                        {staff.map(s => (
                          <button key={s.id}
                            onClick={() => setSelectedStaff(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                              selectedStaff?.id === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                            }`}>
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar */}
                  <MiniCalendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    businessHours={business.business_hours}
                  />

                  {/* Time slots */}
                  {selectedDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Available times — {format(selectedDate, 'EEEE, d MMM')}
                      </Label>
                      {slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 bg-secondary/30 rounded-xl">
                          No available slots for this day
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map(time => (
                            <button key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                selectedTime === time
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                              }`}>
                              {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full gradient-primary border-0 text-white">
                    Continue →
                  </Button>
                </div>
              )}

              {/* Step 2: Customer details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-syne font-semibold">Your Details</h3>
                  </div>

                  {/* Summary */}
                  <div className="bg-secondary/40 rounded-xl p-3 text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{selectedDate && format(selectedDate, 'EEE, d MMM yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{selectedTime && format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Full Name <span className="text-destructive">*</span></Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-destructive">*</span></Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+61 4xx xxx xxx" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything we should know?" className="mt-1.5 h-20 resize-none" />
                  </div>

                  <Button
                    onClick={handleConfirm}
                    disabled={!form.name || !form.phone || submitting}
                    className="w-full gradient-primary border-0 text-white gap-2">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : <><Check className="w-4 h-4" /> Confirm Booking</>}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-5">Powered by VoiceDesk</p>
      </div>
    </div>
  );
}