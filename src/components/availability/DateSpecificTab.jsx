import { useState } from 'react';
import { Calendar, Plus, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const TIMES = [];
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    TIMES.push({ value: `${hh}:${mm}`, label: `${displayH}:${mm} ${ampm}` });
  }
}

function OverrideModal({ override, onSave, onClose }) {
  const isNew = !override;
  const [form, setForm] = useState(override || {
    date: '', label: '', type: 'open', start: '09:00', end: '17:00'
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-syne">{isNew ? 'Add Date Override' : 'Edit Date Override'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Date *</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>Label (optional)</Label>
            <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Staff Training Day" className="mt-1.5" />
          </div>
          <div className="space-y-2">
            <Label>Hours</Label>
            <label className="flex items-center gap-2 cursor-pointer mt-1.5">
              <input type="radio" checked={form.type === 'open'} onChange={() => setForm(f => ({ ...f, type: 'open' }))} className="accent-primary" />
              <span className="text-sm">Open with custom hours</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={form.type === 'closed'} onChange={() => setForm(f => ({ ...f, type: 'closed' }))} className="accent-primary" />
              <span className="text-sm">Closed all day</span>
            </label>
          </div>
          {form.type === 'open' && (
            <div className="flex items-center gap-2">
              <Select value={form.start} onValueChange={v => setForm(f => ({ ...f, start: v }))}>
                <SelectTrigger className="w-32 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {TIMES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">–</span>
              <Select value={form.end} onValueChange={v => setForm(f => ({ ...f, end: v }))}>
                <SelectTrigger className="w-32 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {TIMES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => form.date && onSave(form)} className="gradient-primary border-0 text-white">
            {isNew ? 'Add Override' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DateSpecificTab({ overrides, setOverrides }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);

  const handleSave = (form) => {
    if (editItem !== null) {
      setOverrides(prev => prev.map((o, i) => i === editItem ? form : o));
    } else {
      setOverrides(prev => [...prev, form]);
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handleEdit = (idx) => { setEditItem(idx); setShowModal(true); };
  const handleDelete = (idx) => setOverrides(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne font-semibold text-base">Date-specific hours</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Adjust hours for specific days</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-accent transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}
            className="gap-1.5 border-0 text-white" style={{ background: '#6C3BFF' }}>
            <Plus className="w-3.5 h-3.5" /> Hours
          </Button>
        </div>
      </div>

      {overrides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-sm">No date-specific hours set</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
            Add date overrides to adjust your availability on specific days, like holidays or special events.
          </p>
          <Button size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}
            className="gap-1.5 border-0 text-white" style={{ background: '#6C3BFF' }}>
            <Plus className="w-3.5 h-3.5" /> Add Date Override
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {overrides.map((o, idx) => (
            <div key={idx} className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{o.date}</p>
                <p className="text-xs text-muted-foreground">
                  {o.label && <span>{o.label} · </span>}
                  {o.type === 'closed' ? 'Closed all day' : `${o.start} – ${o.end}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleEdit(idx)} className="p-1.5 rounded hover:bg-accent transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(idx)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <OverrideModal
          override={editItem !== null ? overrides[editItem] : null}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}