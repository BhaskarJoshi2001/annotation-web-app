'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app-sidebar';
import '../ds.css';
import '../app-shell.css';
import './dashboard.css';

type Status = 'active' | 'review' | 'archived';

interface Project {
  name: string;
  imgs: number;
  done: number;
  status: Status;
  scene: keyof typeof scenes;
  team: string[];
  extra: number;
  updated: string;
  classes: number;
  href?: string;
}

const scenes = {
  street: 'linear-gradient(180deg,#2b3a55,#3d4a66 38%,#585c66 50%,#2a2d35)',
  aerial: 'linear-gradient(135deg,#3a5a40,#588157 45%,#a3b18a 80%,#dad7cd)',
  retail: 'linear-gradient(160deg,#22223b,#4a4e69 55%,#9a8c98)',
  medical: 'linear-gradient(150deg,#1d3557,#457b9d 60%,#a8dadc)',
  factory: 'linear-gradient(165deg,#3d2c2e,#774c60 55%,#b56576)',
  drone: 'linear-gradient(180deg,#264653,#2a9d8f 55%,#e9c46a)',
  docs: 'linear-gradient(160deg,#383d3b,#6b705c 55%,#cb997e)',
} as const;

const avatarColors: Record<string, string> = {
  AM: 'var(--blue-500)',
  KP: 'var(--violet-500)',
  JR: 'var(--green-500)',
  MN: 'var(--amber-500)',
  SL: 'var(--cyan-500)',
  default: 'var(--neutral-400)',
};

interface Stat {
  lab: string;
  val: string;
  delta: string;
  dir: 'up' | 'flat';
  color: string;
  bg: string;
  icon: ReactNode;
  spark: 'up' | 'flat';
}

const STATS: Stat[] = [
  {
    lab: 'Total projects', val: '7', delta: '+2 this month', dir: 'up',
    color: 'var(--primary)', bg: 'var(--primary-subtle)', spark: 'up',
    icon: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  },
  {
    lab: 'Images labeled', val: '42.8k', delta: '+5.1k this week', dir: 'up',
    color: 'var(--success)', bg: 'var(--success-container)', spark: 'up',
    icon: (<rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" />),
  },
  {
    lab: 'Annotations', val: '311k', delta: '+18% vs last mo', dir: 'up',
    color: 'var(--secondary)', bg: 'var(--secondary-container)', spark: 'up',
    icon: (<path d="M4 3l7.5 18 2.3-7.2L21 11.5z" />),
  },
  {
    lab: 'Avg. accuracy', val: '96.4%', delta: 'Stable', dir: 'flat',
    color: 'var(--warning)', bg: 'var(--warning-container)', spark: 'flat',
    icon: (<><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></>),
  },
];

const PROJECTS: Project[] = [
  { name: 'Traffic — Q3 dashcam', imgs: 2480, done: 82, status: 'active', scene: 'street', team: ['AM', 'KP', 'JR'], extra: 4, updated: '2m ago', classes: 6, href: '/' },
  { name: 'Warehouse pallets', imgs: 1840, done: 64, status: 'active', scene: 'factory', team: ['JR', 'MN'], extra: 2, updated: '1h ago', classes: 4 },
  { name: 'Retail shelf audit', imgs: 3920, done: 97, status: 'review', scene: 'retail', team: ['KP', 'AM', 'SL', 'JR'], extra: 6, updated: '3h ago', classes: 11 },
  { name: 'Drone crop survey', imgs: 980, done: 41, status: 'active', scene: 'drone', team: ['SL'], extra: 1, updated: 'yesterday', classes: 8 },
  { name: 'Medical X-ray triage', imgs: 560, done: 100, status: 'review', scene: 'medical', team: ['MN', 'AM'], extra: 3, updated: '2d ago', classes: 5 },
  { name: 'Aerial land use', imgs: 1320, done: 23, status: 'active', scene: 'aerial', team: ['JR', 'KP'], extra: 0, updated: '4d ago', classes: 9 },
  { name: 'Invoice fields OCR', imgs: 740, done: 88, status: 'archived', scene: 'docs', team: ['SL', 'MN'], extra: 1, updated: '2w ago', classes: 14 },
];

const FILTERS: { label: string; value: 'all' | Status }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'In review', value: 'review' },
  { label: 'Archived', value: 'archived' },
];

function sparkPath(kind: 'up' | 'flat'): string {
  return kind === 'up'
    ? 'M0 38 C18 36 24 28 38 24 C52 20 60 22 74 12 C82 7 86 6 90 4'
    : 'M0 24 C18 22 24 26 38 22 C52 18 60 24 74 20 C82 18 86 22 90 20';
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'active') return <span className="badge badge-success"><span className="dot" />Active</span>;
  if (status === 'review') return <span className="badge badge-warning"><span className="dot" />In review</span>;
  return <span className="badge badge-neutral">Archived</span>;
}

function Avatars({ team, extra }: { team: string[]; extra: number }) {
  return (
    <span className="avatar-stack">
      {team.slice(0, 3).map((t) => (
        <span key={t} className="avatar xs" style={{ background: avatarColors[t] || avatarColors.default, color: '#fff' }}>{t}</span>
      ))}
      {extra > 0 && (
        <span className="avatar xs" style={{ background: 'var(--surface-variant)', color: 'var(--muted-foreground)' }}>+{extra}</span>
      )}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { resolved, setMode } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return PROJECTS.filter(
      (p) => (filter === 'all' || p.status === filter) && p.name.toLowerCase().includes(q)
    );
  }, [query, filter]);

  const openProject = (_p: Project) => {
    router.push('/dataset');
  };

  return (
    <div className="ds dash">
      <AppSidebar active="projects" showUsage />

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <h1>Projects</h1>
          <div className="grow" />
          <div className="searchbar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
            <input placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search projects" />
            <kbd className="key">/</kbd>
          </div>
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}>
            {resolved === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            )}
          </button>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>New project</button>
        </header>

        <div className="content">
          {/* STATS */}
          <div className="stats">
            {STATS.map((s) => (
              <div className="stat" key={s.lab}>
                <div className="ico" style={{ background: s.bg, color: s.color }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div className="lab">{s.lab}</div>
                <div className="val">{s.val}</div>
                <div className={`delta ${s.dir}`}>
                  {s.dir === 'up' ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" strokeLinecap="round" /></svg>
                  )}
                  {s.delta}
                </div>
                <svg className="spark" viewBox="0 0 90 42" fill="none" preserveAspectRatio="none"><path d={sparkPath(s.spark)} stroke={s.color} strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
            ))}
          </div>

          {/* LIST TOOLBAR */}
          <div className="listbar">
            <h2>All projects</h2>
            <span className="badge badge-neutral">{list.length}</span>
            <div className="grow" />
            <div className="row" style={{ gap: 8 }}>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`chip filter${filter === f.value ? ' selected' : ''}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="select-wrap">
              <select className="select-native" style={{ height: 34, fontSize: 'var(--text-label-size)' }} aria-label="Sort">
                <option>Recently updated</option>
                <option>Name A–Z</option>
                <option>Most images</option>
                <option>Progress</option>
              </select>
            </div>
            <div className="seg" role="group" aria-label="View">
              <button aria-pressed={view === 'grid'} aria-label="Grid" onClick={() => setView('grid')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              </button>
              <button aria-pressed={view === 'list'} aria-label="List" onClick={() => setView('list')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
              </button>
            </div>
          </div>

          {/* GRID */}
          <div className={`grid${view === 'list' ? ' list-view' : ''}`}>
            {list.map((p) => {
              const barColor = p.done >= 95 ? 'var(--success)' : 'var(--primary)';
              return (
                <article
                  key={p.name}
                  className="proj"
                  role="button"
                  tabIndex={0}
                  onClick={() => openProject(p)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(p); } }}
                >
                  <div className="cover">
                    <div className="scene" style={{ background: scenes[p.scene] }} />
                    <div className="ov" />
                    <div className="tags"><StatusBadge status={p.status} /></div>
                    <button className="icon-btn sm menu-btn" aria-label="Project menu" onClick={(e) => e.stopPropagation()}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                    </button>
                  </div>
                  <div className="pbody">
                    <div className="ttl">{p.name}</div>
                    <div className="sub">{p.imgs.toLocaleString()} images · {p.classes} classes</div>
                    <div className="prog">
                      <div className="lbls"><span className="muted">Labeled</span><span className="pct" style={{ color: barColor }}>{p.done}%</span></div>
                      <div className="progress"><div className="bar" style={{ width: `${p.done}%`, background: barColor }} /></div>
                    </div>
                    <div className="foot">
                      <div className="who"><Avatars team={p.team} extra={p.extra} /></div>
                      <span className="t-caption" style={{ fontFamily: 'var(--font-mono)' }}>{p.updated}</span>
                    </div>
                  </div>
                </article>
              );
            })}
            <button className="proj new-proj">
              <div className="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg></div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-label-size)' }}>New project</div>
              <div className="t-caption" style={{ textAlign: 'center', maxWidth: '20ch' }}>Upload images and start labeling</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
