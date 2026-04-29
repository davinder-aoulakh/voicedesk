import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Bell, Settings } from 'lucide-react';

export default function TopBar({ business, primaryLocation }) {
  const navigate = useNavigate();

  const locationName = primaryLocation?.name || business?.name || '—';
  const businessName = business?.name || '—';

  return (
    <div className="hidden lg:flex h-12 bg-card border-b border-border sticky top-0 z-10 items-center px-4 gap-3 shrink-0">
      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => navigate('/settings/business-info')}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary transition-colors min-w-0"
        >
          <span className="text-sm text-muted-foreground truncate">{businessName}</span>
          <span className="text-muted-foreground/50 text-sm mx-0.5">/</span>
          <span className="text-sm font-medium text-foreground truncate">{locationName}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-0.5" />
        </button>
      </div>

      {/* Right: bell + settings */}
      <div className="flex items-center gap-1 shrink-0">
        <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}