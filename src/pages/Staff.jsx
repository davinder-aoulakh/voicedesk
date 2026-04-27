import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Clock, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import StaffSlideOver from '@/components/staff/StaffSlideOver';
import JobTitlesTab from '@/components/staff/JobTitlesTab';
import InlineTagPicker from '@/components/staff/InlineTagPicker';

const TABS = ['Staff', 'Job Titles'];

function Avatar({ staff }) {
  const initials = staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return staff.photo_url ? (
    <img src={staff.photo_url} alt={staff.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ background: staff.color || '#8B5CF6' }}>
      {initials}
    </div>
  );
}

export default function Staff() {
  const [tab, setTab]           = useState('Staff');
  const [staffList, setStaffList] = useState([]);
  const [services, setServices]   = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [slideOver, setSlideOver] = useState(null); // null | 'new' | staff object

  const load = async () => {
    const user = await base44.auth.me();
    const businesses = await base44.entities.Business.filter({ owner_id: user.id });
    if (!businesses.length) return;
    const biz = businesses[0];
    setBusinessId(biz.id);
    const [staffData, serviceData, tagData, locData] = await Promise.all([
      base44.entities.Staff.filter({ business_id: biz.id }),
      base44.entities.Service.filter({ business_id: biz.id }),
      base44.entities.JobTitle.filter({ business_id: biz.id }),
      base44.entities.Location.filter({ business_id: biz.id }),
    ]);
    setStaffList(staffData);
    setServices(serviceData);
    setJobTitles(tagData);
    setLocations(locData);
    setLoading(false);
  };

  const loadTags = async () => {
    if (!businessId) return;
    const tags = await base44.entities.JobTitle.filter({ business_id: businessId });
    setJobTitles(tags);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Staff.delete(id);
    setStaffList(prev => prev.filter(s => s.id !== id));
    toast.success('Staff member removed');
  };

  const handleJobTitleSave = async (staffMember, ids) => {
    await base44.entities.Staff.update(staffMember.id, { job_title_ids: ids });
    setStaffList(prev => prev.map(s => s.id === staffMember.id ? { ...s, job_title_ids: ids } : s));
  };

  const getLocation = (locationId) => locations.find(l => l.id === locationId);

  const filtered = staffList.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    const jts = (s.job_title_ids || []).map(id => jobTitles.find(j => j.id === id)?.name || '').join(' ');
    const loc = getLocation(s.primary_location_id)?.name || '';
    const svcs = (s.assigned_services || []).join(' ');
    return (
      s.name.toLowerCase().includes(q) ||
      jts.toLowerCase().includes(q) ||
      loc.toLowerCase().includes(q) ||
      svcs.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your staff members and their job titles</p>
        </div>
        <Button onClick={() => setSlideOver(tab === 'Job Titles' ? '__jobtitle__' : 'new')}
          className="gradient-primary border-0 text-white gap-1.5">
          <Plus className="w-4 h-4" />
          {tab === 'Job Titles' ? 'Add Job Title' : 'Add Staff'}
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

      {/* Staff Tab */}
      {tab === 'Staff' && (
        <div className="space-y-4">
          {/* Count + search */}
          <p className="text-sm text-muted-foreground">Showing {filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</p>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search staff by name, job title, location, or service..."
              className="pl-9 w-full" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
              <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground mb-1">No staff members found</p>
              {!search && (
                <Button onClick={() => setSlideOver('new')} className="gradient-primary border-0 text-white mt-3 gap-1.5">
                  <Plus className="w-4 h-4" /> Add First Staff Member
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_2fr_2fr_auto] gap-4 px-5 py-3 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                <span>Staff Name</span>
                <span>Job Title</span>
                <span>Primary Location</span>
                <span>Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {filtered.map(staff => {
                  const staffJobTitles = (staff.job_title_ids || []).map(id => jobTitles.find(j => j.id === id)).filter(Boolean);
                  const loc = getLocation(staff.primary_location_id);
                  const serviceCount = (staff.assigned_services || []).length;

                  return (
                    <div key={staff.id} className="grid grid-cols-[2fr_2fr_2fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-secondary/20 transition-colors">
                      {/* Staff Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar staff={staff} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{serviceCount} service{serviceCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="min-w-0">
                        <InlineTagPicker
                          tags={jobTitles}
                          selectedIds={staff.job_title_ids || []}
                          onSave={(ids) => handleJobTitleSave(staff, ids)}
                          onCreateTag={async (data) => {
                            const created = await base44.entities.JobTitle.create({ ...data, business_id: businessId });
                            loadTags();
                            return created;
                          }}
                          onDeleteTag={async (id) => {
                            await base44.entities.JobTitle.delete(id);
                            loadTags();
                          }}
                          placeholder="Search job titles..."
                        />
                      </div>

                      {/* Location */}
                      <div className="min-w-0">
                        {loc ? (
                          <div>
                            <p className="text-sm truncate">{loc.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{[loc.state, loc.country].filter(Boolean).join(', ')}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setSlideOver(staff)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => { setSlideOver(staff); }}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Schedule">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleDelete(staff.id)}
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

      {/* Job Titles Tab */}
      {tab === 'Job Titles' && (
        <JobTitlesTab
          jobTitles={jobTitles}
          businessId={businessId}
          onRefresh={loadTags}
          showForm={slideOver === '__jobtitle__'}
          onFormClose={() => setSlideOver(null)}
        />
      )}

      {/* Slide-over */}
      {slideOver && slideOver !== '__jobtitle__' && (
        <StaffSlideOver
          staff={slideOver === 'new' ? null : slideOver}
          businessId={businessId}
          services={services}
          jobTitles={jobTitles}
          locations={locations}
          onClose={() => setSlideOver(null)}
          onSave={() => { setSlideOver(null); load(); }}
          onRefreshTags={loadTags}
        />
      )}
    </div>
  );
}