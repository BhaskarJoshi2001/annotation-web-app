'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import '../app-shell.css';
import './team.css';

type Role = 'Owner' | 'Admin' | 'Reviewer' | 'Labeler';
type Status = 'online' | 'away' | 'offline' | 'pending';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  color: string;
  initials: string;
  isYou?: boolean;
}

const COLORS = ['var(--blue-500)', 'var(--violet-500)', 'var(--green-500)', 'var(--amber-500)', 'var(--cyan-500)', 'var(--pink-500)', 'var(--orange-500)'];

const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Bhaskar Joshi', email: 'bj8212553@gmail.com', role: 'Owner', status: 'online', color: 'var(--blue-500)', initials: 'BJ', isYou: true },
  { id: '2', name: 'Kofi Patel', email: 'kofi@acmevision.ai', role: 'Admin', status: 'online', color: 'var(--violet-500)', initials: 'KP' },
  { id: '3', name: 'Jordan Rivera', email: 'jordan@acmevision.ai', role: 'Labeler', status: 'online', color: 'var(--green-500)', initials: 'JR' },
  { id: '4', name: 'Mina Noor', email: 'mina@acmevision.ai', role: 'Reviewer', status: 'away', color: 'var(--amber-500)', initials: 'MN' },
  { id: '5', name: 'Sasha Lin', email: 'sasha@acmevision.ai', role: 'Labeler', status: 'offline', color: 'var(--cyan-500)', initials: 'SL' },
  { id: '6', name: 'Diego Romero', email: 'diego@acmevision.ai', role: 'Labeler', status: 'offline', color: 'var(--pink-500)', initials: 'DR' },
  { id: '7', name: 'Priya Shah', email: 'priya@acmevision.ai', role: 'Reviewer', status: 'away', color: 'var(--orange-500)', initials: 'PS' },
];

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Owner: 'Full control of the workspace, including billing and workspace deletion.',
  Admin: 'Manage projects, datasets, and members. No billing access.',
  Reviewer: 'Review, approve, and request changes on annotations.',
  Labeler: 'Can annotate assigned images, but cannot manage settings or the team.',
};

interface Toast { id: number; title: string; msg: string; }

function StatusBadge({ status }: { status: Status }) {
  if (status === 'online') return <span className="badge badge-success" style={{ height: 20 }}><span className="dot" />Online</span>;
  if (status === 'away') return <span className="badge badge-warning" style={{ height: 20 }}><span className="dot" />Away</span>;
  if (status === 'pending') return <span className="badge badge-warning" style={{ height: 20 }}><span className="dot" />Pending</span>;
  return <span className="badge badge-neutral" style={{ height: 20 }}>Offline</span>;
}

export default function TeamPage() {
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [newId, setNewId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Labeler');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [menu, setMenu] = useState<{ x: number; y: number; memberId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inviteEmailRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((title: string, msg: string) => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3400);
  }, []);

  const emailOK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function handleSendInvite() {
    if (!emailOK(inviteEmail)) return;
    const name = inviteEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const id = String(Date.now());
    const newMember: Member = { id, name, email: inviteEmail, role: inviteRole, status: 'pending', color: COLORS[members.length % COLORS.length], initials };
    setMembers(p => [...p, newMember]);
    setNewId(id);
    setInviteOpen(false);
    addToast('Invite sent', `An invite was sent to ${inviteEmail}.`);
    setInviteEmail(''); setInviteRole('Labeler');
    setTimeout(() => setNewId(null), 1000);
  }

  function handleRoleChange(id: string, role: Role) {
    const m = members.find(x => x.id === id);
    setMembers(p => p.map(x => x.id === id ? { ...x, role } : x));
    if (m) addToast('Role updated', `${m.name} is now ${role}.`);
  }

  function openMenu(e: React.MouseEvent, memberId: string) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: rect.right - 180, y: rect.bottom + 6, memberId });
  }

  function removeMember(id: string) {
    const m = members.find(x => x.id === id);
    setMembers(p => p.filter(x => x.id !== id));
    setMenu(null);
    if (m) addToast('Member removed', `${m.name} no longer has access.`);
  }

  function resendInvite(id: string) {
    const m = members.find(x => x.id === id);
    setMenu(null);
    if (m) addToast('Invite resent', `A new invite link was sent to ${m.email}.`);
  }

  useEffect(() => {
    if (!menu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenu(null); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [menu]);

  useEffect(() => {
    if (inviteOpen) setTimeout(() => inviteEmailRef.current?.focus(), 60);
  }, [inviteOpen]);

  return (
    <div className="ds team-pg">
      <AppSidebar active="team" showUsage />

      <div className="main">
        <header className="topbar">
          <div>
            <h1>Team</h1>
            <div className="sub">{members.length} members</div>
          </div>
          <div className="grow" />
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(isDark ? 'light' : 'dark')}>
            {isDark
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            }
          </button>
          <button className="btn btn-primary" onClick={() => setInviteOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
            Invite member
          </button>
        </header>

        <div className="content">
          <h2 className="sec-title">Members</h2>
          <p className="sec-desc">Everyone with access to the Acme Vision workspace. Manage their role or remove access.</p>

          <div className="members">
            <div className="m-head"><span>Member</span><span>Role</span><span className="col-status">Status</span><span /></div>
            {members.map(m => (
              <div key={m.id} className={`m-row${newId === m.id ? ' entering' : ''}`}>
                <div className="m-who">
                  <span className="avatar md" style={{ background: m.color, color: '#fff' }}>{m.initials}</span>
                  <div className="meta">
                    <b>{m.name}{m.isYou && <span className="badge badge-primary" style={{ height: 16, fontSize: 10 }}>You</span>}</b>
                    <span>{m.email}</span>
                  </div>
                </div>
                <div className="select-wrap">
                  <select
                    className="select-native"
                    style={{ height: 32, width: '100%', fontSize: 'var(--text-label-size)' }}
                    value={m.role}
                    disabled={m.isYou}
                    onChange={e => handleRoleChange(m.id, e.target.value as Role)}
                  >
                    {(['Owner', 'Admin', 'Reviewer', 'Labeler'] as Role[]).map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-status"><StatusBadge status={m.status} /></div>
                <button
                  className="icon-btn sm"
                  aria-label="Member options"
                  style={m.isYou ? { visibility: 'hidden' } : undefined}
                  onClick={e => openMenu(e, m.id)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                </button>
              </div>
            ))}
          </div>

          <h2 className="sec-title" style={{ marginTop: 'var(--space-10)' }}>Roles &amp; permissions</h2>
          <p className="sec-desc">What each role can do across projects, datasets, and workspace settings.</p>

          <div className="roles-grid">
            {[
              {
                color: 'var(--warning-container)', textColor: 'var(--on-warning-container)',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l4 3 5-6 5 6 4-3-2 11H5z" /></svg>,
                title: 'Owner', desc: 'Full control of the workspace, including billing and deletion.',
                perms: [{ ok: true, t: 'Everything Admins can do' }, { ok: true, t: 'Manage billing & plan' }],
              },
              {
                color: 'var(--primary-subtle)', textColor: 'var(--primary)',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                title: 'Admin', desc: 'Manage projects, datasets, and members — everything except billing.',
                perms: [{ ok: true, t: 'Create & delete projects' }, { ok: false, t: 'No billing access' }],
              },
              {
                color: 'var(--success-container)', textColor: 'var(--success)',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
                title: 'Reviewer', desc: 'Review, approve, and request changes on submitted annotations.',
                perms: [{ ok: true, t: 'Approve & reject labels' }, { ok: false, t: 'No workspace settings' }],
              },
              {
                color: 'var(--secondary-container)', textColor: 'var(--on-secondary-container)',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 7.4l-8-4.8a2 2 0 0 0-2 0l-4 2.4M3 7v7l9 5 4-2.2" /><circle cx="7" cy="10" r="1.4" /><path d="M16 14l5-3v-4" /></svg>,
                title: 'Labeler', desc: 'Annotate assigned images. Cannot change settings or manage the team.',
                perms: [{ ok: true, t: 'Draw & submit annotations' }, { ok: false, t: 'No settings or team access' }],
              },
            ].map(card => (
              <div key={card.title} className="role-card">
                <div className="r-ico" style={{ background: card.color, color: card.textColor }}>{card.icon}</div>
                <div>
                  <h4>{card.title}</h4>
                  <p>{card.desc}</p>
                  <ul className="perms">
                    {card.perms.map(p => (
                      <li key={p.t} className={p.ok ? '' : 'no'}>
                        {p.ok
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                        }
                        {p.t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {menu && (
        <div ref={menuRef} className="ctx-menu" style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 'var(--z-modal)' as never }}>
          <button onClick={() => resendInvite(menu.memberId)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            Resend invite
          </button>
          <div className="divider" />
          <button className="danger" onClick={() => removeMember(menu.memberId)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6" /></svg>
            Remove member
          </button>
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <div
          className="scrim open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inviteTitle"
          onMouseDown={e => { if (e.target === e.currentTarget) setInviteOpen(false); }}
          onKeyDown={e => { if (e.key === 'Escape') setInviteOpen(false); }}
        >
          <div className="dialog" style={{ maxWidth: 440 }}>
            <div className="dlg-head">
              <button className="icon-btn dlg-x" onClick={() => setInviteOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
              <div className="dlg-ico" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
              </div>
              <h2 id="inviteTitle">Invite team member</h2>
              <p>They&apos;ll get an email with a link to join your workspace.</p>
            </div>
            <div className="dlg-body">
              <div className="dlg-field" style={{ marginBottom: 'var(--space-5)' }}>
                <label htmlFor="inviteEmail">Email address <span style={{ color: 'var(--destructive)' }}>*</span></label>
                <input
                  ref={inviteEmailRef}
                  className="input"
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && emailOK(inviteEmail)) handleSendInvite(); }}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="dlg-field">
                <label htmlFor="inviteRole">Role</label>
                <div className="select-wrap">
                  <select
                    className="select-native"
                    id="inviteRole"
                    style={{ width: '100%' }}
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as Role)}
                  >
                    {(['Owner', 'Admin', 'Reviewer', 'Labeler'] as Role[]).map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <p className="role-desc" dangerouslySetInnerHTML={{ __html: `<b>${inviteRole}</b> — ${ROLE_DESCRIPTIONS[inviteRole]}` }} />
              </div>
            </div>
            <div className="dlg-foot">
              <button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!emailOK(inviteEmail)} onClick={handleSendInvite}>Send invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast-item show">
            <span className="t-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div>
              <div className="t-label" style={{ marginBottom: 2 }}>{t.title}</div>
              <div className="t-caption">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
