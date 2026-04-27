import { useState, useEffect } from 'react';

import { base44 } from '@/api/base44Client';
import { Users, Search, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CustomerSlideOver from '@/components/customers/CustomerSlideOver';
import CustomerTagsTab from '@/components/customers/CustomerTagsTab';

const TABS = ['Customers', 'Customer Tags'];
const AVATAR_COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6'];
const colorFor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

function CustomerFormModal({ customer, businessId, onClose, onSave }) {
  const isNew = !customer;
  const [form, setForm] = useState(customer || {
    name: '', phone: '', email: '', notes: '', business_id: businessId,
  });
  const [saving, setSaving] = useState(false);

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
  const [tab, setTab]           = useState('Customers');
  const [customers, setCustomers] = useState([]);
  const [allTags, setAllTags]   = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterTag, setFilterTag] = useState(null);
  const [filterSource, setFilterSource] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [slideOver, setSlideOver] = useState(null); // customer object
  const [addTagOpen, setAddTagOpen] = useState(false);

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    const biz = businesses[0];
    setBusinessId(biz.id);
    const [custData, tagData] = await Promise.all([
      base44.entities.Customer.filter({ business_id: biz.id }, '-created_date', 200),
      base44.entities.CustomerTag.filter({ business_id: biz.id }),
    ]);
    setCustomers(custData);
    setAllTags(tagData);
    setLoading(false);
  };

  const loadTags = async () => {
    if (!businessId) return;
    const tagData = await base44.entities.CustomerTag.filter({ business_id: businessId });
    setAllTags(tagData);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Customer.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    toast.success('Customer removed');
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
    const matchTag = !filterTag || (c.customer_tag_ids || []).includes(filterTag);
    const matchSource = !filterSource || c.source === filterSource;
    return matchSearch && matchTag && matchSource;
  });

  const uniqueSources = [...new Set(customers.map(c => c.source).filter(Boolean))];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your customers and their tags</p>
        </div>
        <Button
          onClick={() => tab === 'Customer Tags' ? setAddTagOpen(true) : setShowNew(true)}
          className="gradient-primary border-0 text-white gap-1.5">
          <Plus className="w-4 h-4" />
          {tab === 'Customer Tags' ? 'Add Customer Tag' : 'Add Customer'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Customers Tab */}
      {tab === 'Customers' && (
        <div className="space-y-4">
          {!loading && customers.length === 0 ? (
            /* Empty state */
            <div className="border-2 border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-syne font-bold text-lg mb-1">No customers yet</h3>
              <p className="text-muted-foreground text-sm mb-5">Get started by adding your first customer</p>
              <Button onClick={() => setShowNew(true)} className="gradient-primary border-0 text-white gap-1.5">
                <Plus className="w-4 h-4" /> Add Your First Customer
              </Button>
            </div>
          ) : (
            <>
              {/* Search + filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-muted-foreground shrink-0">
                  Showing {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
                </p>
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search customers by name, phone, or email..."
                    className="pl-9 w-full" />
                </div>
              </div>

              {/* Filter chips */}
              {(allTags.length > 0 || uniqueSources.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Filter:</span>
                  {allTags.map(tag => (
                    <button key={tag.id}
                      onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                        filterTag === tag.id ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                      style={filterTag === tag.id ? { background: tag.color } : {}}>
                      {tag.name}
                    </button>
                  ))}
                  {uniqueSources.map(src => (
                    <button key={src}
                      onClick={() => setFilterSource(filterSource === src ? null : src)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border capitalize ${
                        filterSource === src ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}>
                      {src}
                    </button>
                  ))}
                  {(filterTag || filterSource) && (
                    <button onClick={() => { setFilterTag(null); setFilterSource(null); }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-full border border-border">
                      Clear
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">No customers match your search or filters.</p>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                    <span>Customer</span>
                    <span>Phone</span>
                    <span>Tags</span>
                    <span>Bookings</span>
                    <span>Last Seen</span>
                    <span>Actions</span>
                  </div>
                  <div className="divide-y divide-border">
                    {filtered.map((customer, i) => {
                      const custTags = allTags.filter(t => (customer.customer_tag_ids || []).includes(t.id));
                      const lastSeen = customer.last_contact
                        ? formatDistanceToNow(new Date(customer.last_contact), { addSuffix: true })
                        : customer.updated_date
                          ? formatDistanceToNow(new Date(customer.updated_date), { addSuffix: true })
                          : '—';
                      return (
                        <motion.div key={customer.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-secondary/20 transition-colors">
                          {/* Name + Avatar */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: colorFor(customer.name) }}>
                              {initials(customer.name)}
                            </div>
                            <span className="font-semibold text-sm truncate">{customer.name}</span>
                          </div>
                          {/* Phone */}
                          <div className="text-sm text-muted-foreground truncate">
                            {customer.phone ? `📞 ${customer.phone}` : customer.email || '—'}
                          </div>
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1">
                            {custTags.slice(0, 2).map(tag => (
                              <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ background: tag.color || '#8B5CF6' }}>
                                {tag.name}
                              </span>
                            ))}
                            {custTags.length > 2 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                +{custTags.length - 2}
                              </span>
                            )}
                          </div>
                          {/* Bookings */}
                          <div className="text-sm text-muted-foreground">{customer.total_bookings || 0}</div>
                          {/* Last Seen */}
                          <div className="text-xs text-muted-foreground">{lastSeen}</div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setSlideOver(customer)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </button>
                            <button onClick={() => handleDelete(customer.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Customer Tags Tab */}
      {tab === 'Customer Tags' && (
        <CustomerTagsTab
          tags={allTags}
          businessId={businessId}
          onRefresh={() => { loadTags(); load(); }}
          showForm={addTagOpen}
          onFormClose={() => setAddTagOpen(false)}
        />
      )}

      {/* Add Customer Modal */}
      {showNew && (
        <CustomerFormModal
          businessId={businessId}
          onClose={() => setShowNew(false)}
          onSave={() => { setShowNew(false); load(); }}
        />
      )}

      {/* Customer Slide-Over */}
      {slideOver && (
        <CustomerSlideOver
          customer={slideOver}
          allTags={allTags}
          businessId={businessId}
          onClose={() => setSlideOver(null)}
          onSave={() => { setSlideOver(null); load(); }}
          onQuickRebook={(c) => {
            setSlideOver(null);
            // Navigate to bookings with pre-fill — for now just toast
            toast.info(`Quick Rebook for ${c.name} — open Bookings tab to create`);
          }}
        />
      )}
    </div>
  );
}