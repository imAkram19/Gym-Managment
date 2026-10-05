import React, { useState, useEffect } from 'react';
import { Fingerprint, WifiOff, LogOut, AlertCircle, X, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { ClockDisplay } from './ClockDisplay';
import { NotifBell } from './NotifBell';
import { CommandBar } from './CommandBar';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';
import { getBiometricDevices } from '../../../lib/api/biometrics';
import type { BiometricDevice } from '../../../types';

// ── TOPBAR V2 — thin wrapper, delegates to subcomponents ──────
// master plan §2.1: extracted NotifBell + ClockDisplay, no more 22KB monolith
// backdrop-blur only on fixed/sticky — performance guardrail from both skills

function formatLastPing(lastPing: string | undefined): string {
  if (!lastPing) return 'Never';
  const diffMs = Date.now() - new Date(lastPing).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export const TopBar: React.FC = () => {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [, setTick] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  // Ctrl+K or Cmd+K shortcut
  useKeyboardShortcut('k', () => setCommandBarOpen((prev) => !prev), {
    ctrlOrCmd: true,
    ignoreInputs: false,
  });

  // Poll devices every 60s
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getBiometricDevices();
        setDevices(data);
      } catch { /* silently fail */ }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Refresh "X min ago" display every minute
  useEffect(() => {
    const tick = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(tick);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('irongym_logged_in');
    localStorage.removeItem('irongym_owner_access');
    window.location.reload();
  };

  // Dedup devices
  const OFFLINE_STALE = 10 * 60 * 1000;
  const uniqueDevicesMap = new Map<string, BiometricDevice>();
  for (const d of devices) {
    const key = `${d.name}-${d.ipAddress}-${d.port}`;
    const existing = uniqueDevicesMap.get(key);
    if (!existing) {
      uniqueDevicesMap.set(key, d);
    } else {
      const newTime = d.lastPing ? new Date(d.lastPing).getTime() : 0;
      const existTime = existing.lastPing ? new Date(existing.lastPing).getTime() : 0;
      if (d.status === 'online' && existing.status !== 'online') {
        uniqueDevicesMap.set(key, d);
      } else if (newTime > existTime) {
        uniqueDevicesMap.set(key, d);
      }
    }
  }
  const uniqueDevices = Array.from(uniqueDevicesMap.values());
  const offlineDevices = uniqueDevices.filter(d => {
    if (d.status === 'offline') return true;
    if (!d.lastPing) return true;
    return Date.now() - new Date(d.lastPing).getTime() > OFFLINE_STALE;
  });
  const primaryDevice = uniqueDevices.find(d => !offlineDevices.some(o => o.id === d.id)) ?? uniqueDevices[0] ?? null;
  const primaryIsOffline = primaryDevice ? offlineDevices.some(d => d.id === primaryDevice.id) : false;

  return (
    <>
      {/* glass-fixed: backdrop-blur ONLY on sticky elements — performance guardrail */}
      <header
        className="sticky top-0 z-20 glass-fixed topbar-safe"
        style={{ height: 'var(--topbar-height)' }}
      >
        <div className="h-full flex items-center justify-between px-4 lg:px-6 gap-3">

          {/* ── LEFT: device status pill ──── */}
          <div className="flex items-center gap-3">
            {/* Device Status Pill */}
            <DeviceStatusPill
              devices={uniqueDevices}
              primaryDevice={primaryDevice}
              primaryIsOffline={primaryIsOffline}
              offlineCount={offlineDevices.length}
              onOfflineClick={() => setShowTroubleshooting(true)}
              formatLastPing={formatLastPing}
            />
          </div>

          {/* ── CENTER: live clock ───────────────────────── */}
          <div className="flex-1 flex justify-center">
            <ClockDisplay />
          </div>

          {/* ── RIGHT: command search + notifications + logout ────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setCommandBarOpen(true)}
              className={clsx(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-md)]',
                'bg-[var(--surface-ground)] hover:bg-slate-200/70 border border-[var(--border-subtle)]',
                'text-xs text-[var(--text-secondary)] transition-colors duration-100 cursor-pointer'
              )}
              title="Quick Search (Ctrl + K)"
              aria-label="Search members or actions (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="hidden xl:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono text-[var(--text-muted)] bg-white border border-[var(--border-dim)] shadow-2xs">
                ⌘K
              </kbd>
            </button>

            <NotifBell />

            <div className="w-px h-5 bg-[var(--border-dim)] mx-0.5 sm:mx-1" aria-hidden />

            <button
              onClick={handleLogout}
              className={clsx(
                'w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center',
                'text-[var(--text-secondary)] hover:bg-red-50 hover:text-[var(--danger)]',
                'transition-colors duration-100',
              )}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="w-[18px] h-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* ── COMMAND SEARCH MODAL ──────────────────────────── */}
      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
      />

      {/* ── TROUBLESHOOTING MODAL ─────────────────────────── */}
      {showTroubleshooting && (
        <TroubleshootingModal onClose={() => setShowTroubleshooting(false)} />
      )}
    </>
  );
};

// ── Device Status Pill ─────────────────────────────────────────
interface DeviceStatusPillProps {
  devices: BiometricDevice[];
  primaryDevice: BiometricDevice | null;
  primaryIsOffline: boolean;
  offlineCount: number;
  onOfflineClick: () => void;
  formatLastPing: (s: string | undefined) => string;
}

function DeviceStatusPill({ devices, primaryDevice, primaryIsOffline, offlineCount, onOfflineClick, formatLastPing }: DeviceStatusPillProps) {
  if (devices.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--status-inactive-bg)] border border-[var(--border-dim)]">
        <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" aria-hidden />
        <span className="text-xs font-semibold text-[var(--text-muted)] hidden sm:block">Checking device…</span>
      </div>
    );
  }

  if (primaryIsOffline) {
    return (
      <button
        onClick={onOfflineClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--danger-light)] border border-[var(--danger-border)] hover:opacity-80 transition-opacity"
        title="Click to troubleshoot"
      >
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--danger)' }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--danger)' }} />
        </span>
        <WifiOff className="w-3.5 h-3.5 text-[var(--danger)] flex-shrink-0" aria-hidden />
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[10px] text-[var(--danger)] opacity-70 font-medium">
            {offlineCount > 1 ? `${offlineCount} devices offline` : 'Offline · Tap to fix'}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--status-online-bg)] border border-[#86efac]">
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--status-online)]" />
      </span>
      <Fingerprint className="w-3.5 h-3.5 text-[var(--status-online)] flex-shrink-0" aria-hidden />
      <div className="hidden sm:flex flex-col items-start leading-none">
        <span className="text-[11px] font-bold text-[var(--status-online)]">{primaryDevice?.name ?? 'K40'}</span>
        <span className="text-[10px] text-[var(--status-online)] opacity-70 font-medium">
          Online · {formatLastPing(primaryDevice?.lastPing)}
        </span>
      </div>
    </div>
  );
}

// ── Troubleshooting Modal ──────────────────────────────────────
function TroubleshootingModal({ onClose }: { onClose: () => void }) {
  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const steps = [
    {
      title: 'Check Hardware Power & Screen',
      desc: 'Verify the ZKTeco K40 device is powered ON. If the screen is black, check the power adapter plug.',
    },
    {
      title: 'Verify Physical Network Cable',
      desc: 'Ensure the Ethernet cable is securely plugged into both the K40 and the router. Look for a flashing green link light on the ethernet port.',
    },
    {
      title: 'Verify local Sync Agent status on PC',
      desc: 'On the receptionist\'s PC, open PowerShell and run:',
      code: 'pm2 status',
      code2: 'pm2 start zkteco-sync-agent',
    },
    {
      title: 'Test Local Ping Connection',
      desc: 'On the PC, run ping 192.168.1.5. Request timeouts mean the router has blocked or reassigned the device IP.',
    },
    {
      title: 'Inspect Real-time Error Logs',
      desc: 'Run pm2 logs zkteco-sync-agent or check sync-agent/logs/errors.log.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(34,45,66,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Biometric Device Troubleshooting"
    >
      <div
        className="bg-white rounded-[var(--radius-xl)] overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-slide-up"
        style={{ boxShadow: 'var(--shadow-float)' }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ background: 'var(--danger)' }}>
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="w-5 h-5" aria-hidden />
            <h3 className="font-bold text-base">Biometric Device Troubleshooting</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close troubleshooting guide"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto scroll-content space-y-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            If the K40 Fingerprint reader shows "offline" status, follow these steps:
          </p>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-ground)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{step.desc}</p>
                  {step.code && (
                    <code className="block mt-1.5 bg-[var(--surface-ground)] text-[var(--danger)] px-2 py-1 rounded font-mono text-[11px]">
                      {step.code}
                    </code>
                  )}
                  {step.code2 && (
                    <code className="block mt-1 bg-[var(--surface-ground)] text-[var(--danger)] px-2 py-1 rounded font-mono text-[11px]">
                      {step.code2}
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-dim)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
