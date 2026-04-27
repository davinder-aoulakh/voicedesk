import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Camera, Trash2, Pencil, Check, X, Plus, Shield,
  Mail, Lock, Chrome, AlertTriangle, User, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6C3BFF','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6','#8B5CF6'];
function avatarColor(name = '') {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-syne font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Account() {
  const { user: authUser, checkUserAuth } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Personal info editing
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState({ first: '', last: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Email
  const [addingEmail, setAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const parts = (u.full_name || '').split(' ');
      setInfoDraft({ first: parts[0] || '', last: parts.slice(1).join(' ') || '' });
      setLoading(false);
    };
    load();
  }, []);

  // ── Photo ──────────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      setUser(u => ({ ...u, photo_url: file_url }));
      toast.success('Photo updated');
    } catch {
      toast.error('Upload failed');
    }
    setPhotoUploading(false);
  };

  const handleRemovePhoto = async () => {
    await base44.auth.updateMe({ photo_url: null });
    setUser(u => ({ ...u, photo_url: null }));
    toast.success('Photo removed');
  };

  // ── Personal Info ──────────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    setSavingInfo(true);
    const full_name = [infoDraft.first, infoDraft.last].filter(Boolean).join(' ');
    await base44.auth.updateMe({ full_name });
    setUser(u => ({ ...u, full_name }));
    setEditingInfo(false);
    setSavingInfo(false);
    toast.success('Profile updated');
  };

  // ── Password ───────────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!pwForm.next) return toast.error('New password is required');
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.next.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPw(true);
    try {
      await base44.auth.updateMe({ password: pwForm.next });
      toast.success('Password updated');
      setShowPasswordForm(false);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch {
      toast.error('Failed to update password');
    }
    setSavingPw(false);
  };

  if (loading || !user) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const fullName = user.full_name || 'User';
  const email = user.email || '';
  const memberSince = user.created_date
    ? format(new Date(user.created_date), 'MMMM yyyy')
    : 'Unknown';
  const nameParts = fullName.split(' ');
  const firstName = infoDraft.first || nameParts[0] || '';
  const lastName = infoDraft.last || nameParts.slice(1).join(' ') || '';

  // Detect social login (no password) — heuristic: google oauth users
  const hasSocialLogin = !!(user.google_id || user.oauth_provider);
  const hasPassword = !!user.has_password;
  const googleConnected = !!(user.google_id || user.oauth_provider === 'google');
  const canDisconnectGoogle = hasPassword || (/* other providers */ false);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-syne font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile, security, and connected accounts</p>
      </div>

      <div className="space-y-6">

        {/* ── (1) Profile Header Card ── */}
        <Card>
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.photo_url ? (
                <img src={user.photo_url} alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-border"
                  style={{ background: avatarColor(fullName) }}>
                  {initials(fullName)}
                </div>
              )}
              {photoUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Name / Email / Since */}
            <div className="flex-1 min-w-0">
              <p className="font-syne font-bold text-xl">{fullName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
              <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={photoUploading}>
                  <Camera className="w-3.5 h-3.5" /> Change photo
                </Button>
                {user.photo_url && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={handleRemovePhoto}>
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </Button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>
          </div>
        </Card>

        {/* ── (2) Personal Information ── */}
        <Card>
          <CardHeader
            title="Personal Information"
            subtitle="Your personal details used across the platform"
            action={
              !editingInfo
                ? <Button size="sm" variant="outline" onClick={() => setEditingInfo(true)} className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                : <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingInfo(false); const p = fullName.split(' '); setInfoDraft({ first: p[0]||'', last: p.slice(1).join(' ')||'' }); }}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveInfo} disabled={savingInfo} className="gradient-primary border-0 text-white">
                      <Check className="w-3.5 h-3.5 mr-1" /> {savingInfo ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              {editingInfo
                ? <Input value={infoDraft.first} onChange={e => setInfoDraft(d => ({ ...d, first: e.target.value }))} className="mt-1.5" autoFocus />
                : <p className="mt-1.5 text-sm py-2 px-3 bg-secondary/50 rounded-md">{firstName || '—'}</p>
              }
            </div>
            <div>
              <Label>Last Name</Label>
              {editingInfo
                ? <Input value={infoDraft.last} onChange={e => setInfoDraft(d => ({ ...d, last: e.target.value }))} className="mt-1.5" />
                : <p className="mt-1.5 text-sm py-2 px-3 bg-secondary/50 rounded-md">{lastName || '—'}</p>
              }
            </div>
          </div>
        </Card>

        {/* ── (3) Email Addresses ── */}
        <Card>
          <CardHeader
            title="Email Addresses"
            subtitle="Manage email addresses associated with your account"
            action={
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddingEmail(v => !v)}>
                <Plus className="w-3.5 h-3.5" /> Add email
              </Button>
            }
          />

          {/* Primary email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-secondary/40 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold bg-success/10 text-success rounded-full">✓ Verified</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">Primary</span>
              </div>
            </div>
          </div>

          {/* Add email form */}
          {addingEmail && (
            <div className="mt-3 flex gap-2">
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="Enter new email address" className="flex-1" autoFocus />
              <Button size="sm" className="gradient-primary border-0 text-white shrink-0"
                onClick={() => { toast.info('Email verification sent to ' + newEmail); setAddingEmail(false); setNewEmail(''); }}>
                Send Verification
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingEmail(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* ── (4) Password ── */}
        <Card>
          <CardHeader
            title="Password"
            action={
              !showPasswordForm && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowPasswordForm(true)}>
                  <KeyRound className="w-3.5 h-3.5" /> {hasPassword ? 'Change password' : 'Set password'}
                </Button>
              )
            }
          />

          {!showPasswordForm ? (
            <div className="flex items-center gap-3 py-2 px-3 bg-secondary/40 rounded-xl">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              {hasPassword
                ? <span className="text-sm tracking-[0.3em] text-muted-foreground">●●●●●●●●</span>
                : <span className="text-sm text-muted-foreground">●●●●●●●● <span className="tracking-normal">No password set (using social login)</span></span>
              }
            </div>
          ) : (
            <div className="space-y-3">
              {hasPassword && (
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    className="mt-1.5" placeholder="Enter current password" autoFocus />
                </div>
              )}
              <div>
                <Label>New Password</Label>
                <Input type="password" value={pwForm.next}
                  onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                  className="mt-1.5" placeholder="At least 8 characters" />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  className="mt-1.5" placeholder="Re-enter new password" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { setShowPasswordForm(false); setPwForm({ current: '', next: '', confirm: '' }); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSavePassword} disabled={savingPw} className="gradient-primary border-0 text-white">
                  {savingPw ? 'Saving…' : hasPassword ? 'Update Password' : 'Set Password'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── (5) Connected Accounts ── */}
        <Card>
          <CardHeader
            title="Connected Accounts"
            subtitle="Connect your social accounts for easier sign-in"
          />

          {/* Google */}
          <div className="flex items-center justify-between py-3 px-4 bg-secondary/40 rounded-xl">
            <div className="flex items-center gap-3">
              {/* Google logo SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <p className="text-sm font-medium">Google</p>
                {googleConnected && (
                  <p className="text-xs text-muted-foreground">{email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {googleConnected ? (
                <>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-success/10 text-success rounded-full">✓ Connected</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                    disabled={!canDisconnectGoogle}
                    onClick={() => {
                      if (!canDisconnectGoogle) return;
                      toast.info('Disconnect Google from account settings');
                    }}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" className="gradient-primary border-0 text-white text-xs"
                  onClick={() => toast.info('Redirecting to Google sign-in…')}>
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* Warning if Google is only sign-in method */}
          {googleConnected && !canDisconnectGoogle && (
            <div className="mt-3 flex items-start gap-2.5 p-3 bg-warning/10 border border-warning/30 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-warning-foreground text-xs leading-relaxed">
                Google is your only sign-in method. Set a password first before disconnecting.
              </p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}