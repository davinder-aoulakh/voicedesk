import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PRESET_COLORS = ['#8B5CF6','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6','#F97316'];

export default function CustomerTagsTab({ tags, businessId, onRefresh, showForm: showFormProp, onFormClose }) {
  const [showForm, setShowForm] = useState(showFormProp || false);
  const [name, setName]         = useState('');
  const [color, setColor]       = useState(PRESET_COLORS[0]);
  const [saving, setSaving]     = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.CustomerTag.create({ name: name.trim(), color, business_id: businessId });
    toast.success('Tag created');
    setName('');
    setColor(PRESET_COLORS[0]);
    setShowForm(false);
    onFormClose?.();
    onRefresh();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.CustomerTag.delete(id);
    toast.success('Tag deleted');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tags.length} tag{tags.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gradient-primary border-0 text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Customer Tag
        </Button>
      </div>

      {(showForm || showFormProp) && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
          <div>
            <Label>Tag Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. VIP, Repeat, Corporate..." className="mt-1.5" autoFocus />
          </div>
          <div>
            <Label className="block mb-2">Colour</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); onFormClose?.(); }}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving} className="gradient-primary border-0 text-white">
              {saving ? 'Creating…' : 'Create Tag'}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-syne font-semibold text-sm mb-0.5">Customer Tag Management</h3>
        <p className="text-xs text-muted-foreground mb-4">Create and manage customer tags that can be assigned to customers.</p>

        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No tags yet. Add one above.</p>
        ) : (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Available Customer Tags:</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag.id} className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ background: tag.color || '#8B5CF6' }}>
                  {tag.name}
                  <button onClick={() => handleDelete(tag.id)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded-full p-0.5 transition-all">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}