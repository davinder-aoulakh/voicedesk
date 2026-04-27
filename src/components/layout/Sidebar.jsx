import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, Bot, Settings, Zap, LogOut,
  ChevronDown, Users, Clock, Tag, BookOpen, Wrench,
  MapPin, CreditCard, Building2, Smile, Mic, Contact,
  Phone, Sun, Moon, Sparkles, MoreHorizontal, User,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// ─── Nav Structure ────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Bookings',  icon: Calendar,        path: '/bookings' },

  { type: 'group', label: 'Business Operations' },
  { label: 'Availability', icon: Clock,    path: '/availability' },
  { label: 'Staff',        icon: Users,    path: '/staff' },
  { label: 'Services',     icon: Tag,      path: '/services' },
  { label: 'Customers',    icon: Contact,  path: '/customers' },

  { type: 'group', label: 'AI Frontdesk' },
  {
    type: 'accordion',
    label: 'AI Agent',
    icon: Bot,
    children: [
      { label: 'Greetings',         icon: Smile, path: '/agent/greetings' },
      { label: 'Personality',       icon: Bot,   path: '/agent/personality' },
      { label: 'Voice & Languages', icon: Mic,   path: '/agent/voice' },
    ],
  },
  { label: 'Knowledges', icon: BookOpen, path: '/knowledge' },
  { label: 'AI Tools',   icon: Wrench,   path: '/agent/tools' },

  { type: 'group', label: 'Configure' },
  { label: 'Phone Number', icon: Phone, path: '/phone' },
  { label: 'Settings', icon: Settings, path: '/settings' },

  { type: 'group', label: 'Organization Settings' },
  { label: 'Business Info', icon: Building2,  path: '/settings/business-info' },
  { label: 'Locations',     icon: MapPin,     path: '/settings/locations' },
  { label: 'Billing',       icon: CreditCard, path: '/settings/billing' },
];

// ─── Country flag helper ──────────────────────────────────────────────────────
const COUNTRY_FLAGS = { AU: '🇦🇺', US: '🇺🇸', GB: '🇬🇧', NZ: '🇳🇿', CA: '🇨🇦' };

// ─── Initials + colour ────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6C3BFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
function getAvatarColor(name = '') {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupLabel({ label }) {
  return (
    <div className="pt-4 pb-1 px-3">
      <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function NavLink({ label, icon: Icon, path, indent = false }) {
  const location = useLocation();
  const active = path === '/'
    ? location.pathname === '/'
    : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Link
      to={path}
      className={cn(
        'flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        indent ? 'pl-[24px] pr-3 text-[13px]' : 'px-3',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" />}
      <span className="flex-1">{label}</span>
    </Link>
  );
}

function AccordionNavItem({ item, open, onToggle }) {
  const location = useLocation();
  const anyChildActive = item.children.some(c =>
    location.pathname === c.path || location.pathname.startsWith(c.path + '/')
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium transition-all duration-150',
          anyChildActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        {item.icon && <item.icon className="w-4 h-4 shrink-0 opacity-80" />}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className="w-3.5 h-3.5 opacity-60 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? `${item.children.length * 44}px` : '0px',
          transition: 'max-height 200ms ease',
        }}
      >
        <div className="mt-0.5 space-y-0.5">
          {item.children.map(child => (
            <NavLink key={child.path} {...child} indent />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Voice Minutes Widget ─────────────────────────────────────────────────────
function VoiceMinutesWidget() {
  const used  = 0;
  const limit = 15;
  const pct   = limit > 0 ? Math.round((used / limit) * 100) : 0;

  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1, 1);
  const resetStr = resetDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const bg = pct >= 100 ? '#FEF2F2' : pct >= 80 ? '#FEF3C7' : '#ECFDF5';
  const barColor = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';

  return (
    <div className="mx-3 mt-2 rounded-[8px] p-3" style={{ background: bg }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3.5 h-3.5" style={{ color: barColor }} />
        <span className="text-xs font-semibold text-gray-700">Voice Minutes</span>
      </div>
      <p className="text-sm font-bold text-gray-800 mb-1.5">{used} / {limit} min</p>
      <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-2">
        <span>{pct}% used</span>
        <span>{Math.max(0, limit - used)} left</span>
      </div>
      <Link
        to="/settings/billing"
        className="flex items-center justify-center gap-1 w-full py-1 rounded-md text-[11px] font-semibold text-white"
        style={{ background: barColor }}
      >
        <Sparkles className="w-3 h-3" /> Activate Now
      </Link>
      <p className="text-[10px] text-gray-400 mt-1.5 text-center">Resets {resetStr}</p>
    </div>
  );
}

// ─── AI Number Widget ─────────────────────────────────────────────────────────
function AINumberWidget({ business }) {
  const phone   = business?.twilio_phone_number;
  const flag    = COUNTRY_FLAGS[business?.country] || '📞';

  return (
    <div className="mx-3 mt-2 rounded-[8px] p-3" style={{ background: '#EDE9FF' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Phone className="w-3.5 h-3.5" style={{ color: '#6C3BFF' }} />
        <span className="text-xs font-semibold" style={{ color: '#6C3BFF' }}>Your AI Number</span>
      </div>
      {phone ? (
        <>
          <p className="text-sm font-bold text-gray-800">{flag} {phone}</p>
          <a href="#" className="text-[11px] font-medium mt-1 block" style={{ color: '#6C3BFF' }}>
            Set up call forwarding →
          </a>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">No number assigned</p>
          <Link to="/phone" className="text-[11px] font-medium mt-1 block" style={{ color: '#6C3BFF' }}>
            Get a number →
          </Link>
        </>
      )}
    </div>
  );
}

// ─── User Profile Menu ────────────────────────────────────────────────────────
function UserProfileMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const name    = user?.full_name || 'User';
  const email   = user?.email     || '';
  const initials = getInitials(name);
  const color    = getAvatarColor(name);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-all">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ background: color }}
        >
          {initials || <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{name}</p>
          <p className="text-[10px] text-sidebar-foreground/50 truncate">{email}</p>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="p-1 rounded hover:bg-sidebar-border transition-colors"
        >
          <MoreHorizontal className="w-4 h-4 text-sidebar-foreground/60" />
        </button>
      </div>

      {/* Popup menu */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <button
            onClick={() => { setOpen(false); navigate('/account'); }}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm text-left hover:bg-accent transition-colors"
          >
            <User className="w-4 h-4 opacity-60" /> Account
          </button>
          <div className="h-px bg-border mx-2" />
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm text-left text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    setDark(v => {
      const next = !v;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs font-medium text-sidebar-foreground/60">Theme</span>
      <button
        onClick={toggle}
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-sidebar-accent transition-colors"
      >
        {dark
          ? <Sun className="w-4 h-4 text-sidebar-foreground/60" />
          : <Moon className="w-4 h-4 text-sidebar-foreground/60" />
        }
      </button>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ business }) {
  const [agentOpen, setAgentOpen] = useState(true);
  const { user } = useAuth();

  const planLabel = business?.subscription_plan
    ? business.subscription_plan.charAt(0).toUpperCase() + business.subscription_plan.slice(1)
    : null;

  return (
    <aside className="w-64 min-w-[16rem] bg-sidebar flex flex-col sidebar-glow relative z-10 h-full overflow-y-auto">
      {/* Logo + Plan badge */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-syne font-bold text-lg text-sidebar-accent-foreground">VoiceDesk</span>
          {planLabel && (
            <Link
              to="/settings/billing"
              className="ml-auto shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: '#EDE9FF', color: '#6C3BFF' }}
            >
              {planLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Workspace badge */}
      {business && (
        <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest mb-0.5">Workspace</p>
          <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">{business.name}</p>
          <span className="inline-flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-sidebar-foreground/60 capitalize">{business.subscription_plan || 'trial'}</span>
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 pb-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item, idx) => {
          if (item.type === 'group') return <GroupLabel key={idx} label={item.label} />;
          if (item.type === 'accordion') {
            return (
              <AccordionNavItem
                key={idx}
                item={item}
                open={agentOpen}
                onToggle={() => setAgentOpen(v => !v)}
              />
            );
          }
          return <NavLink key={item.path} {...item} />;
        })}
      </nav>

      {/* Widgets */}
      <AINumberWidget business={business} />
      <VoiceMinutesWidget />

      {/* Footer */}
      <div className="mt-3 border-t border-sidebar-border">
        <ThemeToggle />
        <div className="px-2 pb-3">
          <UserProfileMenu user={user} />
        </div>
      </div>
    </aside>
  );
}