import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Phone, Globe, Users, Copy, ExternalLink, Clock, CheckCircle, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COUNTRY_FLAGS = { AU: '🇦🇺', US: '🇺🇸', GB: '🇬🇧', NZ: '🇳🇿', CA: '🇨🇦' };

function formatPhone(raw, country) {
  if (!raw) return raw;
  if (country === 'AU') {
    const digits = raw.replace('+61', '0');
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  if (country === 'US' || country === 'CA') {
    const digits = raw.replace(/^\+1/, '');
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-blue-500' : 'bg-gray-300'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-0.5">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h2 className="font-syne font-semibold text-base">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function CopyInput({ value, prefix }) {
  const copy = () => { navigator.clipboard.writeText(value); toast.success('Copied!'); };
  return (
    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-secondary/30">
      {prefix && <span className="text-sm shrink-0">{prefix}</span>}
      <span className="flex-1 text-sm text-foreground truncate font-mono">{value}</span>
      <button onClick={copy} className="shrink-0 p-1 rounded hover:bg-border transition-colors">
        <Copy className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [agent, setAgent] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const businesses = await base44.entities.Business.filter({ owner_id: me.id });
      if (!businesses.length) { setLoading(false); return; }
      const biz = businesses[0];
      setBusiness(biz);
      const agents = await base44.entities.Agent.filter({ business_id: biz.id });
      setAgent(agents[0] || null);
      setLoading(false);
    };
    load();
  }, []);

  const toggleVoiceAgent = async (on) => {
    if (!agent) return;
    await base44.entities.Agent.update(agent.id, { status: on ? 'active' : 'draft' });
    setAgent(a => ({ ...a, status: on ? 'active' : 'draft' }));
  };

  const toggleBooking = async () => {
    if (!business) return;
    const next = !business.booking_page_enabled;
    await base44.entities.Business.update(business.id, { booking_page_enabled: next });
    setBusiness(b => ({ ...b, booking_page_enabled: next }));
  };

  const toggleNotifications = async () => {
    if (!business) return;
    const next = !business.admin_notifications_enabled;
    await base44.entities.Business.update(business.id, { admin_notifications_enabled: next });
    setBusiness(b => ({ ...b, admin_notifications_enabled: next }));
  };

  const domain = window.location.hostname;
  const bookingUrl = business?.booking_slug ? `https://${domain}/book/${business.booking_slug}` : null;
  const phoneFlag = COUNTRY_FLAGS[business?.country] || '📞';
  const phoneFormatted = business?.twilio_phone_number
    ? `${phoneFlag} ${formatPhone(business.twilio_phone_number, business.country)}`
    : null;

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your business configuration</p>
      </div>

      <div className="space-y-8">

        {/* ── Section 1: Service Control ── */}
        <div>
          <SectionHeader title="Service Control" subtitle="Enable or disable Voice AI and Online Booking services." />
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-semibold text-sm">Service Control</span>
            </div>

            {/* Row 1: Voice AI */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Voice AI Agent</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {agent?.status === 'active' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Always Active</span>
                <Toggle on={agent?.status === 'active'} onChange={toggleVoiceAgent} />
              </div>
            </div>

            {/* Row 2: Online Booking */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Online Booking</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {business?.booking_page_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <Toggle on={!!business?.booking_page_enabled} onChange={toggleBooking} />
            </div>
          </div>
        </div>

        {/* ── Section 2: AI Agent Phone Number ── */}
        <div>
          <SectionHeader icon={Phone} title="AI Agent Phone Number" />
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Your AI Agent Number</p>
              {phoneFormatted ? (
                <CopyInput value={business.twilio_phone_number} prefix={phoneFlag} />
              ) : (
                <p className="text-sm text-muted-foreground">No number assigned. <button onClick={() => navigate('/phone')} className="text-primary underline">Get a number →</button></p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Forward your business number to this number to enable AI Agent call pickup.</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Call Forwarding Setup</span>
              <Button size="sm" onClick={() => navigate('/phone')} style={{ background: '#6C3BFF', color: '#fff', border: 0 }}>
                Setup
              </Button>
            </div>
          </div>
        </div>

        {/* ── Section 3: Online Booking ── */}
        <div>
          <SectionHeader icon={Globe} title="Online Booking" />
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Booking Page URL</p>
              {bookingUrl ? (
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-secondary/30">
                  <span className="flex-1 text-sm truncate font-mono">{bookingUrl}</span>
                  <button onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success('Copied!'); }} className="p-1 rounded hover:bg-border transition-colors">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-border transition-colors">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No booking slug configured. Set one up in Booking Page settings.</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Booking Page Setup</span>
              <Button size="sm" onClick={() => navigate('/booking-page')} style={{ background: '#6C3BFF', color: '#fff', border: 0 }}>
                Setup
              </Button>
            </div>
          </div>
        </div>

        {/* ── Section 4: Admin Members ── */}
        <div>
          <SectionHeader icon={Users} title="Admin Members" />
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Sub-header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <span className="text-sm text-muted-foreground flex-1">Using 1 of 1 admin member</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground capitalize">
                {business?.subscription_plan || 'Trial'}
              </span>
              {(business?.subscription_plan === 'starter' || business?.subscription_plan === 'trial') && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Limit reached</span>
              )}
            </div>

            {/* Table header */}
            <div className="grid grid-cols-3 px-5 py-2.5 bg-secondary/30 border-b border-border text-xs font-semibold text-muted-foreground">
              <span>Member</span>
              <span className="text-center">Change Role</span>
              <span className="text-right">Receive Notifications</span>
            </div>

            {/* User row */}
            {user && (
              <div className="grid grid-cols-3 items-center px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium truncate">{user.full_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground">You</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#EDE9FF', color: '#6C3BFF' }}>Owner</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
                <div className="flex justify-end">
                  <Toggle on={!!business?.admin_notifications_enabled} onChange={toggleNotifications} />
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="px-5 py-3 border-t border-border bg-secondary/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Admin members with email notifications enabled will receive booking confirmations from AI calls, dashboard bookings, and online booking page.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}