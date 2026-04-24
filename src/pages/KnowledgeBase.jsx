import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Save, Sparkles, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CATEGORIES = ['General', 'Pricing', 'Booking', 'Services', 'Hours', 'Cancellation', 'Payments', 'Other'];

function FaqModal({ faq, onClose, onSave }) {
  const isNew = !faq;
  const [form, setForm] = useState(faq || { question: '', answer: '', category: 'General' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error('Question and answer are required');
    setSaving(true);
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'Add FAQ Entry' : 'Edit FAQ Entry'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Question *</Label>
            <Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="e.g. What are your opening hours?" className="mt-1.5" />
          </div>
          <div>
            <Label>Answer *</Label>
            <Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Provide a clear, detailed answer..." className="mt-1.5 h-32 resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Saving…' : isNew ? 'Add Entry' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FaqItem({ item, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${open ? 'border-primary/30' : 'border-border'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-secondary/30 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.question}</p>
          {!open && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.answer}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{item.category}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-4 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.answer}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onDelete(item)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KnowledgeBase() {
  const [business, setBusiness] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [modalFaq, setModalFaq] = useState(null);
  const [showNew, setShowNew] = useState(false);

  // Extra free-form context sections
  const [extraContext, setExtraContext] = useState('');

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) return;
      const biz = businesses[0];
      setBusiness(biz);

      // Parse existing faq_content (stored as Q:\nA: blocks or JSON)
      if (biz.faq_content) {
        const parsed = parseFaqContent(biz.faq_content);
        setFaqs(parsed.faqs);
        setExtraContext(parsed.extra);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Parse faq_content stored as "Q: ...\nA: ..." blocks
  const parseFaqContent = (content) => {
    const faqs = [];
    let extra = '';
    try {
      const lines = content.split('\n\n');
      lines.forEach(block => {
        const qMatch = block.match(/^Q:\s*(.+)/m);
        const aMatch = block.match(/^A:\s*([\s\S]+)/m);
        if (qMatch && aMatch) {
          faqs.push({
            id: Math.random().toString(36).slice(2),
            question: qMatch[1].trim(),
            answer: aMatch[1].trim(),
            category: 'General',
          });
        } else if (block.trim()) {
          extra += (extra ? '\n\n' : '') + block.trim();
        }
      });
    } catch {}
    return { faqs, extra };
  };

  const serializeFaqs = (faqList, extra) => {
    const blocks = faqList.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    return extra ? blocks + '\n\n' + extra : blocks;
  };

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    const content = serializeFaqs(faqs, extraContext);
    await base44.entities.Business.update(business.id, { faq_content: content });
    toast.success('Knowledge base saved');
    setSaving(false);
  };

  const handleAddFaq = (form) => {
    const newFaq = { ...form, id: Date.now().toString() };
    setFaqs(prev => [...prev, newFaq]);
    setShowNew(false);
    toast.success('FAQ entry added');
  };

  const handleEditFaq = (form) => {
    setFaqs(prev => prev.map(f => f.id === modalFaq.id ? { ...f, ...form } : f));
    setModalFaq(null);
    toast.success('FAQ entry updated');
  };

  const handleDeleteFaq = (item) => {
    setFaqs(prev => prev.filter(f => f.id !== item.id));
    toast.success('FAQ entry deleted');
  };

  const handleGenerate = async () => {
    if (!business) return;
    setGenerating(true);
    try {
      const services = await base44.entities.Service.filter({ business_id: business.id });
      const staff = await base44.entities.Staff.filter({ business_id: business.id });
      const hours = business.business_hours;

      const hoursText = hours ? Object.entries(hours)
        .map(([day, h]) => h.open ? `${day}: ${h.open_time}–${h.close_time}` : `${day}: Closed`)
        .join(', ') : 'Not specified';

      const serviceList = services.map(s => `${s.name} ($${s.price}, ${s.duration_minutes}min)`).join(', ') || 'Not specified';

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive FAQ knowledge base for a ${business.industry} business called "${business.name}".
Business description: ${business.description || 'N/A'}
Services offered: ${serviceList}
Staff: ${staff.map(s => s.name).join(', ') || 'N/A'}
Business hours: ${hoursText}

Generate 10-12 realistic, helpful FAQ entries that callers commonly ask.
Cover: pricing, booking process, cancellation, hours, services, staff qualifications, payment methods, and any industry-specific questions.`,
        response_json_schema: {
          type: 'object',
          properties: {
            faqs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' },
                  category: { type: 'string' },
                }
              }
            }
          }
        }
      });

      const generated = (res.faqs || []).map(f => ({ ...f, id: Date.now().toString() + Math.random(), category: f.category || 'General' }));
      setFaqs(prev => [...prev, ...generated]);
      toast.success(`Generated ${generated.length} FAQ entries`);
    } catch (e) {
      toast.error('Generation failed: ' + e.message);
    }
    setGenerating(false);
  };

  const filteredFaqs = faqs.filter(f => {
    const matchCat = filterCat === 'all' || f.category === filterCat;
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = filteredFaqs.reduce((acc, f) => {
    const cat = f.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const usedCategories = [...new Set(faqs.map(f => f.category || 'General'))];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">FAQ & context your AI agent uses to answer calls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerate} disabled={generating}>
            <Sparkles className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating…' : 'AI Generate'}
          </Button>
          <Button onClick={() => setShowNew(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Add FAQ
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white shadow-lg shadow-primary/20">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search & filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FAQs…" className="pl-9" />
            </div>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {usedCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'FAQ Entries', value: faqs.length },
              { label: 'Categories', value: usedCategories.length },
              { label: 'Words', value: faqs.reduce((s, f) => s + f.answer.split(' ').length, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-syne font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* FAQ list grouped by category */}
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground mb-1">No FAQ entries yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add entries manually or use AI Generate</p>
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={generating} variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Generate
                </Button>
                <Button onClick={() => setShowNew(true)} className="gradient-primary border-0 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add FAQ
                </Button>
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">{cat}</h3>
                <div className="space-y-2">
                  {items.map(faq => (
                    <FaqItem key={faq.id} item={faq}
                      onEdit={item => setModalFaq(item)}
                      onDelete={handleDeleteFaq}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Extra context */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-syne font-semibold mb-1">Additional Context</h3>
            <p className="text-xs text-muted-foreground mb-3">Any extra information for your AI agent (policies, special notes, instructions)</p>
            <Textarea
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              className="resize-none h-32 text-sm"
              placeholder="e.g. We require 24 hours notice for cancellations. Parking is available on Smith St..."
            />
          </div>
        </div>
      )}

      {showNew && <FaqModal onClose={() => setShowNew(false)} onSave={handleAddFaq} />}
      {modalFaq && <FaqModal faq={modalFaq} onClose={() => setModalFaq(null)} onSave={handleEditFaq} />}
    </div>
  );
}