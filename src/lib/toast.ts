import { toast } from 'sonner';

// ── NOTIFY FACTORY — centralized toast factory ────────────────
// ask-sonner skill: all toast() calls go through here, never raw toast() in components
// master plan §3.7: full notify recipe catalog for Iron Gym

// Centralize navigation in the factory via a navigate ref
// Set this from your router component:  notify._setNavigate(navigate)
type NavigateFn = (path: string) => void;
let _navigate: NavigateFn = (path) => { window.location.href = path; };

export const notify = {
  // ── Internal: set the navigate function from router context
  _setNavigate(fn: NavigateFn) {
    _navigate = fn;
  },

  // ── Biometric hardware events ─────────────────────────────
  deviceOnline: () =>
    toast.success('K40 Online', {
      description: 'Fingerprint device connected.',
    }),

  deviceOffline: () =>
    toast.error('K40 Offline', {
      description: 'Biometric device disconnected. Switch to manual check-in.',
      duration: Infinity,   // persist until dismissed — critical hardware alert
      action: { label: 'Dismiss', onClick: () => {} },
    }),

  deviceSyncing: () =>
    toast.loading('Syncing device…'),

  // ── Check-in events ───────────────────────────────────────
  checkInSuccess: (name: string) =>
    toast.success(`${name} checked in`, {
      description: 'Access granted · Fingerprint verified',
      duration: 3000,
    }),

  checkInDenied: (name: string, reason: string, memberId?: string) =>
    toast.error(`Access Denied — ${name}`, {
      description: reason,
      action: memberId
        ? { label: 'Renew', onClick: () => _navigate(`/members/${memberId}`) }
        : undefined,
      duration: 6000,
    }),

  // ── Member management ─────────────────────────────────────
  memberAdded: (name: string) =>
    toast.success(`${name} added`, {
      description: 'Profile, subscription and payment recorded.',
    }),

  memberUpdated: (name: string) =>
    toast.success(`${name} updated`),

  memberDeleted: (name: string) =>
    toast.error(`${name} archived`, {
      description: 'Soft delete — can be restored.',
    }),

  // ── Subscription events ───────────────────────────────────
  subExpiring: (name: string, days: number, memberId?: string) =>
    toast.warning(
      `${name}'s membership expires in ${days} day${days === 1 ? '' : 's'}`,
      memberId
        ? { action: { label: 'Renew Now', onClick: () => _navigate(`/members/${memberId}`) } }
        : undefined,
    ),

  subRenewed: (name: string, plan: string) =>
    toast.success(`${name} renewed`, { description: plan }),

  subAdded: (name: string, plan: string) =>
    toast.success(`Subscription added for ${name}`, { description: plan }),

  // ── Payment events ────────────────────────────────────────
  paymentRecorded: (amount: number, method: string) =>
    toast.success(
      `₹${amount.toLocaleString('en-IN')} recorded`,
      { description: `Via ${method}` },
    ),

  // ── Network / offline ─────────────────────────────────────
  offline: () =>
    toast.error('You\'re offline', {
      description: 'Showing last available data. Reconnect to sync.',
      duration: Infinity,
      action: { label: 'Dismiss', onClick: () => {} },
    }),

  online: () =>
    toast.success('Back online', {
      description: 'Connected. Data is syncing.',
      duration: 3000,
    }),

  // ── Generic utilities ─────────────────────────────────────
  error: (msg: string) =>
    toast.error(msg),

  success: (msg: string, description?: string) =>
    toast.success(msg, description ? { description } : undefined),

  loading: (msg: string): string | number =>
    toast.loading(msg),

  update: (id: string | number, type: 'success' | 'error', msg: string, description?: string) =>
    toast[type](msg, { id, ...(description ? { description } : {}) }),

  dismiss: (id?: string | number) =>
    id ? toast.dismiss(id) : toast.dismiss(),
};
