'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useTheme } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app-sidebar';
import '../ds.css';
import '../app-shell.css';
import './settings.css';

type Tab = 'profile' | 'account' | 'appearance' | 'team' | 'notifications';
type Role = 'Owner' | 'Admin' | 'Reviewer' | 'Labeler';

const ROLE_DESCS: Record<Role, string> = {
  Owner: 'Full access to all projects, billing, and team management.',
  Admin: 'Manage datasets, members, exports, and project settings.',
  Reviewer: 'Review and approve annotations. Cannot manage team.',
  Labeler: 'Annotate images only. No access to settings or exports.',
};

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg> },
  { key: 'account', label: 'Account', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { key: 'appearance', label: 'Appearance', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2" strokeLinecap="round"/></svg> },
  { key: 'team', label: 'Team', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg> },
  { key: 'notifications', label: 'Notifications', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg> },
];

const ACCENTS = ['#2563eb','#7c3aed','#0d9488','#e11d48','#ea580c'];

const TEAM = [
  { n:'Ana Marquez', e:'ana@acmevision.ai', role:'Owner', c:'var(--blue-500)', i:'AM', on:true },
  { n:'Kofi Patel', e:'kofi@acmevision.ai', role:'Admin', c:'var(--violet-500)', i:'KP', on:true },
  { n:'Jordan Rivera', e:'jordan@acmevision.ai', role:'Labeler', c:'var(--green-500)', i:'JR', on:true },
  { n:'Mina Noor', e:'mina@acmevision.ai', role:'Reviewer', c:'var(--amber-500)', i:'MN', on:false },
  { n:'Sasha Lin', e:'sasha@acmevision.ai', role:'Labeler', c:'var(--cyan-500)', i:'SL', on:false },
];

const NOTIFS = [
  { title: 'Annotation assigned to me', desc: 'When a teammate assigns you images.', on: true },
  { title: 'Review requested', desc: 'When your work needs review or a review is requested.', on: true },
  { title: 'Export ready', desc: 'When a dataset export finishes processing.', on: true },
  { title: 'Weekly summary', desc: "A digest of your team's labeling progress.", on: false },
  { title: 'Product updates', desc: 'New features and improvements.', on: false },
];

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [accent, setAccent] = useState(ACCENTS[0]);

  // Profile form — seeded from Clerk once loaded; title/bio live in unsafeMetadata
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    const meta = (user.unsafeMetadata ?? {}) as { title?: string; bio?: string };
    setTitle(meta.title ?? '');
    setBio(meta.bio ?? '');
  }, [user]);

  const initials = (`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase())
    || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const emailVerified = user?.primaryEmailAddress?.verification?.status === 'verified';

  async function saveProfile() {
    if (!user || savingProfile) return;
    setSavingProfile(true);
    try {
      await user.update({ firstName, lastName, unsafeMetadata: { ...user.unsafeMetadata, title, bio } });
      toast('Saved', 'Your profile has been updated.');
    } catch {
      toast('Save failed', 'Could not update your profile — try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function changeAvatar(file: File | null) {
    if (!user || !file) return;
    try {
      await user.setProfileImage({ file });
      toast('Photo updated', 'Your profile photo has been changed.');
    } catch {
      toast('Upload failed', 'Could not update your photo (max 10 MB).');
    }
  }
  const [teamRoles, setTeamRoles] = useState(TEAM.map(m => m.role));
  const [notifStates, setNotifStates] = useState(NOTIFS.map(n => n.on));
  const [compact, setCompact] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [toasts, setToasts] = useState<{id: number; title: string; msg: string}[]>([]);
  const toastId = useRef(0);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Labeler');
  const [inviteError, setInviteError] = useState('');
  const [pendingInvites, setPendingInvites] = useState<{ email: string; role: Role }[]>([]);
  const inviteEmailRef = useRef<HTMLInputElement>(null);

  function toast(title: string, msg: string) {
    const id = ++toastId.current;
    setToasts(prev => [...prev, {id, title, msg}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }

  function openInvite() {
    setInviteEmail(''); setInviteRole('Labeler'); setInviteError('');
    setInviteOpen(true);
    setTimeout(() => inviteEmailRef.current?.focus(), 60);
  }

  function sendInvite() {
    if (!inviteEmail.trim()) { setInviteError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) { setInviteError('Please enter a valid email address.'); return; }
    if (TEAM.some(m => m.e === inviteEmail.trim()) || pendingInvites.some(p => p.email === inviteEmail.trim())) {
      setInviteError('This email is already a member or has a pending invite.'); return;
    }
    setPendingInvites(prev => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteOpen(false);
    toast('Invitation sent', `An invite was sent to ${inviteEmail.trim()} as ${inviteRole}.`);
    setInviteEmail(''); setInviteRole('Labeler'); setInviteError('');
  }

  return (
    <div className="ds app-shell sett" style={{display:'grid',gridTemplateColumns:'248px 1fr',height:'100vh',overflow:'hidden'}}>
      <AppSidebar active="settings" />

      <div className="sett-main">
        <header className="sett-topbar"><h1>Settings</h1></header>

        <div className="sett-layout">
          {/* Side tabs */}
          <nav className="settabs">
            {TABS.map(t => (
              <button key={t.key} className={`settab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.icon}{t.label}
              </button>
            ))}
          </nav>

          <div className="panels">
            {/* PROFILE */}
            <div className={`sett-panel${activeTab === 'profile' ? ' active' : ''}`}>
              <div className="sec">
                <div className="sec-h"><h3>Profile</h3><p>This information is visible to your team across the workspace.</p></div>
                <div className="sec-b">
                  <div className="frow">
                    <div className="lbl"><b>Photo</b><span>PNG or JPG, up to 10 MB.</span></div>
                    <div className="avatar-edit">
                      <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg" style={{display:'none'}} onChange={e => changeAvatar(e.target.files?.[0] ?? null)} />
                      {user?.imageUrl
                        ? <img src={user.imageUrl} alt="Profile" className="avatar-big" style={{objectFit:'cover'}} />
                        : <div className="avatar-big">{initials}</div>
                      }
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn btn-outline btn-sm" onClick={() => avatarInputRef.current?.click()}>Upload new</button>
                      </div>
                    </div>
                  </div>
                  <div className="frow">
                    <div className="lbl"><b>Full name</b></div>
                    <div className="two-col">
                      <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"/>
                      <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name"/>
                    </div>
                  </div>
                  <div className="frow">
                    <div className="lbl"><b>Role / title</b></div>
                    <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. ML Engineer" style={{maxWidth:440}}/>
                  </div>
                  <div className="frow">
                    <div className="lbl"><b>Bio</b><span>A short description for your profile.</span></div>
                    <textarea className="textarea" style={{maxWidth:440}} value={bio} onChange={e => setBio(e.target.value)} placeholder="A few words about you"/>
                  </div>
                </div>
                <div className="sec-f">
                  <button className="btn btn-ghost" onClick={() => { if (user) { setFirstName(user.firstName ?? ''); setLastName(user.lastName ?? ''); } }}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</button>
                </div>
              </div>
            </div>

            {/* ACCOUNT */}
            <div className={`sett-panel${activeTab === 'account' ? ' active' : ''}`}>
              <div className="sec">
                <div className="sec-h"><h3>Account</h3><p>Manage your email, password, and security.</p></div>
                <div className="sec-b">
                  <div className="frow">
                    <div className="lbl"><b>Email address</b><span>Used for sign-in and notifications.</span></div>
                    <div className="input-group" style={{maxWidth:440}}>
                      <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6" strokeLinecap="round"/></svg>
                      <input className="input" value={email} readOnly/>
                      {emailVerified && <span className="badge badge-success trail" style={{marginRight:6}}>Verified</span>}
                    </div>
                  </div>
                  <div className="frow">
                    <div className="lbl"><b>Password &amp; security</b><span>Managed through your secure account portal.</span></div>
                    <button className="btn btn-outline" style={{width:'fit-content'}} onClick={() => openUserProfile()}>Manage account</button>
                  </div>
                  <div className="frow">
                    <div className="lbl"><b>Two-factor auth</b><span>Add an extra layer of security.</span></div>
                    <label className="switch">
                      <input type="checkbox" checked={twoFactor} onChange={e => setTwoFactor(e.target.checked)}/>
                      <span className="track"><span className="thumb"/></span>
                    </label>
                  </div>
                  <div className="frow">
                    <div className="lbl"><b>Active sessions</b><span>You&apos;re signed in on 2 devices.</span></div>
                    <button className="btn btn-ghost" style={{width:'fit-content',color:'var(--destructive)'}} onClick={() => toast('Signed out','All other sessions have been signed out.')}>Sign out all other sessions</button>
                  </div>
                </div>
              </div>
              <div className="sec danger-zone">
                <div className="sec-h"><h3 style={{color:'var(--destructive)'}}>Danger zone</h3><p>Irreversible and destructive actions.</p></div>
                <div className="sec-b">
                  <div className="danger-row">
                    <div>
                      <b style={{fontSize:'var(--text-label-size)'}}>Delete account</b>
                      <div className="t-caption">Permanently remove your account and all data.</div>
                    </div>
                    <button className="btn btn-destructive">Delete account</button>
                  </div>
                </div>
              </div>
            </div>

            {/* APPEARANCE */}
            <div className={`sett-panel${activeTab === 'appearance' ? ' active' : ''}`}>
              <div className="sec">
                <div className="sec-h"><h3>Theme</h3><p>Choose how Annotation Studio looks. Syncs across your devices.</p></div>
                <div className="sec-b">
                  <div className="theme-cards">
                    {([['light','Light','pv-light'],['dark','Dark','pv-dark'],['system','System','pv-auto']] as const).map(([key, label, pvClass]) => (
                      <div key={key} className={`theme-card${mode === key ? ' sel' : ''}`} onClick={() => setMode(key)}>
                        <div className={`tc-preview ${pvClass}`}>
                          {key !== 'system' && <><div className="pv-bar"/><div className="pv-side"/><div className="pv-dot"/><div className="pv-dot2"/></>}
                        </div>
                        <div className="tc-row">
                          <span className="tc-nm">{label}</span>
                          <span className="tc-check"><CheckIcon /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sec">
                <div className="sec-h"><h3>Accent color</h3><p>Used for primary actions, focus, and selection.</p></div>
                <div className="sec-b">
                  <div className="accent-row">
                    {ACCENTS.map(c => (
                      <span key={c} className={`accent-swatch${accent === c ? ' sel' : ''}`} style={{background: c, color: c}} onClick={() => { setAccent(c); toast('Accent updated', `Primary color set to ${c}.`); }}>
                        <CheckIcon />
                      </span>
                    ))}
                  </div>
                  <p className="t-caption" style={{marginTop:14}}>A live preview of accent changes — the rest of these screens keep the default blue.</p>
                </div>
              </div>
              <div className="sec">
                <div className="sec-h"><h3>Workspace density</h3><p>Adjust spacing for the annotation interface.</p></div>
                <div className="sec-b" style={{display:'flex',flexDirection:'column',gap:0}}>
                  <div className="sw-row">
                    <div>
                      <b style={{fontSize:'var(--text-label-size)'}}>Compact mode</b>
                      <div className="t-caption">Tighter padding in lists and panels.</div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)}/>
                      <span className="track"><span className="thumb"/></span>
                    </label>
                  </div>
                  <div className="sw-row" style={{borderBottom:0}}>
                    <div>
                      <b style={{fontSize:'var(--text-label-size)'}}>Reduce motion</b>
                      <div className="t-caption">Minimize animations and transitions.</div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)}/>
                      <span className="track"><span className="thumb"/></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* TEAM */}
            <div className={`sett-panel${activeTab === 'team' ? ' active' : ''}`}>
              <div className="sec">
                <div className="sec-h">
                  <div className="sec-h-row">
                    <div><h3>Team members</h3><p>{TEAM.length + pendingInvites.length} members · 2 seats remaining on your plan.</p></div>
                    <button className="btn btn-primary btn-sm" onClick={openInvite}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                      Invite
                    </button>
                  </div>
                </div>
                <div className="sec-b" style={{paddingTop:8}}>
                  {TEAM.map((m, i) => (
                    <div key={m.e} className="team-row">
                      <span className="avatar md" style={{background: m.c, color: '#fff', position: 'relative'}}>{m.i}</span>
                      <div className="team-meta">
                        <b>
                          {m.n}
                          {m.on && <span className="badge badge-success" style={{height:16,fontSize:10,marginLeft:4}}><span className="dot"/>online</span>}
                        </b>
                        <span>{m.e}</span>
                      </div>
                      <div className="select-wrap">
                        <select
                          className="select-native"
                          style={{height:32,width:130,fontSize:'var(--text-label-size)'}}
                          value={teamRoles[i]}
                          onChange={e => setTeamRoles(prev => prev.map((r,j) => j === i ? e.target.value : r))}
                        >
                          {['Owner','Admin','Reviewer','Labeler'].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <button className="icon-btn sm" aria-label="More">
                        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                      </button>
                    </div>
                  ))}
                  {pendingInvites.map(pi => (
                    <div key={pi.email} className="team-row">
                      <span className="avatar md" style={{background:'var(--surface-variant)',color:'var(--muted-foreground)'}}>?</span>
                      <div className="team-meta">
                        <b style={{display:'flex',alignItems:'center',gap:8}}>
                          {pi.email}
                          <span className="badge badge-warning" style={{height:18,fontSize:10}}>Pending</span>
                        </b>
                        <span>Invited · {pi.role}</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setPendingInvites(prev => prev.filter(p => p.email !== pi.email)); toast('Invite revoked', `Invite to ${pi.email} has been revoked.`); }}>Revoke</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            <div className={`sett-panel${activeTab === 'notifications' ? ' active' : ''}`}>
              <div className="sec">
                <div className="sec-h"><h3>Notifications</h3><p>Choose what you&apos;d like to hear about.</p></div>
                <div className="sec-b">
                  {NOTIFS.map((n, i) => (
                    <div key={n.title} className={`notif-row${i === NOTIFS.length - 1 ? ' last' : ''}`} style={i === NOTIFS.length - 1 ? {borderBottom:0} : {}}>
                      <div>
                        <b>{n.title}</b>
                        <span>{n.desc}</span>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={notifStates[i]} onChange={e => setNotifStates(prev => prev.map((s,j) => j === i ? e.target.checked : s))}/>
                        <span className="track"><span className="thumb"/></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INVITE MODAL ── */}
      <div className={`scrim${inviteOpen ? ' open' : ''}`} onClick={() => setInviteOpen(false)}>
        <div className="dialog sett-invite-dlg" role="dialog" aria-modal="true" aria-labelledby="inv-ttl" onClick={e => e.stopPropagation()}>
          <div className="sett-dlg-head">
            <h3 id="inv-ttl">Invite team member</h3>
            <button className="icon-btn sm" aria-label="Close" onClick={() => setInviteOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
          <div className="sett-dlg-body">
            <div className="field" style={{marginBottom:16}}>
              <label htmlFor="inv-email" style={{fontSize:'var(--text-label-size)',fontWeight:600,marginBottom:6,display:'block'}}>Email address</label>
              <input
                id="inv-email"
                ref={inviteEmailRef}
                className="input"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                aria-invalid={inviteError ? 'true' : undefined}
                onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') sendInvite(); if (e.key === 'Escape') setInviteOpen(false); }}
              />
              {inviteError && <p className="inv-error">{inviteError}</p>}
            </div>
            <div className="field">
              <label htmlFor="inv-role" style={{fontSize:'var(--text-label-size)',fontWeight:600,marginBottom:6,display:'block'}}>Role</label>
              <div className="select-wrap">
                <select
                  id="inv-role"
                  className="select-native"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)}
                >
                  {(['Owner','Admin','Reviewer','Labeler'] as Role[]).map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <p className="inv-role-desc">{ROLE_DESCS[inviteRole]}</p>
            </div>
          </div>
          <div className="sett-dlg-foot">
            <button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={sendInvite}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M22 2L11 13M22 2L15 22l-4-9-9-4Z"/></svg>
              Send invite
            </button>
          </div>
        </div>
      </div>

      {/* TOAST HOST */}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} style={{
            display:'flex',gap:12,alignItems:'flex-start',minWidth:280,maxWidth:360,
            background:'var(--surface)',border:'1px solid var(--outline)',borderLeft:'3px solid var(--primary)',
            borderRadius:'var(--radius-lg)',boxShadow:'var(--elevation-4)',padding:'12px 14px',
          }}>
            <span style={{color:'var(--primary)',flexShrink:0,width:18,height:18,marginTop:1}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div style={{flex:1}}>
              <div className="t-label" style={{marginBottom:2}}>{t.title}</div>
              <div className="t-caption">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
