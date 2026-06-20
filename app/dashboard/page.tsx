'use client';

import { useMemo, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app-sidebar';
import '../ds.css';
import '../app-shell.css';
import './dashboard.css';

type Status = 'active' | 'review' | 'archived';

interface Project {
  id: string;
  name: string;
  imgs: number;
  done: number;
  status: Status;
  scene: keyof typeof scenes;
  team: string[];
  extra: number;
  updated: string;
  classes: number;
}

interface Toast {
  id: number;
  title: string;
  msg: string;
  action?: string;
  href?: string;
}

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

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Traffic — Q3 dashcam', imgs: 2480, done: 82, status: 'active', scene: 'street', team: ['AM', 'KP', 'JR'], extra: 4, updated: '2m ago', classes: 6 },
  { id: 'p2', name: 'Warehouse pallets', imgs: 1840, done: 64, status: 'active', scene: 'factory', team: ['JR', 'MN'], extra: 2, updated: '1h ago', classes: 4 },
  { id: 'p3', name: 'Retail shelf audit', imgs: 3920, done: 97, status: 'review', scene: 'retail', team: ['KP', 'AM', 'SL', 'JR'], extra: 6, updated: '3h ago', classes: 11 },
  { id: 'p4', name: 'Drone crop survey', imgs: 980, done: 41, status: 'active', scene: 'drone', team: ['SL'], extra: 1, updated: 'yesterday', classes: 8 },
  { id: 'p5', name: 'Medical X-ray triage', imgs: 560, done: 100, status: 'review', scene: 'medical', team: ['MN', 'AM'], extra: 3, updated: '2d ago', classes: 5 },
  { id: 'p6', name: 'Aerial land use', imgs: 1320, done: 23, status: 'active', scene: 'aerial', team: ['JR', 'KP'], extra: 0, updated: '4d ago', classes: 9 },
  { id: 'p7', name: 'Invoice fields OCR', imgs: 740, done: 88, status: 'archived', scene: 'docs', team: ['SL', 'MN'], extra: 1, updated: '2w ago', classes: 14 },
];

const FILTERS: { label: string; value: 'all' | Status }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'In review', value: 'review' },
  { label: 'Archived', value: 'archived' },
];

const TASK_TYPES = [
  {
    id: 'detection', label: 'Detection', desc: 'Bounding boxes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>,
  },
  {
    id: 'segmentation', label: 'Segmentation', desc: 'Pixel-accurate masks',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L21.5 8v8L12 22 2.5 16V8Z"/></svg>,
  },
  {
    id: 'classification', label: 'Classification', desc: 'Image-level labels',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg>,
  },
  {
    id: 'keypoints', label: 'Keypoints', desc: 'Pose & skeleton',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="3" r="2" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="2" fill="currentColor" stroke="none"/><path d="M12 5L5 16M12 5L19 16M5 18h14"/></svg>,
  },
];

const DEFAULT_CLASSES: Record<string, string[]> = {
  detection: ['Car', 'Pedestrian', 'Cyclist', 'Truck', 'Motorcycle', 'Traffic light'],
  segmentation: ['Background', 'Road', 'Building', 'Vehicle', 'Person', 'Sky'],
  classification: ['Normal', 'Defective', 'Uncertain'],
  keypoints: ['Head', 'Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle'],
};

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

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const nextId = useRef(100);

  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [rename, setRename] = useState({ open: false, id: '', orig: '', value: '' });
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [del, setDel] = useState({ open: false, id: '', name: '', busy: false });
  const delCancelRef = useRef<HTMLButtonElement>(null);

  const [np, setNp] = useState({
    open: false, step: 1 as 1 | 2, name: '', taskType: 'detection',
    classes: [] as string[], addingClass: false, classInput: '',
  });
  const npNameRef = useRef<HTMLInputElement>(null);
  const npClassRef = useRef<HTMLInputElement>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((title: string, msg: string, action?: string, href?: string, duration = 3400) => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, title, msg, action, href }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  useEffect(() => {
    if (!ctxMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxMenu(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [ctxMenu]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (np.open) { setNp(p => ({ ...p, open: false })); return; }
      if (rename.open) { setRename(p => ({ ...p, open: false })); return; }
      if (del.open && !del.busy) setDel(p => ({ ...p, open: false }));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [np.open, rename.open, del.open, del.busy]);

  useEffect(() => { if (rename.open) setTimeout(() => renameInputRef.current?.focus(), 60); }, [rename.open]);
  useEffect(() => { if (del.open) setTimeout(() => delCancelRef.current?.focus(), 60); }, [del.open]);
  useEffect(() => { if (np.open && np.step === 1) setTimeout(() => npNameRef.current?.focus(), 60); }, [np.open, np.step]);
  useEffect(() => { if (np.addingClass) setTimeout(() => npClassRef.current?.focus(), 30); }, [np.addingClass]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter(p => (filter === 'all' || p.status === filter) && p.name.toLowerCase().includes(q));
  }, [projects, query, filter]);

  function getP(id: string) { return projects.find(p => p.id === id); }

  function markNew(id: string) {
    setNewIds(s => new Set([...s, id]));
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n; }), 3000);
  }

  function openCtxMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation(); e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const W = 210, H = 244;
    const x = Math.max(8, Math.min(rect.right - W, window.innerWidth - W - 8));
    const y = rect.bottom + 6 + H > window.innerHeight - 8 ? rect.top - H - 6 : rect.bottom + 6;
    setCtxMenu({ id, x, y });
  }

  function handleOpen(id: string) { setCtxMenu(null); void id; router.push('/dataset'); }

  function handleRenameOpen(id: string) {
    const p = getP(id); setCtxMenu(null);
    if (p) setRename({ open: true, id, orig: p.name, value: p.name });
  }

  function handleRenameSave() {
    const val = rename.value.trim();
    if (!val || val === rename.orig) return;
    setProjects(ps => ps.map(p => p.id === rename.id ? { ...p, name: val } : p));
    setRename(p => ({ ...p, open: false }));
    addToast('Renamed', `Project renamed to "${val}".`);
  }

  function handleDuplicate(id: string) {
    const p = getP(id); setCtxMenu(null);
    if (!p) return;
    const newId = `p${++nextId.current}`;
    setProjects(ps => [...ps, { ...p, id: newId, name: `Copy of ${p.name}`, updated: 'just now', status: 'active' as Status }]);
    markNew(newId);
    addToast('Duplicated', `"${p.name}" duplicated.`);
  }

  function handleExportAll(id: string) {
    const p = getP(id); setCtxMenu(null);
    addToast('Export queued', `Exporting all datasets in "${p?.name ?? ''}".`, 'View exports', '/exports');
  }

  function handleArchive(id: string) {
    const p = getP(id); setCtxMenu(null);
    if (!p) return;
    const willArchive = p.status !== 'archived';
    setProjects(ps => ps.map(q => q.id === id ? { ...q, status: willArchive ? 'archived' : 'active' } : q));
    addToast(willArchive ? 'Archived' : 'Unarchived', `"${p.name}" ${willArchive ? 'archived' : 'moved back to active'}.`);
  }

  function handleDeleteOpen(id: string) {
    const p = getP(id); setCtxMenu(null);
    if (p) setDel({ open: true, id, name: p.name, busy: false });
  }

  function confirmDelete() {
    if (del.busy) return;
    setDel(p => ({ ...p, busy: true }));
    const { id, name } = del;
    setTimeout(() => {
      setDel({ open: false, id: '', name: '', busy: false });
      setRemoving(s => new Set([...s, id]));
      setTimeout(() => {
        setProjects(ps => ps.filter(p => p.id !== id));
        setRemoving(s => { const n = new Set(s); n.delete(id); return n; });
        addToast('Deleted', `"${name}" has been permanently deleted.`);
      }, 320);
    }, 1000);
  }

  function openNewProj() {
    setNp({ open: true, step: 1, name: '', taskType: 'detection', classes: [], addingClass: false, classInput: '' });
  }

  function npNextStep() {
    if (!np.name.trim()) return;
    setNp(p => ({ ...p, step: 2, classes: [...(DEFAULT_CLASSES[p.taskType] ?? [])] }));
  }

  function npRemoveClass(cls: string) { setNp(p => ({ ...p, classes: p.classes.filter(c => c !== cls) })); }

  function npCommitClass() {
    const val = np.classInput.trim();
    const classes = val && !np.classes.includes(val) ? [...np.classes, val] : np.classes;
    setNp(p => ({ ...p, classes, classInput: '', addingClass: false }));
  }

  function createProject() {
    const name = np.name.trim();
    if (!name) return;
    const id = `p${++nextId.current}`;
    const sceneKeys = Object.keys(scenes) as (keyof typeof scenes)[];
    setProjects(ps => [...ps, {
      id, name, imgs: 0, done: 0, status: 'active',
      scene: sceneKeys[nextId.current % sceneKeys.length],
      team: ['AM'], extra: 0, updated: 'just now', classes: np.classes.length,
    }]);
    setNp(p => ({ ...p, open: false }));
    markNew(id);
    addToast('Created', `"${name}" is ready. Upload images to get started.`);
  }

  const IcClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>;
  const IcBack  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;

  return (
    <div className="ds dash">
      <AppSidebar active="projects" showUsage />

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
          <button className="btn btn-primary" onClick={openNewProj}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            New project
          </button>
        </header>

        <div className="content">
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

          <div className="listbar">
            <h2>All projects</h2>
            <span className="badge badge-neutral">{list.length}</span>
            <div className="grow" />
            <div className="row" style={{ gap: 8 }}>
              {FILTERS.map((f) => (
                <button key={f.value} className={`chip filter${filter === f.value ? ' selected' : ''}`} onClick={() => setFilter(f.value)}>
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

          <div className={`grid${view === 'list' ? ' list-view' : ''}`}>
            {list.map((p) => {
              const barColor = p.done >= 95 ? 'var(--success)' : 'var(--primary)';
              return (
                <article
                  key={p.id}
                  className={`proj${removing.has(p.id) ? ' removing' : ''}${newIds.has(p.id) ? ' entering' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push('/dataset')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/dataset'); } }}
                >
                  <div className="cover">
                    <div className="scene" style={{ background: scenes[p.scene] }} />
                    <div className="ov" />
                    <div className="tags"><StatusBadge status={p.status} /></div>
                    {newIds.has(p.id) && <span className="badge badge-primary new-badge">New</span>}
                    <button
                      className="icon-btn sm menu-btn"
                      aria-label="Project options"
                      aria-haspopup="true"
                      onClick={(e) => openCtxMenu(e, p.id)}
                    >
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
            <button className="proj new-proj" onClick={openNewProj}>
              <div className="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg></div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-label-size)' }}>New project</div>
              <div className="t-caption" style={{ textAlign: 'center', maxWidth: '20ch' }}>Upload images and start labeling</div>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEXT MENU ── */}
      {ctxMenu && (
        <div ref={menuRef} className="menu" role="menu" style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 900, minWidth: 210 }}>
          <button className="menu-item" role="menuitem" onClick={() => handleOpen(ctxMenu.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
            Open
          </button>
          <button className="menu-item" role="menuitem" onClick={() => handleRenameOpen(ctxMenu.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            Rename
          </button>
          <button className="menu-item" role="menuitem" onClick={() => handleDuplicate(ctxMenu.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Duplicate
          </button>
          <button className="menu-item" role="menuitem" onClick={() => handleExportAll(ctxMenu.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export all
          </button>
          <div className="menu-sep" />
          <button className="menu-item" role="menuitem" onClick={() => handleArchive(ctxMenu.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
            {getP(ctxMenu.id)?.status === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
          <div className="menu-sep" />
          <button className="menu-item danger" role="menuitem" onClick={() => handleDeleteOpen(ctxMenu.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>
            Delete
          </button>
        </div>
      )}

      {/* ── RENAME MODAL ── */}
      <div className={`scrim${rename.open ? ' open' : ''}`} onClick={() => setRename(p => ({ ...p, open: false }))}>
        <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="ren-ttl" onClick={e => e.stopPropagation()}>
          <div className="dlg-head">
            <h3 id="ren-ttl">Rename project</h3>
            <button className="icon-btn sm" aria-label="Close" onClick={() => setRename(p => ({ ...p, open: false }))}><IcClose /></button>
          </div>
          <div className="dlg-body">
            <div className="field">
              <label htmlFor="ren-inp">Project name</label>
              <input
                id="ren-inp"
                ref={renameInputRef}
                className="input"
                value={rename.value}
                onChange={e => setRename(p => ({ ...p, value: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleRenameSave(); }}
              />
            </div>
          </div>
          <div className="dlg-foot">
            <button className="btn btn-ghost" onClick={() => setRename(p => ({ ...p, open: false }))}>Cancel</button>
            <button className="btn btn-primary" disabled={!rename.value.trim() || rename.value.trim() === rename.orig} onClick={handleRenameSave}>Save</button>
          </div>
        </div>
      </div>

      {/* ── DELETE MODAL ── */}
      <div className={`scrim${del.open ? ' open' : ''}`} onClick={() => { if (!del.busy) setDel(p => ({ ...p, open: false })); }}>
        <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="del-ttl" onClick={e => e.stopPropagation()}>
          <div className="dlg-head">
            <div className="dlg-ico del">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>
            </div>
            <div>
              <h3 id="del-ttl">Delete project?</h3>
              <p className="dlg-sub">This action cannot be undone.</p>
            </div>
          </div>
          <div className="dlg-body">
            <p>This will permanently delete <strong>&ldquo;{del.name}&rdquo;</strong> and all its images, annotations, and exports.</p>
          </div>
          <div className="dlg-foot">
            <button ref={delCancelRef} className="btn btn-ghost" onClick={() => !del.busy && setDel(p => ({ ...p, open: false }))}>Cancel</button>
            <button className="btn btn-destructive" data-loading={del.busy ? 'true' : undefined} onClick={confirmDelete}>
              {del.busy && <span className="spinner" />}
              <span className="btn-label">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── NEW PROJECT MODAL (2-step) ── */}
      <div className={`scrim${np.open ? ' open' : ''}`} onClick={() => setNp(p => ({ ...p, open: false }))}>
        <div className="dialog np-dlg" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
          {np.step === 1 ? (
            <>
              <div className="dlg-head">
                <h3>New project</h3>
                <span className="step-pill">Step 1 of 2</span>
                <button className="icon-btn sm" aria-label="Close" onClick={() => setNp(p => ({ ...p, open: false }))}><IcClose /></button>
              </div>
              <div className="dlg-body">
                <div className="field">
                  <label htmlFor="np-name">Project name</label>
                  <input
                    id="np-name"
                    ref={npNameRef}
                    className="input"
                    placeholder="e.g. Traffic — Q4 dashcam"
                    value={np.name}
                    onChange={e => setNp(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && np.name.trim()) npNextStep(); }}
                  />
                </div>
                <div className="field np-task-field">
                  <label>Task type</label>
                  <div className="task-cards">
                    {TASK_TYPES.map(t => (
                      <button key={t.id} className={`task-card${np.taskType === t.id ? ' sel' : ''}`} onClick={() => setNp(p => ({ ...p, taskType: t.id }))}>
                        <div className="tc-ico">{t.icon}</div>
                        <b>{t.label}</b>
                        <span>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="dlg-foot">
                <button className="btn btn-ghost" onClick={() => setNp(p => ({ ...p, open: false }))}>Cancel</button>
                <button className="btn btn-primary" disabled={!np.name.trim()} onClick={npNextStep}>
                  Next: Add classes
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="dlg-head">
                <button className="icon-btn sm" aria-label="Back" onClick={() => setNp(p => ({ ...p, step: 1 }))}><IcBack /></button>
                <h3>Add classes</h3>
                <span className="step-pill">Step 2 of 2</span>
                <button className="icon-btn sm" aria-label="Close" onClick={() => setNp(p => ({ ...p, open: false }))}><IcClose /></button>
              </div>
              <div className="dlg-body">
                <p className="t-caption np-hint">Classes are the categories your annotators will assign to objects. You can add more after creating the project.</p>
                <div className="chip-list">
                  {np.classes.map(cls => (
                    <span key={cls} className="chip selected">
                      {cls}
                      <span className="x" role="button" tabIndex={0} aria-label={`Remove ${cls}`} onClick={() => npRemoveClass(cls)} onKeyDown={e => { if (e.key === 'Enter') npRemoveClass(cls); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                      </span>
                    </span>
                  ))}
                  {np.addingClass ? (
                    <input
                      ref={npClassRef}
                      className="chip-input"
                      placeholder="Class name…"
                      value={np.classInput}
                      onChange={e => setNp(p => ({ ...p, classInput: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') npCommitClass(); if (e.key === 'Escape') setNp(p => ({ ...p, addingClass: false, classInput: '' })); }}
                      onBlur={npCommitClass}
                    />
                  ) : (
                    <button className="chip add-chip" onClick={() => setNp(p => ({ ...p, addingClass: true }))}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 13, height: 13 }}><path d="M12 5v14M5 12h14"/></svg>
                      Add class
                    </button>
                  )}
                </div>
              </div>
              <div className="dlg-foot">
                <button className="btn btn-ghost" onClick={() => setNp(p => ({ ...p, step: 1 }))}>Back</button>
                <button className="btn btn-primary" onClick={createProject}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
                  Create project
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TOASTS ── */}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast-item show">
            <span style={{ color: 'var(--primary)', flex: 'none', width: 18, height: 18, marginTop: 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div>
              <div className="t-label">{t.title}</div>
              <div className="t-caption">{t.msg}</div>
              {t.action && <a className="t-action" href={t.href ?? '#'}>{t.action}</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
