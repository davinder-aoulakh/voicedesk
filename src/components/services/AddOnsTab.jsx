import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EMPTY_ADDON = { name: '', type: 'fixed', amount: 0, required: false };

export default function AddOnsTab({ addOns, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState({ ...EMPTY_ADDON });

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    onChange([...addOns, { ...draft }]);
    setDraft({ ...EMPTY_ADDON });
    setAdding(false);
  };

  const handleDelete = (idx) => onChange(addOns.filter((_, i) => i !== idx));

  const handleToggleRequired = (idx) => {
    const next = addOns.map((a, i) => i === idx ? { ...a, required: !a.required } : a);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-syne font-semibold text-sm">Add-ons</h3>
        <Button size="sm" onClick={() => setAdding(true)} className="gradient-primary border-0 text-white gap-1 h-7 text-xs">
          <Plus className="w-3 h-3" /> Add Add-on
        </Button>
      </div>

      {adding && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
          <div><Label className="text-xs">Name *</Label><Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Deep conditioning" className="mt-1 text-sm h-8" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
                className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="fixed">Fixed ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Amount</Label>
              <Input type="number" min="0" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: +e.target.value }))} className="mt-1 text-sm h-8" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={draft.required} onChange={e => setDraft(d => ({ ...d, required: e.target.checked }))} className="accent-primary" />
            <span className="text-sm">Required</span>
          </label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleAdd} className="gradient-primary border-0 text-white h-7 text-xs">Add</Button>
          </div>
        </div>
      )}

      {addOns.length === 0 && !adding ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No add-ons yet. Click '+ Add Add-on' to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {addOns.map((addon, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{addon.name}</p>
                <p className="text-xs text-muted-foreground">
                  {addon.type === 'fixed' ? `$${Number(addon.amount).toFixed(2)}` : `${addon.amount}%`}
                  {addon.required && ' · Required'}
                </p>
              </div>
              <button onClick={() => handleToggleRequired(idx)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  addon.required ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground'
                }`}>
                {addon.required ? 'Required' : 'Optional'}
              </button>
              <button onClick={() => handleDelete(idx)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}