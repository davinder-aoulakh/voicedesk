import { useState, useEffect } from 'react';
import { X, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import InlineTagPicker from './InlineTagPicker';
import StaffScheduleTab from './StaffScheduleTab';

const COLORS = ['#8B5CF6','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6','#F97316'];
const TABS = ['Details', 'Schedule'];

export default function StaffSlideOver({ staff, businessId, services, jobTitles, locations, onClose, onSave, onRefreshTags }) {
  const isNew = !staff;
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState(staff ? { ...staff } : {
    name: '', role: '', email: '', phone: '', bio: '',
    assigned_services: [], is_active: true, color: COLORS[0],
    business_id: businessId, job_title_ids: [], primary_location_id: '',
    photo_url: '', working_hours: null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    if (isNew) {
      await base44.entities.Staff.create(form);
    } else {
      await base44.entities.Staff.update(staff.id, form);
    }
    toast.success(isNew ? 'Staff member added' : 'Staff updated');
    setSaving(false);
    onSave();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_url: file_url }));
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const toggleService = (name) => {
    setForm(f => ({
      ...f,
      assigned_services: f.assigned_services?.includes(name)
        ? f.assigned_services.filter(s => s !== name)
        : [...(f.assigned_services || []), name],
    }));
  };

  const handleCreateJobTitle = async (data) => {
    const created = await base44.entities.JobTitle.create({ ...data, business_id: businessId });
    onRefreshTags();
    return created;
  };

  const handleDeleteJobTitle = async (id) => {
    await base44.entities.JobTitle.delete(id);
    setForm(f => ({ ...f, job_title_ids: (f.job_title_ids || []).filter(x => x !== id) }));
    onRefreshTags();
  };

  const initials = form.name ? form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-syne font-bold text-lg">{isNew ? 'Add Staff Member' : form.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
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
            <div className="space-y-5">
              {/* Avatar + upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0 overflow-hidden"
                  style={{ background: form.color || COLORS[0] }}>
                  {form.photo_url ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading…' : 'Upload photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sarah Johnson" className="mt-1.5" />
              </div>

              {/* Job Titles */}
              <div>
                <Label className="block mb-1.5">Job Title(s)</Label>
                <InlineTagPicker
                  tags={jobTitles}
                  selectedIds={form.job_title_ids || []}
                  onSave={(ids) => setForm(f => ({ ...f, job_title_ids: ids }))}
                  onCreateTag={handleCreateJobTitle}
                  onDeleteTag={handleDeleteJobTitle}
                  placeholder="Search job titles..."
                />
              </div>

              {/* Primary Location */}
              {locations.length > 0 && (
                <div>
                  <Label>Primary Location</Label>
                  <select value={form.primary_location_id || ''} onChange={e => setForm(f => ({ ...f, primary_location_id: e.target.value }))}
                    className="mt-1.5 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">No location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@business.com" className="mt-1.5" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+61 4xx xxx xxx" className="mt-1.5" />
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label>Bio</Label>
                <Textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="mt-1.5 h-20 resize-none" placeholder="Brief bio..." />
              </div>

              {/* Services */}
              {services.length > 0 && (
                <div>
                  <Label className="block mb-2">Assigned Services</Label>
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

              {/* Calendar colour */}
              <div>
                <Label className="block mb-2">Calendar Colour</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Staff member is available for bookings</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{ background: form.is_active ? '#6C3BFF' : '#D1D5DB' }}>
                  <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                    style={{ transform: form.is_active ? 'translateX(18px)' : 'translateX(2px)' }} />
                </button>
              </div>

              {/* Timestamps */}
              {!isNew && (
                <div className="text-xs text-muted-foreground space-y-0.5 pt-2 border-t border-border">
                  {staff.created_date && <p>Created: {format(new Date(staff.created_date), 'dd MMM yyyy, h:mm a')}</p>}
                  {staff.updated_date && <p>Updated: {format(new Date(staff.updated_date), 'dd MMM yyyy, h:mm a')}</p>}
                </div>
              )}
            </div>
          )}

          {tab === 'Schedule' && (
            <StaffScheduleTab
              workingHours={form.working_hours}
              onChange={(wh) => setForm(f => ({ ...f, working_hours: wh }))}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Saving…' : isNew ? 'Add Staff Member' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}