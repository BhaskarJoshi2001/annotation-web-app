'use client';

import type { ReactNode } from 'react';

type NavKey = 'projects' | 'datasets' | 'models' | 'exports' | 'team' | 'settings';

interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  group?: boolean; // render a group label before this item
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
    key: 'models', label: 'Models', href: '#', badge: 'beta',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" /></svg>,
  },
  {
    key: 'exports', label: 'Exports', href: '#',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>,
  },
  {
    key: 'team', label: 'Team', href: '#', group: true, groupLabel: 'Workspace',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></svg>,
  },
  {
    key: 'settings', label: 'Settings', href: '#',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
];

export function AppSidebar({ active, showUsage = false }: { active: NavKey; showUsage?: boolean }) {
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
          <div className="usage">
            <div className="urow"><span className="t-caption">Images this month</span><span className="t-caption mono" style={{ fontWeight: 600 }}>18.2k / 25k</span></div>
            <div className="progress"><div className="bar" style={{ width: '73%' }} /></div>
            <button className="btn btn-tonal btn-sm btn-block" style={{ marginTop: 12 }}>Upgrade plan</button>
          </div>
        )}
        <div className="userbox">
          <span className="avatar md" style={{ background: 'var(--blue-500)', color: '#fff' }}>BJ</span>
          <div className="meta"><b>Bhaskar Joshi</b><span>bj8212553@gmail.com</span></div>
          <button className="icon-btn sm" aria-label="Account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
