import { useState } from 'react';
import { ChevronDown, Search, X, Sparkles,
  Utensils, Coffee, UtensilsCrossed, ChefHat, IceCream, Sandwich, Beer, PartyPopper, Building2,
  Scissors, Gem, Sparkles as SparklesIcon, Heart, Palette, Sun, Pen, Leaf, Flower2,
  Briefcase, Calculator, Scale, TrendingUp, Home, Shield, Megaphone, Lightbulb, Monitor,
  Wrench, Zap, Droplets, Hammer, Paintbrush, Trees, Wind, Grid3x3, Bug,
  Stethoscope, Smile, Activity, UserCheck, Brain, Eye, Apple, Footprints, Pill, PawPrint,
  GraduationCap, BookOpen, Globe, Music, Car, Swords, Dumbbell, PersonStanding,
  Settings, Truck, Shirt, Camera, Music2, MessageSquare, SprayCan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GROUPS = [
  {
    name: 'Restaurants & Venues',
    color: '#F59E0B',
    icon: Utensils,
    subtypes: [
      { name: 'Full-Service Restaurant', icon: Utensils },
      { name: 'Café / Coffee Shop', icon: Coffee },
      { name: 'Casual Dining', icon: UtensilsCrossed },
      { name: 'Formal Dining', icon: ChefHat },
      { name: 'Dessert Shop', icon: IceCream },
      { name: 'Fast Food', icon: Sandwich },
      { name: 'Bar / Pub', icon: Beer },
      { name: 'Event Venue', icon: PartyPopper },
      { name: 'Function Centre', icon: Building2 },
    ],
  },
  {
    name: 'Beauty & Grooming',
    color: '#EC4899',
    icon: SparklesIcon,
    subtypes: [
      { name: 'Hair Salon', icon: Scissors },
      { name: 'Barber Shop', icon: Scissors },
      { name: 'Nail Salon', icon: Gem },
      { name: 'Beauty Therapist', icon: SparklesIcon },
      { name: 'Massage Therapist', icon: Heart },
      { name: 'Makeup Artist', icon: Palette },
      { name: 'Tanning Studio', icon: Sun },
      { name: 'Tattoo Studio', icon: Pen },
      { name: 'Spa & Wellness', icon: Leaf },
      { name: 'Day Spa', icon: Flower2 },
    ],
  },
  {
    name: 'Professional Service',
    color: '#8B5CF6',
    icon: Briefcase,
    subtypes: [
      { name: 'Accountant', icon: Calculator },
      { name: 'Lawyer / Legal', icon: Scale },
      { name: 'Financial Advisor', icon: TrendingUp },
      { name: 'Real Estate Agent', icon: Home },
      { name: 'Insurance Broker', icon: Shield },
      { name: 'Marketing Agency', icon: Megaphone },
      { name: 'Consultant', icon: Lightbulb },
      { name: 'IT Services', icon: Monitor },
    ],
  },
  {
    name: 'Tradies',
    color: '#10B981',
    icon: Wrench,
    subtypes: [
      { name: 'Electrician', icon: Zap },
      { name: 'Plumber', icon: Droplets },
      { name: 'Builder / Carpenter', icon: Hammer },
      { name: 'Painter', icon: Paintbrush },
      { name: 'Landscaper / Gardener', icon: Trees },
      { name: 'HVAC Technician', icon: Wind },
      { name: 'Tiler', icon: Grid3x3 },
      { name: 'Pest Control', icon: Bug },
    ],
  },
  {
    name: 'Health & Wellbeing',
    color: '#EF4444',
    icon: Stethoscope,
    subtypes: [
      { name: 'GP / Medical Clinic', icon: Stethoscope },
      { name: 'Dentist', icon: Smile },
      { name: 'Physiotherapist', icon: Activity },
      { name: 'Chiropractor', icon: UserCheck },
      { name: 'Psychologist', icon: Brain },
      { name: 'Optometrist', icon: Eye },
      { name: 'Naturopath', icon: Leaf },
      { name: 'Dietitian', icon: Apple },
      { name: 'Podiatrist', icon: Footprints },
      { name: 'Pharmacy', icon: Pill },
      { name: 'Veterinarian', icon: PawPrint },
    ],
  },
  {
    name: 'Education',
    color: '#3B82F6',
    icon: GraduationCap,
    subtypes: [
      { name: 'Tutoring Centre', icon: BookOpen },
      { name: 'Language School', icon: Globe },
      { name: 'Music School', icon: Music },
      { name: 'Art School', icon: Palette },
      { name: 'Driving Instructor', icon: Car },
      { name: 'Martial Arts', icon: Swords },
      { name: 'Personal Trainer', icon: Dumbbell },
      { name: 'Yoga / Pilates', icon: PersonStanding },
    ],
  },
  {
    name: 'General Services',
    color: '#6B7280',
    icon: Settings,
    subtypes: [
      { name: 'Moving Service / Removalist', icon: Truck },
      { name: 'Car Service / Mechanic', icon: Car },
      { name: 'Car Wash / Detailing', icon: Droplets },
      { name: 'Computer Repair / IT', icon: Monitor },
      { name: 'Appliance Repair', icon: Wrench },
      { name: 'Home Maintenance', icon: Home },
      { name: 'Laundry / Dry Cleaning', icon: Shirt },
      { name: 'Event Planner', icon: Camera },
      { name: 'Photography / Videography', icon: Camera },
      { name: 'Music / Entertainment', icon: Music2 },
      { name: 'Consultation Service', icon: MessageSquare },
      { name: 'Car Detailing', icon: SprayCan },
      { name: 'Pet Grooming', icon: PawPrint },
      { name: 'Cleaning Service', icon: SparklesIcon },
    ],
  },
];

export default function BusinessTypePicker({ selected, onSelect }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;

  const allSubtypes = GROUPS.flatMap(g => g.subtypes.map(s => ({ ...s, groupName: g.name, groupColor: g.color })));
  const searchResults = isSearching
    ? allSubtypes.filter(s => s.name.toLowerCase().includes(q) || s.groupName.toLowerCase().includes(q))
    : [];

  const toggleGroup = (name) => setOpenGroup(prev => prev === name ? null : name);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search business types..."
          className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results flat grid */}
      {isSearching ? (
        <div className="grid grid-cols-3 gap-2">
          {searchResults.length === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground py-6">No results found</p>
          )}
          {searchResults.map(s => {
            const Icon = s.icon;
            const isSelected = selected === s.name;
            return (
              <button key={s.name} onClick={() => onSelect(s.name)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  isSelected ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                }`}>
                <Icon className="w-5 h-5" style={{ color: isSelected ? undefined : s.groupColor }} />
                <span className="text-center leading-tight">{s.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Accordion groups */
        <div className="space-y-2">
          {GROUPS.map(group => {
            const GroupIcon = group.icon;
            const isOpen = openGroup === group.name;
            return (
              <div key={group.name} className="border border-border rounded-xl overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
                >
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: group.color }} />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: group.color + '20' }}>
                    <GroupIcon className="w-4 h-4" style={{ color: group.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.subtypes.length} options</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Sub-types grid */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-4 pb-4 pt-2 grid grid-cols-3 sm:grid-cols-4 gap-2 border-t border-border bg-secondary/20">
                        {group.subtypes.map(s => {
                          const Icon = s.icon;
                          const isSelected = selected === s.name;
                          return (
                            <button key={s.name} onClick={() => onSelect(s.name)}
                              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                isSelected
                                  ? 'border-primary bg-accent text-primary ring-1 ring-primary'
                                  : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/60'
                              }`}>
                              <Icon className="w-5 h-5" style={{ color: isSelected ? undefined : group.color }} />
                              <span className="text-center leading-tight">{s.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected pill + auto-seed callout */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {selected}
            </span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-accent-foreground leading-relaxed">
              <strong>Auto-setup ready!</strong> We'll instantly create sample staff, services, and hours tailored for a <span className="font-semibold">{selected}</span> business.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}