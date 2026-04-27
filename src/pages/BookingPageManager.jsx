import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link2, Copy, Eye, ToggleLeft, ToggleRight, Check, Globe, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function BookingPageManager() {
  const [business, setBusiness] = useState(null);
  const [slug, setSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const businesses = await base44.entities.Business.filter({ owner_id: user.id });
      if (!businesses.length) { setLoading(false); return; }
      const biz = businesses[0];
      setBusiness(biz);
      const derivedSlug = biz.booking_slug || toSlug(biz.name || 'my-business');
      setSlug(derivedSlug);
      setSlugInput(derivedSlug);
      setEnabled(biz.booking_page_enabled !== false);
      setLoading(false);
    };
    load();
  }, []);

  const publicUrl = `${window.location.origin}/book/${slug}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="700" style="border:none;border-radius:12px;" title="Book ${business?.name || ''}"></iframe>`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
    toast.success('Embed code copied!');
  };

  const validateSlug = (val) => {
    if (!val) return 'Slug cannot be empty';
    if (!/^[a-z0-9-]+$/.test(val)) return 'Only lowercase letters, numbers, and hyphens';
    if (val.length < 3) return 'Must be at least 3 characters';
    return '';
  };

  const saveSlug = async () => {
    const err = validateSlug(slugInput);
    if (err) { setSlugError(err); return; }
    setSlugSaving(true);
    // Check uniqueness
    const existing = await base44.entities.Business.filter({ booking_slug: slugInput });
    if (existing.some(b => b.id !== business.id)) {
      setSlugError('This slug is already taken. Try another.');
      setSlugSaving(false);
      return;
    }
    await base44.entities.Business.update(business.id, { booking_slug: slugInput });
    setSlug(slugInput);
    setSlugEditing(false);
    setSlugError('');
    toast.success('Booking page URL updated!');
    setSlugSaving(false);
  };

  const toggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    await base44.entities.Business.update(business.id, { booking_page_enabled: next });
    toast.success(next ? 'Booking page enabled' : 'Booking page disabled');
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-syne font-bold">Online Booking Page</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your branded public booking link for customers</p>
        </div>
        {/* Enable / disable toggle */}
        <button onClick={toggleEnabled} className="flex items-center gap-2 focus:outline-none group">
          {enabled
            ? <ToggleRight className="w-10 h-10 text-success transition-colors" />
            : <ToggleLeft className="w-10 h-10 text-muted-foreground transition-colors" />}
          <span className={`text-sm font-medium ${enabled ? 'text-success' : 'text-muted-foreground'}`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Public URL card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Your Booking Link</h3>
          </div>

          {/* Slug editor */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Booking page slug</Label>
            {slugEditing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">{window.location.origin}/book/</span>
                  <Input
                    value={slugInput}
                    onChange={e => { setSlugInput(toSlug(e.target.value)); setSlugError(''); }}
                    className="flex-1"
                    autoFocus
                  />
                </div>
                {slugError && <p className="text-xs text-destructive">{slugError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveSlug} disabled={slugSaving} className="gradient-primary border-0 text-white gap-1.5">
                    {slugSaving ? 'Saving…' : <><Check className="w-3.5 h-3.5" /> Save</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSlugEditing(false); setSlugInput(slug); setSlugError(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg text-sm font-mono">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{window.location.origin}/book/</span>
                  <span className="text-foreground font-semibold">{slug}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSlugEditing(true)}>Edit</Button>
              </div>
            )}
          </div>

          {/* Copy + Open buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={copyUrl} variant="outline" size="sm" className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Open Page
              </Button>
            </a>
          </div>
        </div>

        {/* Preview pane */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-secondary/30">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Preview</span>
            <span className="text-xs text-muted-foreground ml-auto">{publicUrl}</span>
          </div>
          <div className="p-4 bg-secondary/10">
            <div className="rounded-xl overflow-hidden border border-border bg-background shadow-lg" style={{ height: 480 }}>
              <iframe
                src={publicUrl}
                title="Booking Page Preview"
                className="w-full h-full"
                style={{ border: 'none', pointerEvents: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Embed widget */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Embed on Your Website</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Paste this code anywhere on your site to embed the booking form.</p>
          <div className="relative bg-secondary/60 rounded-xl p-4 font-mono text-xs text-foreground/80 break-all leading-relaxed">
            {embedCode}
            <button
              onClick={copyEmbed}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-background border border-border hover:bg-accent transition-colors"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}