import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function PreviewModal({ card, displayName, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-syne">{displayName} — Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-2">
          {card.content ? (
            <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-inter bg-secondary/30 rounded-xl p-4">
              {card.content}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">No content published yet.</p>
          )}
        </div>
        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}