import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

export default function UrlIngestionModal({ displayName, onSave, onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Fetch the content from this URL and extract all meaningful text content in a clean, readable format: ${url}`,
        add_context_from_internet: true,
      });
      await onSave(typeof res === 'string' ? res : JSON.stringify(res));
    } catch (e) {
      setError('Failed to fetch URL: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-syne">Add from URL — {displayName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label>Page URL</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/menu" className="mt-1.5" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleFetch} disabled={loading || !url} className="gradient-primary border-0 text-white">
            {loading ? 'Fetching…' : 'Fetch & Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}