import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Search, Plus, Phone, Mail, Calendar, MessageSquare, ChevronRight, Pencil, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import CustomerDetail from '@/components/customers/CustomerDetail';

function CustomerModal({ customer, businessId, onClose, onSave }) {
  const isNew = !customer;
  const [form, setForm] = useState(customer || {
    name: '', phone: '', email: '', notes: '', tags: [], business_id: businessId,
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags?.includes(t)) return;
    setForm(f => ({ ...f, tags: [...(f.tags || []), t] }));
    setTagInput('');
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    if (isNew) {
      await base44.entities.Customer.create(form);
    } else {
      await base44.entities.Customer.update(customer.id, form);
    }
    toast.success(isNew ? 'Customer added' : 'Customer updated');
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'Add Customer' : 'Edit Customer'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+61 4xx xxx xxx" className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1.5 h-20 resize-none" placeholder="Any notes about this customer..." />
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..." />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {form.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                    {tag}
                    <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Saving…' : isNew ? 'Add Customer' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    setBusinessId(businesses[0].id);
    const data = await base44.entities.Customer.filter({ business_id: businesses[0].id }, '-created_date', 200);
    setCustomers(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(customers); return; }
    const q = search.toLowerCase();
    setFiltered(customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.tags?.some(t => t.toLowerCase().includes(q))
    ));
  }, [search, customers]);

  const handleDelete = async (id) => {
    await base44.entities.Customer.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedCustomer?.id === id) setSelectedCustomer(null);
    toast.success('Customer removed');
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6'];
  const colorFor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <div className="flex h-full overflow-hidden">
      {/* List panel */}
      <div className={`flex flex-col border-r border-border bg-card transition-all ${selectedCustomer ? 'w-80 shrink-0' : 'flex-1'}`}>
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-syne font-bold">Customers</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{customers.length} total</p>
            </div>
            <Button onClick={() => setShowNew(true)} size="sm" className="gradient-primary border-0 text-white shadow-md shadow-primary/20">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, tag…" className="pl-8 h-8 text-sm" />
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-secondary shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-secondary rounded w-32" />
                    <div className="h-2.5 bg-secondary rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{search ? 'No customers match your search' : 'No customers yet'}</p>
              {!search && (
                <Button onClick={() => setShowNew(true)} size="sm" variant="outline" className="mt-3">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add first customer
                </Button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((customer, i) => {
                const isSelected = selectedCustomer?.id === customer.id;
                return (
                  <motion.button key={customer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedCustomer(isSelected ? null : customer)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-secondary/50'}`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: colorFor(customer.name) }}>
                      {initials(customer.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.phone || customer.email || '—'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {customer.total_bookings > 0 && (
                        <span className="text-xs text-muted-foreground">{customer.total_bookings} booking{customer.total_bookings !== 1 ? 's' : ''}</span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div key={selectedCustomer.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto bg-background">
            <CustomerDetail
              customer={selectedCustomer}
              colorFor={colorFor}
              initials={initials}
              onEdit={() => setEditCustomer(selectedCustomer)}
              onDelete={() => handleDelete(selectedCustomer.id)}
              onClose={() => setSelectedCustomer(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showNew && <CustomerModal businessId={businessId} onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); load(); }} />}
      {editCustomer && (
        <CustomerModal customer={editCustomer} businessId={businessId}
          onClose={() => setEditCustomer(null)}
          onSave={() => {
            setEditCustomer(null);
            setSelectedCustomer(null);
            load();
          }} />
      )}
    </div>
  );
}