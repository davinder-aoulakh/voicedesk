import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function TextEditorModal({ card, displayName, onSave, onClose }) {
  const [content, setContent] = useState(card?.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(content);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-syne">Edit — {displayName}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="min-h-[280px] resize-none text-sm font-mono mt-2"
          placeholder="Enter content here…"
        />
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? 'Publishing…' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}