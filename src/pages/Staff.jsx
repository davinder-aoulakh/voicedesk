import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, User, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F97316'];
const ROLES = ['Receptionist', 'Manager', 'Therapist', 'Stylist', 'Doctor', 'Nurse', 'Technician', 'Trainer', 'Coordinator', 'Other'];

function StaffModal({ staff, businessId, services, onClose, onSave }) {
  const isNew = !staff;
  const [form, setForm] = useState(staff || {
    name: '', role: '', email: '', phone: '', bio: '',
    assigned_services: [], is_active: true, color: COLORS[0], business_id: businessId,
  });
  const [saving, setSaving] = useState(false);

  const toggleService = (name) => {
    setForm(f => ({
      ...f,
      assigned_services: f.assigned_services?.includes(name)
        ? f.assigned_services.filter(s => s !== name)
        : [...(f.assigned_services || []), name],
    }));
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Staff name is required');
    setSaving(true);
    if (isNew) {
      await base44.entities.Staff.create(form);
    } else {
      await base44.entities.Staff.update(staff.id, form);
    }
    toast.success(isNew ? 'Staff member added' : 'Staff member updated');
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'Add Staff Member' : 'Edit Staff Member'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sarah Johnson" className="mt-1.5" />
            </div>
            <div>
              <Label>Role / Job Title</Label>
              <Input value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Senior Stylist" list="roles-list" className="mt-1.5" />
              <datalist id="roles-list">{ROLES.map(r => <option key={r} value={r} />)}</datalist>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@business.com" className="mt-1.5" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+61 4xx xxx xxx" className="mt-1.5" />
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input value={form.photo_url || ''} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." className="mt-1.5" />
            </div>
            <div className="col-span-2">
              <Label>Bio</Label>
              <Textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="mt-1.5 h-16 resize-none" placeholder="Brief bio..." />
            </div>
            {services.length > 0 && (
              <div className="col-span-2">
                <Label className="mb-2 block">Assigned Services</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => (
                    <button key={s.id} onClick={() => toggleService(s.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.assigned_services?.includes(s.name)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <Label className="mb-2 block">Calendar Colour</Label>
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
            {saving ? 'Saving...' : isNew ? 'Add Staff Member' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffCard({ staff, services, onEdit, onDelete, onToggle }) {
  const assignedServices = staff.assigned_services || [];
  const initials = staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-5 transition-all ${!staff.is_active ? 'opacity-60' : 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'}`}>
      <div className="flex items-start gap-4">
        {staff.photo_url ? (
          <img src={staff.photo_url} alt={staff.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-sm"
            style={{ background: staff.color || '#8B5CF6' }}>
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{staff.name}</p>
            {!staff.is_active && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>}
          </div>
          {staff.role && <p className="text-sm text-muted-foreground mt-0.5">{staff.role}</p>}
          <div className="flex flex-col gap-1 mt-2">
            {staff.email && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />{staff.email}
              </span>
            )}
            {staff.phone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />{staff.phone}
              </span>
            )}
          </div>
          {assignedServices.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {assignedServices.map(s => (
                <span key={s} className="px-2.5 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={() => onToggle(staff)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            {staff.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => onEdit(staff)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(staff.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStaff, setModalStaff] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    setBusinessId(businesses[0].id);
    const [staffData, serviceData] = await Promise.all([
      base44.entities.Staff.filter({ business_id: businesses[0].id }),
      base44.entities.Service.filter({ business_id: businesses[0].id }),
    ]);
    setStaffList(staffData);
    setServices(serviceData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Staff.delete(id);
    setStaffList(prev => prev.filter(s => s.id !== id));
    toast.success('Staff member removed');
  };

  const handleToggle = async (staff) => {
    const updated = { ...staff, is_active: !staff.is_active };
    await base44.entities.Staff.update(staff.id, { is_active: updated.is_active });
    setStaffList(prev => prev.map(s => s.id === staff.id ? updated : s));
  };

  const active = staffList.filter(s => s.is_active);
  const inactive = staffList.filter(s => !s.is_active);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Staff</h1>
          <p className="text-muted-foreground mt-1">{staffList.length} team member{staffList.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gradient-primary border-0 text-white shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : staffList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
          <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground mb-1">No staff members yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add your team so customers can book with specific staff</p>
          <Button onClick={() => setShowNew(true)} className="gradient-primary border-0 text-white"><Plus className="w-4 h-4 mr-2" /> Add First Staff Member</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Active ({active.length})</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {active.map(s => (
                  <StaffCard key={s.id} staff={s} services={services}
                    onEdit={setModalStaff} onDelete={handleDelete} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Inactive ({inactive.length})</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {inactive.map(s => (
                  <StaffCard key={s.id} staff={s} services={services}
                    onEdit={setModalStaff} onDelete={handleDelete} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showNew && <StaffModal businessId={businessId} services={services} onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); load(); }} />}
      {modalStaff && <StaffModal staff={modalStaff} businessId={businessId} services={services} onClose={() => setModalStaff(null)} onSave={() => { setModalStaff(null); load(); }} />}
    </div>
  );
}