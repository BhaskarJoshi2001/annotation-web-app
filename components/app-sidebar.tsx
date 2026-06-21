'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from './theme-provider';

type NavKey = 'projects' | 'datasets' | 'models' | 'exports' | 'team' | 'settings';

interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  group?: boolean;
  groupLabel?: string;
}

const NAV: NavItem[] = [
  {
    key: 'projects', label: 'Projects', href: '/dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    key: 'datasets', label: 'Datasets', href: '/dataset',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  },
  {
    key: 'models', label: 'Models', href: '/models', badge: 'beta',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" /></svg>,
  },
  {
    key: 'exports', label: 'Exports', href: '/exports',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>,
  },
  {
    key: 'team', label: 'Team', href: '/team', group: true, groupLabel: 'Workspace',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></svg>,
  },
  {
    key: 'settings', label: 'Settings', href: '/settings',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
];

interface SbToast {
  id: number;
  title: string;
  body: string;
  show: boolean;
}

function fmtK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

type UsageState = 'ok' | 'normal' | 'warn' | 'limit';

function getUsageState(used: number, limit: number): UsageState {
  const r = limit > 0 ? used / limit : 0;
  if (r >= 1) return 'limit';
  if (r >= 0.8) return 'warn';
  if (r >= 0.5) return 'normal';
  return 'ok';
}

export function AppSidebar({
  active,
  showUsage = false,
  dataUsed = 22600,
  dataLimit = 25000,
  daysLeft = 8,
}: {
  active: NavKey;
  showUsage?: boolean;
  dataUsed?: number;
  dataLimit?: number;
  daysLeft?: number;
}) {
  const { mode, setMode } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [seats, setSeats] = useState(5);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [toasts, setToasts] = useState<SbToast[]>([]);
  const nextId = useRef(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const userboxRef = useRef<HTMLButtonElement>(null);

  const uState = getUsageState(dataUsed, dataLimit);
  const pct = Math.min(100, Math.round((dataUsed / dataLimit) * 100));
  const usageCls = uState === 'warn' ? ' is-warn' : uState === 'limit' ? ' is-limit' : '';

  function addToast(title: string, body: string) {
    const id = ++nextId.current;
    setToasts(t => [...t, { id, title, body, show: false }]);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, show: true } : x));
    }));
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, show: false } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 400);
    }, 4200);
  }

  useEffect(() => {
    if (!profileOpen) return;
    function onDown(e: MouseEvent) {
      if (
        profileRef.current && !profileRef.current.contains(e.target as Node) &&
        userboxRef.current && !userboxRef.current.contains(e.target as Node)
      ) setProfileOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setProfileOpen(false); userboxRef.current?.focus(); }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!upgradeOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !upgradeBusy) setUpgradeOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [upgradeOpen, upgradeBusy]);

  function openUpgrade() {
    setProfileOpen(false);
    setUpgradeOpen(true);
  }

  function doUpgrade() {
    if (upgradeBusy) return;
    setUpgradeBusy(true);
    setTimeout(() => {
      setUpgradeBusy(false);
      setUpgradeOpen(false);
      addToast('Upgraded to Pro', `${seats} seat${seats !== 1 ? 's' : ''} activated — $${seats * 25}/mo starting today.`);
    }, 1400);
  }

  return (
    <aside className="app-sidebar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)" />
          <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="var(--on-primary)" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round" />
          <rect x="6" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)" /><rect x="25" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
          <rect x="6" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)" /><rect x="25" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
        </svg>
        <div className="brand-name"><b>Annotation Studio</b><span>Acme Vision</span></div>
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <span key={item.key} style={{ display: 'contents' }}>
            {item.group && <div className="nav-group">{item.groupLabel}</div>}
            <a href={item.href} className={active === item.key ? 'active' : undefined}>
              {item.icon}
              {item.label}
              {item.badge && <span className="badge badge-secondary">{item.badge}</span>}
            </a>
          </span>
        ))}
      </nav>

      <div className="sidebar-foot">
        {showUsage && (
          <div className={`usage${usageCls}`}>
            <div className="urow">
              <span className="t-caption usage-label">
                {(uState === 'warn' || uState === 'limit') && (
                  <svg className="warn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {fmtK(dataUsed)} / {fmtK(dataLimit)}
                {uState === 'limit'
                  ? ' · Limit reached'
                  : uState === 'warn'
                  ? ` · ${daysLeft}d left`
                  : ' · Images this month'}
              </span>
            </div>
            <div className="progress"><div className="bar" style={{ width: `${pct}%` }} /></div>
            <button
              className={`btn btn-sm btn-block${uState === 'limit' ? ' btn-destructive' : uState === 'ok' ? ' btn-ghost' : ' btn-tonal'}`}
              style={{ marginTop: 12 }}
              onClick={openUpgrade}
            >
              Upgrade plan
            </button>
          </div>
        )}

        {/* Profile popover — rendered above the userbox */}
        {profileOpen && (
          <div className="profile-popover" ref={profileRef} role="dialog" aria-label="Account menu">
            <div className="pp-header">
              <span className="avatar md" style={{ background: 'var(--blue-500)', color: '#fff' }}>BJ</span>
              <div className="pp-meta">
                <b>Bhaskar Joshi</b>
                <span>bj8212553@gmail.com</span>
                <span className="pp-role">Owner</span>
              </div>
            </div>

            <div className="pp-sep" />

            <div className="pp-theme-row">
              <span>Theme</span>
              <div className="pp-theme-seg">
                {([['light', 'Light'], ['system', 'Auto'], ['dark', 'Dark']] as const).map(([v, label]) => (
                  <button key={v} className={mode === v ? 'sel' : ''} onClick={() => setMode(v)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-sep" />

            <a href="/settings" className="pp-item" onClick={() => setProfileOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </a>
            <a href="#" className="pp-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Documentation
            </a>
            <a href="#" className="pp-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Send feedback
            </a>

            <div className="pp-sep" />

            <a href="/landing" className="pp-item pp-signout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </a>
          </div>
        )}

        <button
          ref={userboxRef}
          className="userbox"
          onClick={() => setProfileOpen(p => !p)}
          aria-expanded={profileOpen}
          aria-haspopup="dialog"
        >
          <span className="avatar md" style={{ background: 'var(--blue-500)', color: '#fff' }}>BJ</span>
          <div className="meta"><b>Bhaskar Joshi</b><span>bj8212553@gmail.com</span></div>
          <svg className={`chevron${profileOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 9l4 4 4-4" />
          </svg>
        </button>
      </div>

      {/* Upgrade plan modal */}
      <div
        className={`scrim${upgradeOpen ? ' open' : ''}`}
        onMouseDown={e => { if (e.target === e.currentTarget && !upgradeBusy) setUpgradeOpen(false); }}
      >
        <div className="dialog upgrade-dlg" role="dialog" aria-modal="true" aria-label="Choose your plan">
          <div className="upgrade-head">
            <h3>Choose your plan</h3>
            <p>Scale your annotation workflow with the right tier.</p>
          </div>

          <div className="upgrade-body">
            <div className="plan-cards">
              {/* Free — current */}
              <div className="plan-card current">
                <span className="plan-name">Free</span>
                <div className="plan-price">$0<span className="freq">/mo</span></div>
                <p className="plan-desc">25k images/mo · 3 projects · 1 seat</p>
                <button className="btn btn-outline btn-sm" disabled>Current plan</button>
              </div>

              {/* Pro — popular */}
              <div className="plan-card popular">
                <span className="plan-badge">Popular</span>
                <span className="plan-name">Pro</span>
                <div className="plan-price"><sup>$</sup>{seats * 25}<span className="freq">/mo</span></div>
                <p className="plan-desc">Unlimited images · Unlimited projects · {seats} seat{seats !== 1 ? 's' : ''}</p>
                <button
                  className="btn btn-primary btn-sm"
                  data-loading={upgradeBusy ? 'true' : undefined}
                  onClick={doUpgrade}
                >
                  {upgradeBusy && <span className="spinner" />}
                  <span className="btn-label">Upgrade</span>
                </button>
              </div>

              {/* Enterprise */}
              <div className="plan-card">
                <span className="plan-name">Enterprise</span>
                <div className="plan-price" style={{ fontSize: 18 }}>Custom</div>
                <p className="plan-desc">SSO · SLA · Custom limits · Dedicated support</p>
                <a href="mailto:sales@annotationstudio.com" className="btn btn-outline btn-sm">Contact sales</a>
              </div>
            </div>

            {/* Seats stepper */}
            <div className="seats-row">
              <label htmlFor="sb-seats">Pro seats</label>
              <div className="seats-stepper">
                <button
                  className="step-btn"
                  onClick={() => setSeats(s => Math.max(1, s - 1))}
                  aria-label="Remove seat"
                >−</button>
                <input
                  id="sb-seats"
                  type="number"
                  min={1}
                  max={99}
                  value={seats}
                  onChange={e => setSeats(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                />
                <button
                  className="step-btn"
                  onClick={() => setSeats(s => Math.min(99, s + 1))}
                  aria-label="Add seat"
                >+</button>
              </div>
            </div>
          </div>

          <div className="upgrade-foot">
            <button className="btn btn-ghost" onClick={() => { if (!upgradeBusy) setUpgradeOpen(false); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar toasts */}
      <div className="sb-toast-host" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`sb-toast${t.show ? ' show' : ''}`}>
            <b>{t.title}</b>
            <span>{t.body}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
