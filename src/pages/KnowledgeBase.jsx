import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Building2, Tag, UtensilsCrossed, MapPin, Users, HelpCircle,
  Shield, Star, MessageSquare, Eye, Pencil, Trash2, RefreshCw,
  Upload, Link, AlignLeft, CheckCircle2, XCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PreviewModal from '@/components/knowledge/PreviewModal';
import TextEditorModal from '@/components/knowledge/TextEditorModal';
import UrlIngestionModal from '@/components/knowledge/UrlIngestionModal';

// ─── Category meta ────────────────────────────────────────────────────────────
const CATEGORY_META = {
  business_info:     { label: 'Business Info',      icon: Building2,       color: '#3B82F6', bg: '#EFF6FF', desc: 'Business name, industry, contact details, and description.' },
  service_menu:      { label: 'Service Menu',        icon: Tag,             color: '#14B8A6', bg: '#F0FDFA', desc: 'All services, durations, prices, and descriptions.' },
  food_menu:         { label: 'Food Menu',           icon: UtensilsCrossed, color: '#F97316', bg: '#FFF7ED', desc: 'Food items, pricing, dietary info, and specials.', visibleFor: ['restaurant'] },
  locations:         { label: 'Locations',           icon: MapPin,          color: '#22C55E', bg: '#F0FDF4', desc: 'Physical addresses, opening hours per location.' },
  staff:             { label: 'Staff',               icon: Users,           color: '#8B5CF6', bg: '#F5F3FF', desc: 'Team members, roles, specialisations, and bios.' },
  faq:               { label: 'FAQ',                 icon: HelpCircle,      color: '#EAB308', bg: '#FEFCE8', desc: 'Common questions and answers about your business.' },
  service_policy:    { label: 'Service Policy',      icon: Shield,          color: '#EF4444', bg: '#FEF2F2', desc: 'Cancellation, refund, and booking policies.' },
  special_promotion: { label: 'Special Promotion',   icon: Star,            color: '#EC4899', bg: '#FDF2F8', desc: 'Current deals, discounts, and seasonal offers.' },
  custom_messages:   { label: 'Custom Messages',     icon: MessageSquare,   color: '#6B7280', bg: '#F9FAFB', desc: 'Custom scripts and phrases for specific scenarios.' },
};

// Categories that support Sync from Speako
const SYNC_CATEGORIES = ['business_info', 'service_menu', 'locations', 'staff'];

// ─── Rebuild VAPI system prompt ───────────────────────────────────────────────
async function rebuildVapiPrompt(businessId, agentId, vapiAssistantId) {
  if (!vapiAssistantId) return;
  const allCards = await base44.entities.KnowledgeCard.filter({ business_id: businessId, status: 'published' });
  const sections = allCards.map(c => {
    const meta = CATEGORY_META[c.category];
    return `### ${meta?.label || c.category}\n${c.content}`;
  }).join('\n\n');

  const systemPrompt = `You are a professional AI receptionist. Use the following knowledge base to answer customer questions accurately:\n\n${sections}`;
  await base44.functions.invoke('updateVapiAssistant', { assistant_id: vapiAssistantId, system_prompt: systemPrompt });
}

// ─── Sync from entities ───────────────────────────────────────────────────────
async function syncFromEntities(category, business) {
  const bizId = business.id;
  switch (category) {
    case 'business_info': {
      const lines = [
        `Business Name: ${business.name || ''}`,
        `Industry: ${business.industry || ''}`,
        `Phone: ${business.phone || ''}`,
        `Email: ${business.email || ''}`,
        `Address: ${business.address || ''}`,
        `Timezone: ${business.timezone || ''}`,
        `Description: ${business.description || ''}`,
        `Website: ${business.website || ''}`,
      ].filter(l => !l.endsWith(': ')).join('\n');
      return lines;
    }
    case 'service_menu': {
      const services = await base44.entities.Service.filter({ business_id: bizId, is_active: true });
      if (!services.length) throw new Error('No active services found');
      return services.map(s =>
        `${s.name} — ${s.duration_minutes}min — $${s.price}${s.description ? `\n  ${s.description}` : ''}`
      ).join('\n');
    }
    case 'locations': {
      const locs = await base44.entities.Location.filter({ business_id: bizId });
      if (!locs.length) throw new Error('No locations found');
      return locs.map(l =>
        [l.name, l.address, l.city, l.state, l.country].filter(Boolean).join(', ')
      ).join('\n');
    }
    case 'staff': {
      const staff = await base44.entities.Staff.filter({ business_id: bizId, is_active: true });
      if (!staff.length) throw new Error('No active staff found');
      return staff.map(s =>
        `${s.name} — ${s.role || ''}${s.bio ? `\n  ${s.bio}` : ''}`
      ).join('\n');
    }
    default: return '';
  }
}

// ─── KnowledgeCardTile ────────────────────────────────────────────────────────
function KnowledgeCardTile({ card, business, agent, onRefresh }) {
  const [activeModal, setActiveModal] = useState(null); // 'preview'|'edit'|'url'
  const [syncing, setSyncing]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef(null);

  const meta = CATEGORY_META[card.category];
  if (!meta) return null;
  const Icon = meta.icon;
  const isPublished = card.status === 'published';

  const publishCard = async (content) => {
    await base44.entities.KnowledgeCard.update(card.id, {
      content,
      status: 'published',
      last_synced_at: new Date().toISOString(),
    });
    toast.success(`${meta.label} published`);
    await rebuildVapiPrompt(business.id, agent?.id, agent?.vapi_assistant_id).catch(() => {});
    onRefresh();
  };

  const handleUnpublish = async () => {
    await base44.entities.KnowledgeCard.update(card.id, { status: 'not_added', content: '' });
    toast.success(`${meta.label} unpublished`);
    onRefresh();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const content = await syncFromEntities(card.category, business);
      await publishCard(content);
    } catch (e) {
      toast.error(e.message);
    }
    setSyncing(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: 'object', properties: { text: { type: 'string' } } },
      });
      const text = result?.output?.text || result?.output?.[0]?.text || JSON.stringify(result?.output);
      await publishCard(text);
    } catch (e) {
      toast.error('File upload failed: ' + e.message);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: meta.bg }}>
            <Icon className="w-4.5 h-4.5" style={{ color: meta.color, width: 18, height: 18 }} />
          </div>
          <span className="font-semibold text-sm">{meta.label}</span>
        </div>
        {/* Status badge */}
        {isPublished ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 px-2.5 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Not Added
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{meta.desc}</p>

      {/* Actions */}
      {isPublished ? (
        <div className="flex items-center gap-1.5 pt-1 border-t border-border">
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1" onClick={() => setActiveModal('preview')}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1" onClick={() => setActiveModal('edit')}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto" onClick={handleUnpublish}>
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1 border-t border-border">
          {/* Sync from Speako */}
          {SYNC_CATEGORIES.includes(card.category) && (
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync from Speako'}
            </button>
          )}

          {/* Upload File */}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-50">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            {uploading ? 'Uploading…' : 'Upload File'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.xlsx,.csv" className="hidden" onChange={handleFileUpload} />

          {/* Add from URL */}
          <button onClick={() => setActiveModal('url')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors">
            <Link className="w-3.5 h-3.5 text-muted-foreground" />
            Add from URL
          </button>

          {/* Edit in Text Mode */}
          <button onClick={() => setActiveModal('edit')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors">
            <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
            Edit in Text Mode
          </button>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'preview' && (
        <PreviewModal card={card} displayName={meta.label} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'edit' && (
        <TextEditorModal card={card} displayName={meta.label}
          onSave={async (content) => { await publishCard(content); setActiveModal(null); }}
          onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'url' && (
        <UrlIngestionModal displayName={meta.label}
          onSave={async (content) => { await publishCard(content); setActiveModal(null); }}
          onClose={() => setActiveModal(null)} />
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KnowledgeBase() {
  const [business, setBusiness]     = useState(null);
  const [agent, setAgent]           = useState(null);
  const [cards, setCards]           = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    const biz = businesses[0];
    setBusiness(biz);

    const [agents, rawCards] = await Promise.all([
      base44.entities.Agent.filter({ business_id: biz.id }),
      base44.entities.KnowledgeCard.filter({ business_id: biz.id }),
    ]);
    setAgent(agents[0] || null);

    // Ensure all 9 categories exist
    const categoryOrder = Object.keys(CATEGORY_META);
    const existing = {};
    rawCards.forEach(c => { existing[c.category] = c; });

    // Create any missing cards
    const missing = categoryOrder.filter(cat => !existing[cat]);
    if (missing.length) {
      await Promise.all(missing.map(cat =>
        base44.entities.KnowledgeCard.create({ business_id: biz.id, category: cat, status: 'not_added' })
      ));
      const refreshed = await base44.entities.KnowledgeCard.filter({ business_id: biz.id });
      refreshed.forEach(c => { existing[c.category] = c; });
    }

    setCards(categoryOrder.map(cat => existing[cat]).filter(Boolean));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const publishedCount = cards.filter(c => c.status === 'published').length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">All your business info in one place for your agents.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-xl px-3 py-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{publishedCount} / 9 published</span>
          </div>
          <Button variant="outline" size="sm">Start Tour</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="h-56 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards
            .filter(card => {
              const meta = CATEGORY_META[card.category];
              return !meta?.visibleFor || meta.visibleFor.includes(business?.industry);
            })
            .map((card) => (
              <KnowledgeCardTile
                key={card.id}
                card={card}
                business={business}
                agent={agent}
                onRefresh={load}
              />
            ))}
        </div>
      )}
    </div>
  );
}