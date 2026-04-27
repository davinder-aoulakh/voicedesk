import { useState, useEffect } from 'react';

import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Trash2, Clock, Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ServiceSlideOver from '@/components/services/ServiceSlideOver';
import CategoriesTab from '@/components/services/CategoriesTab';

const TABS = ['Services', 'Categories'];

function InlineCategoryPicker({ service, cat, categories, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 group">
        {cat ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ background: cat.color || '#8B5CF6' }}>
            {cat.name}
          </span>
        ) : service.category ? (
          <span className="text-xs text-muted-foreground">{service.category}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        <ChevronDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {categories.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">No categories</p>}
          {categories.map(c => (
            <button key={c.id} onClick={() => { onSelect(c); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color || '#8B5CF6' }} />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(mins) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function Services() {
  const [tab, setTab]           = useState('Services');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations]   = useState([]);
  const [staffList, setStaffList]   = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [slideOver, setSlideOver]   = useState(null); // null | 'new' | service object
  const [addCatOpen, setAddCatOpen] = useState(false);

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    const biz = businesses[0];
    setBusinessId(biz.id);
    const [svcData, catData, locData, stfData] = await Promise.all([
      base44.entities.Service.filter({ business_id: biz.id }),
      base44.entities.ServiceCategory.filter({ business_id: biz.id }),
      base44.entities.Location.filter({ business_id: biz.id }),
      base44.entities.Staff.filter({ business_id: biz.id }),
    ]);
    setServices(svcData);
    setCategories(catData);
    setLocations(locData);
    setStaffList(stfData);
    setLoading(false);
  };

  const loadCategories = async () => {
    if (!businessId) return;
    const catData = await base44.entities.ServiceCategory.filter({ business_id: businessId });
    setCategories(catData);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Service.delete(id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success('Service deleted');
  };

  const getCategoryById = (id) => categories.find(c => c.id === id);

  const filtered = services.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    const cat = getCategoryById(s.category_id)?.name || s.category || '';
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Service Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your services and their categories</p>
        </div>
        <Button
          onClick={() => tab === 'Categories' ? setAddCatOpen(true) : setSlideOver('new')}
          className="gradient-primary border-0 text-white gap-1.5">
          <Plus className="w-4 h-4" />
          {tab === 'Categories' ? 'Add Category' : 'Add Service'}
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

      {/* Services Tab */}
      {tab === 'Services' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} service{filtered.length !== 1 ? 's' : ''}</p>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search services by name, description, or category..."
              className="pl-9 w-full" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
              <Tag className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground mb-1">No services found</p>
              {!search && (
                <Button onClick={() => setSlideOver('new')} className="gradient-primary border-0 text-white mt-3 gap-1.5">
                  <Plus className="w-4 h-4" /> Add First Service
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                <span>Service Name</span>
                <span>Category</span>
                <span>Duration</span>
                <span>Price</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-border">
                {filtered.map(service => {
                  const cat = getCategoryById(service.category_id);
                  return (
                    <div key={service.id}
                      className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-secondary/20 transition-colors">
                      {/* Service Name */}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{service.description}</p>
                        )}
                      </div>

                      {/* Category */}
                      <div>
                        <InlineCategoryPicker
                          service={service}
                          cat={cat}
                          categories={categories}
                          onSelect={async (catObj) => {
                            await base44.entities.Service.update(service.id, { category_id: catObj.id, category: catObj.name });
                            setServices(prev => prev.map(s => s.id === service.id ? { ...s, category_id: catObj.id, category: catObj.name } : s));
                          }}
                        />
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDuration(service.duration_minutes)}
                      </div>

                      {/* Price */}
                      <div className="text-sm font-medium">
                        ${Number(service.price || 0).toFixed(2)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setSlideOver(service)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete(service.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'Categories' && (
        <CategoriesTab
          categories={categories}
          businessId={businessId}
          onRefresh={loadCategories}
          showForm={addCatOpen}
          onFormClose={() => setAddCatOpen(false)}
        />
      )}

      {/* Slide-over */}
      {slideOver && (
        <ServiceSlideOver
          service={slideOver === 'new' ? null : slideOver}
          isNew={slideOver === 'new'}
          businessId={businessId}
          categories={categories}
          locations={locations}
          staffList={staffList}
          onClose={() => setSlideOver(null)}
          onSave={() => { setSlideOver(null); load(); }}
        />
      )}
    </div>
  );
}