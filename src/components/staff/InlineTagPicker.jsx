import { useState, useRef, useEffect } from 'react';
import { Search, Check, Plus, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const PRESET_COLORS = ['#8B5CF6','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6','#F97316'];

/**
 * InlineTagPicker — reusable multi-select tag picker.
 *
 * Usage modes:
 *   1. Controlled external callbacks: pass onSave / onCreateTag / onDeleteTag
 *   2. Self-managed via entityName + businessId + onChange:
 *      Automatically calls base44.entities[entityName].create/delete and calls onChange(newIds)
 */
export default function InlineTagPicker({
  tags: tags,
  selectedIds,
  onSave,
  onChange,        // simpler callback: receives new id array immediately on toggle
  onCreateTag,
  onEditTag,
  onDeleteTag,
  entityName,      // e.g. 'CustomerTag' — used for auto-create/delete when no callbacks provided
  businessId,
  placeholder = 'Search tags...',
  buttonLabel,
}) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const [draft, setDraft]     = useState(selectedIds || []);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]  = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [menuOpen, setMenuOpen] = useState(null); // tag id
  const ref = useRef(null);

  // Sync draft when selectedIds changes from outside
  useEffect(() => { setDraft(selectedIds || []); }, [selectedIds?.join(',')]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setMenuOpen(null); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const toggleTag = (id) => {
    setDraft(d => d.includes(id) ? d.filter(x => x !== id) : [...d, id]);
  };

  const handleSave = () => {
    if (onSave) onSave(draft);
    if (onChange) onChange(draft);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (onCreateTag) {
      await onCreateTag({ name: newName.trim(), color: newColor });
    } else if (entityName && businessId) {
      const created = await base44.entities[entityName].create({ name: newName.trim(), color: newColor, business_id: businessId });
      // add to tags list locally
      tags.push(created); // mutate is fine here since parent re-renders via onChange
      const newIds = [...draft, created.id];
      setDraft(newIds);
      onChange?.(newIds);
    }
    setCreating(false);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
  };

  const handleDelete = async (e, tag) => {
    e.stopPropagation();
    if (onDeleteTag) {
      await onDeleteTag(tag.id);
    } else if (entityName) {
      await base44.entities[entityName].delete(tag.id);
    }
    setDraft(d => d.filter(x => x !== tag.id));
    onChange?.(draft.filter(x => x !== tag.id));
    setMenuOpen(null);
  };

  const selectedTags = tags.filter(t => (selectedIds || []).includes(t.id));

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger: show selected pills + add button */}
      <div className="flex items-center flex-wrap gap-1">
        {selectedTags.map(t => (
          <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ background: t.color || '#8B5CF6' }}>
            {t.name}
          </span>
        ))}
        <button onClick={() => setOpen(o => !o)}
          className="w-5 h-5 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={placeholder} className="pl-7 h-7 text-xs" />
            </div>
          </div>

          {/* Tag list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No tags found</p>
            )}
            {filtered.map(t => {
              const selected = draft.includes(t.id);
              return (
                <div key={t.id}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${selected ? 'bg-primary/5' : ''}`}
                  onClick={() => toggleTag(t.id)}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {selected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color || '#8B5CF6' }} />
                  <span className="text-xs flex-1 truncate">{t.name}</span>
                  <div className="relative">
                    <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                      className="p-0.5 rounded hover:bg-secondary transition-colors">
                      <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {menuOpen === t.id && (
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 w-32 py-1">
                        <button onClick={e => { e.stopPropagation(); onEditTag && onEditTag(t); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={e => handleDelete(e, t)}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create new */}
          <div className="border-t border-border p-2">
            {creating ? (
              <div className="space-y-2">
                <Input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Tag name..." className="h-7 text-xs" autoFocus />
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleCreate} className="flex-1 h-7 text-xs gradient-primary border-0 text-white">Create</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)} className="h-7 text-xs px-2"><X className="w-3 h-3" /></Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 w-full text-xs text-primary hover:bg-accent px-2 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3 h-3" /> Create New Tag
              </button>
            )}
          </div>

          {/* Save */}
          {!creating && (
            <div className="border-t border-border p-2">
              <Button size="sm" onClick={handleSave} className="w-full h-7 text-xs gradient-primary border-0 text-white">
                ✓ Save ({draft.length} selected)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}