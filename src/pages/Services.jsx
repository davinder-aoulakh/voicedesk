import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Clock, DollarSign, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CURRENCIES = ['AUD', 'USD', 'GBP', 'NZD', 'CAD'];
const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'];

function ServiceModal({ service, businessId, onClose, onSave }) {
  const isNew = !service;
  const [form, setForm] = useState(service || {
    name: '', description: '', category: '', duration_minutes: 60,
    price: 0, currency: 'AUD', buffer_minutes: 0, max_bookings_per_slot: 1,
    is_active: true, color: COLORS[0], business_id: businessId,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name) return toast.error('Service name is required');
    setSaving(true);
    if (isNew) {
      await base44.entities.Service.create(form);
    } else {
      await base44.entities.Service.update(service.id, form);
    }
    toast.success(isNew ? 'Service created' : 'Service updated');
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'Add Service' : 'Edit Service'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Service Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Haircut & Style" className="mt-1.5" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5 h-16 resize-none" placeholder="Brief description..." />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Hair, Nails..." className="mt-1.5" />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" min="5" step="5" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Price</Label>
              <Input type="number" min="0" step="0.50" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Buffer Time (min)</Label>
              <Input type="number" min="0" step="5" value={form.buffer_minutes} onChange={e => setForm(f => ({ ...f, buffer_minutes: +e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Max Bookings per Slot</Label>
              <Input type="number" min="1" value={form.max_bookings_per_slot} onChange={e => setForm(f => ({ ...f, max_bookings_per_slot: +e.target.value }))} className="mt-1.5" />
            </div>
            <div className="col-span-2">
              <Label className="mb-2 block">Colour</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Saving...' : isNew ? 'Add Service' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalService, setModalService] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    setBusinessId(businesses[0].id);
    const data = await base44.entities.Service.filter({ business_id: businesses[0].id });
    setServices(data);
    const cats = [...new Set(data.map(s => s.category).filter(Boolean))];
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Service.delete(id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success('Service deleted');
  };

  const handleToggle = async (service) => {
    const updated = { ...service, is_active: !service.is_active };
    await base44.entities.Service.update(service.id, { is_active: updated.is_active });
    setServices(prev => prev.map(s => s.id === service.id ? updated : s));
  };

  const filtered = filterCategory === 'all' ? services : services.filter(s => s.category === filterCategory);
  const grouped = filtered.reduce((acc, s) => {
    const cat = s.category || 'Uncategorised';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">Manage your service catalogue</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gradient-primary border-0 text-white shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Service
        </Button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', ...categories].map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${filterCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
          <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground mb-1">No services yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add the services your business offers</p>
          <Button onClick={() => setShowNew(true)} className="gradient-primary border-0 text-white"><Plus className="w-4 h-4 mr-2" /> Add First Service</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">{cat}</h3>
              <div className="space-y-2">
                {items.map((service, i) => (
                  <motion.div key={service.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-all ${!service.is_active ? 'opacity-50' : 'hover:border-primary/30'}`}>
                    <div className="w-3 h-10 rounded-full shrink-0" style={{ background: service.color || '#8B5CF6' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{service.name}</p>
                        {!service.is_active && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      {service.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.description}</p>}
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration_minutes}m</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{service.price} {service.currency}</span>
                        {service.buffer_minutes > 0 && <span>+{service.buffer_minutes}m buffer</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggle(service)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        {service.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setModalService(service)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <ServiceModal businessId={businessId} onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); load(); }} />}
      {modalService && <ServiceModal service={modalService} businessId={businessId} onClose={() => setModalService(null)} onSave={() => { setModalService(null); load(); }} />}
    </div>
  );
}