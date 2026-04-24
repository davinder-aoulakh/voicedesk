import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Phone, Calendar, Bot, BarChart3, Settings, Zap, LogOut, ChevronRight,
  Tag, Users, Clock, Contact, BookOpen
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'AI Agent', icon: Bot, path: '/agent' },
  { label: 'Call Logs', icon: Phone, path: '/calls' },
  { label: 'Bookings', icon: Calendar, path: '/bookings' },
  { label: 'Customers', icon: Contact, path: '/customers' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { type: 'divider', label: 'Setup' },
  { label: 'Knowledge Base', icon: BookOpen, path: '/knowledge' },
  { label: 'Services', icon: Tag, path: '/services' },
  { label: 'Staff', icon: Users, path: '/staff' },
  { label: 'Business Hours', icon: Clock, path: '/hours' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ business }) {
  const location = useLocation();

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

      {/* Business Info */}
      {business && (
        <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest mb-0.5">Workspace</p>
          <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">{business.name}</p>
          <span className="inline-flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            <span className="text-xs text-sidebar-foreground/60 capitalize">{business.subscription_plan || 'trial'}</span>
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div key={idx} className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">{item.label}</p>
              </div>
            );
          }
          const { label, icon: Icon, path } = item;
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
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