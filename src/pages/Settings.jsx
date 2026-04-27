import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, CreditCard, ChevronRight } from 'lucide-react';

const SETTINGS_CARDS = [
  {
    icon: Building2,
    title: 'Business Information',
    description: 'Update your business profile, brand, and contact details',
    path: '/settings/business-info',
    color: '#6C3BFF',
    bg: '#EDE9FF',
  },
  {
    icon: MapPin,
    title: 'Locations',
    description: 'Manage your business locations and branch addresses',
    path: '/settings/locations',
    color: '#0EA5E9',
    bg: '#E0F2FE',
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'View your plan, usage, and manage your subscription',
    path: '/settings/billing',
    color: '#10B981',
    bg: '#ECFDF5',
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your business configuration</p>
      </div>

      <div className="space-y-4">
        {SETTINGS_CARDS.map(({ icon: Icon, title, description, path, color, bg }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-5 p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}