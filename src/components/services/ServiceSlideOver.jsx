import { useState, useEffect } from 'react';
import { X, Pencil, Plus, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AddOnsTab from './AddOnsTab';

const TABS = ['Details', 'Add-ons'];
const COLORS = ['#8B5CF6','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6','#F97316'];

function formatDuration(mins) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function FieldRow({ label, children, onEdit }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary ml-2 shrink-0 mt-0.5">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', onDone }) {
  return (
    <div className="py-2">
      <Label className="text-xs">{label}</Label>
      {type === 'textarea' ? (
        <Textarea value={value} onChange={e => onChange(e.target.value)} className="mt-1 text-sm h-20 resize-none" autoFocus />
      ) : (
        <Input type={type} value={value} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)} className="mt-1 text-sm" autoFocus />
      )}
      <Button size="sm" onClick={onDone} className="mt-1.5 h-7 text-xs gradient-primary border-0 text-white gap-1">
        <Check className="w-3 h-3" /> Done
      </Button>
    </div>
  );
}

export default function ServiceSlideOver({ service, isNew, businessId, categories, locations, staffList, onClose, onSave }) {
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState(service ? { ...service } : {
    name: '', description: '', duration_minutes: 60, price: 0, currency: 'AUD',
    is_active: true, color: COLORS[0], business_id: businessId,
    category_id: '', location_ids: [], available_to_all_staff: true, service_staff_ids: [],
    add_ons: [],
  });
  const [editing, setEditing] = useState(null); // field name being edited
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setDirty(true);
  };

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') attemptClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dirty]);

  const attemptClose = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    onClose();
  };

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
    setDirty(false);
    onSave();
  };

  const selectedCategory = categories.find(c => c.id === form.category_id);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={attemptClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-background border-l border-border flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.25s ease' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-syne font-bold text-lg">{isNew ? 'Add Service' : form.name || 'Service'}</h2>
          <button onClick={attemptClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'Details' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-semibold">Service Details</h3>
                <Button size="sm" variant="outline" onClick={() => setEditing('all')} className="h-7 text-xs gap-1">
                  <Pencil className="w-3 h-3" /> Edit All
                </Button>
              </div>

              {/* Edit-all mode: show all fields as inputs */}
              {editing === 'all' ? (
                <div className="space-y-4">
                  <div><Label>Name *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1.5 text-sm" /></div>
                  <div><Label>Price</Label><Input type="number" min="0" step="0.5" value={form.price} onChange={e => update('price', +e.target.value)} className="mt-1.5 text-sm" /></div>
                  <div><Label>Duration (minutes)</Label><Input type="number" min="5" step="5" value={form.duration_minutes} onChange={e => update('duration_minutes', +e.target.value)} className="mt-1.5 text-sm" /></div>
                  <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} className="mt-1.5 text-sm h-20 resize-none" /></div>
                  <div>
                    <Label className="block mb-1.5">Colour</Label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => update('color', c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setEditing(null)} className="gradient-primary border-0 text-white h-8 text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> Done Editing
                  </Button>
                </div>
              ) : (
                /* Read-only field rows */
                <div className="bg-card border border-border rounded-xl divide-y divide-border px-4 mb-5">
                  <FieldRow label="Name" onEdit={() => setEditing('name')}>
                    {editing === 'name'
                      ? <EditField label="" value={form.name} onChange={v => update('name', v)} onDone={() => setEditing(null)} />
                      : <span className="font-semibold">{form.name || '—'}</span>}
                  </FieldRow>
                  <FieldRow label="Price" onEdit={() => setEditing('price')}>
                    {editing === 'price'
                      ? <EditField label="" type="number" value={form.price} onChange={v => update('price', v)} onDone={() => setEditing(null)} />
                      : `$${Number(form.price || 0).toFixed(2)}`}
                  </FieldRow>
                  <FieldRow label="Duration" onEdit={() => setEditing('duration_minutes')}>
                    {editing === 'duration_minutes'
                      ? <EditField label="" type="number" value={form.duration_minutes} onChange={v => update('duration_minutes', v)} onDone={() => setEditing(null)} />
                      : <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{formatDuration(form.duration_minutes)}</span>}
                  </FieldRow>
                  <FieldRow label="Description" onEdit={() => setEditing('description')}>
                    {editing === 'description'
                      ? <EditField label="" type="textarea" value={form.description || ''} onChange={v => update('description', v)} onDone={() => setEditing(null)} />
                      : <span className="text-muted-foreground">{form.description || '—'}</span>}
                  </FieldRow>
                  <FieldRow label="Status">
                    <button onClick={() => update('is_active', !form.is_active)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${form.is_active ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </FieldRow>
                  <FieldRow label="Category">
                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                      {selectedCategory && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ background: selectedCategory.color || '#8B5CF6' }}>
                          {selectedCategory.name}
                          <button onClick={() => update('category_id', '')} className="hover:bg-black/20 rounded-full p-0.5">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      )}
                      <div className="relative inline-block">
                        <CategoryPicker categories={categories} onSelect={(id) => update('category_id', id)} />
                      </div>
                    </div>
                  </FieldRow>
                </div>
              )}

              {/* Service Availability */}
              <div className="space-y-4">
                <h3 className="font-syne font-semibold text-sm">Service Availability</h3>

                {/* Locations */}
                {locations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Available Locations</p>
                    <div className="space-y-2">
                      {locations.map(loc => (
                        <label key={loc.id} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox"
                            checked={(form.location_ids || []).includes(loc.id)}
                            onChange={(e) => {
                              const ids = form.location_ids || [];
                              update('location_ids', e.target.checked ? [...ids, loc.id] : ids.filter(x => x !== loc.id));
                            }}
                            className="accent-primary w-4 h-4" />
                          <span className="text-sm">{loc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Available Staff</p>
                  <label className="flex items-center justify-between cursor-pointer py-2 px-3 bg-secondary/30 rounded-lg">
                    <span className="text-sm">Apply to all staff</span>
                    <button onClick={() => update('available_to_all_staff', !form.available_to_all_staff)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ background: form.available_to_all_staff ? '#6C3BFF' : '#D1D5DB' }}>
                      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                        style={{ transform: form.available_to_all_staff ? 'translateX(18px)' : 'translateX(2px)' }} />
                    </button>
                  </label>
                  {!form.available_to_all_staff && staffList.length > 0 && (
                    <div className="mt-2 space-y-2 pl-1">
                      {staffList.map(s => (
                        <label key={s.id} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox"
                            checked={(form.service_staff_ids || []).includes(s.id)}
                            onChange={(e) => {
                              const ids = form.service_staff_ids || [];
                              update('service_staff_ids', e.target.checked ? [...ids, s.id] : ids.filter(x => x !== s.id));
                            }}
                            className="accent-primary w-4 h-4" />
                          <span className="text-sm">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              {!isNew && (
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground space-y-0.5">
                  {service.created_date && <p>Created: {format(new Date(service.created_date), 'dd MMM yyyy, h:mm a')}</p>}
                  {service.updated_date && <p>Last Updated: {format(new Date(service.updated_date), 'dd MMM yyyy, h:mm a')}</p>}
                </div>
              )}
            </div>
          )}

          {tab === 'Add-ons' && (
            <AddOnsTab addOns={form.add_ons || []} onChange={(addOns) => { update('add_ons', addOns); }} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={attemptClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Saving…' : isNew ? 'Create Service' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// Inline category picker button
function CategoryPicker({ categories, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground">
        <Plus className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {categories.length === 0 && <p className="text-xs text-muted-foreground p-3 text-center">No categories yet</p>}
          {categories.map(c => (
            <button key={c.id} onClick={() => { onSelect(c.id); setOpen(false); }}
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