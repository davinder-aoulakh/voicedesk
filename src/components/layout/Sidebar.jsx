import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, Bot, Settings, Zap, LogOut,
  ChevronDown, Users, Clock, Tag, BookOpen, Wrench,
  MapPin, CreditCard, Building2, Smile, Mic, Contact,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Nav Structure ────────────────────────────────────────────────────────────
const NAV = [
  // Ungrouped
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
      { label: 'Greetings',        icon: Smile, path: '/agent/greetings' },
      { label: 'Personality',      icon: Bot,   path: '/agent/personality' },
      { label: 'Voice & Languages',icon: Mic,   path: '/agent/voice' },
    ],
  },
  { label: 'Knowledges', icon: BookOpen, path: '/knowledge' },
  { label: 'AI Tools',   icon: Wrench,   path: '/agent/tools' },

  { type: 'group', label: 'Configure' },
  { label: 'Settings', icon: Settings, path: '/settings' },

  { type: 'group', label: 'Organization Settings' },
  { label: 'Business Info', icon: Building2, path: '/settings/business-info' },
  { label: 'Locations',     icon: MapPin,    path: '/settings/locations' },
  { label: 'Billing',       icon: CreditCard, path: '/settings/billing' },
];

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

      {/* Animated children */}
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ business }) {
  const [agentOpen, setAgentOpen] = useState(true);

  return (
    <aside className="w-64 min-w-[16rem] bg-sidebar flex flex-col sidebar-glow relative z-10 h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-syne font-bold text-lg text-sidebar-accent-foreground">VoiceDesk</span>
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
      <nav className="flex-1 px-3 mt-4 pb-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item, idx) => {
          if (item.type === 'group') {
            return <GroupLabel key={idx} label={item.label} />;
          }
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

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}