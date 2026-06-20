'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import './onboarding.css';

const TOTAL = 4;

const PALETTE = ['#f59e0b','#06b6d4','#ec4899','#10b981','#8b5cf6','#f97316','#3b6af5'];
const GRADIENTS = [
  'linear-gradient(135deg,#3b4a66,#1f2a40)',
  'linear-gradient(135deg,#4a3b52,#2a1f33)',
  'linear-gradient(135deg,#3b5246,#1f3329)',
  'linear-gradient(135deg,#52473b,#332a1f)',
  'linear-gradient(135deg,#3b4f52,#1f3033)',
  'linear-gradient(135deg,#46395a,#241f33)',
  'linear-gradient(135deg,#3b4a66,#222a3a)',
  'linear-gradient(135deg,#4f3b3b,#331f1f)',
  'linear-gradient(135deg,#3b5246,#1f3329)',
  'linear-gradient(135deg,#3d4257,#23262e)',
  'linear-gradient(135deg,#42506b,#262d3d)',
];

interface ClassEntry { name: string; color: string; }

const INIT_CLASSES: ClassEntry[] = [
  { name: 'car', color: 'var(--blue-500)' },
  { name: 'pedestrian', color: 'var(--violet-500)' },
  { name: 'traffic light', color: 'var(--green-500)' },
];

const ROLES = [
  { key: 'ml', label: 'Train an ML model', desc: 'Build datasets for object detection or segmentation.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 8 0v-1a4 4 0 0 0 0-8V6a4 4 0 0 0-4-4z"/><path d="M12 7v10"/></svg> },
  { key: 'team', label: 'Manage a labeling team', desc: 'Assign work, review quality, track throughput.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg> },
  { key: 'research', label: 'Research & explore', desc: 'Experiment with CV datasets and annotations.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/></svg> },
  { key: 'other', label: 'Something else', desc: 'Just exploring what\'s possible for now.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> },
];

const TASKS = [
  { key: 'bbox', label: 'Bounding box', vis: <div className="tt-box"/> },
  { key: 'poly', label: 'Polygon', vis: <div className="tt-poly"/> },
  { key: 'multi', label: 'Mixed', vis: <div className="tt-cls"><i/><i/><i/><i/></div> },
];

const STEPS_META = [
  { label: 'Your workspace', sub: "How you'll use Studio" },
  { label: 'Create a project', sub: 'Name, task, and classes' },
  { label: 'Upload images', sub: 'Your first batch' },
  { label: 'Start labeling', sub: "You're all set" },
];

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
      <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)"/>
      <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="var(--on-primary)" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round"/>
      <rect x="6" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="25" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="6" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="25" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { mode, setMode } = useTheme();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState('ml');
  const [projectName, setProjectName] = useState('Traffic Cameras');
  const [task, setTask] = useState('bbox');
  const [classes, setClasses] = useState<ClassEntry[]>(INIT_CLASSES);
  const [addingClass, setAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [palIdx, setPalIdx] = useState(PALETTE.length - 3);
  const [uploaded, setUploaded] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [doneBadge, setDoneBadge] = useState(false);

  useEffect(() => {
    if (step !== TOTAL - 1) { setDoneBadge(false); return; }
    const t = setTimeout(() => setDoneBadge(true), 100);
    return () => clearTimeout(t);
  }, [step]);

  function go(n: number) { setStep(Math.max(0, Math.min(TOTAL - 1, n))); }

  function handleNext() {
    if (step === TOTAL - 1) { router.push('/dashboard'); return; }
    go(step + 1);
  }

  function simulateUpload() {
    if (uploaded) return;
    setUploaded(true);
    GRADIENTS.slice(0, 11).forEach((g, i) => {
      setTimeout(() => setThumbs(prev => [...prev, g]), i * 70);
    });
  }

  function addClass() {
    const name = newClassName.trim();
    if (!name) { setAddingClass(false); setNewClassName(''); return; }
    const color = PALETTE[palIdx % PALETTE.length];
    setClasses(prev => [...prev, { name, color }]);
    setPalIdx(p => p + 1);
    setNewClassName('');
    setAddingClass(false);
  }

  function removeClass(i: number) {
    setClasses(prev => prev.filter((_, j) => j !== i));
  }

  const nextLabel = step === TOTAL - 1
    ? 'Go to workspace'
    : step === 2 && !uploaded
    ? 'Skip for now'
    : 'Continue';

  return (
    <div className="ds onboard">
      {/* RAIL */}
      <aside className="ob-rail">
        <div className="ob-brand">
          <LogoMark />
          <b>Annotation Studio</b>
        </div>
        <div className="ob-steps">
          {STEPS_META.map((s, i) => (
            <div key={i} className={`ob-step${i === step ? ' active' : i < step ? ' done' : ''}`}>
              <div className="ob-marker">
                <div className="ob-dot">
                  <span className="num">{i + 1}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </div>
                {i < STEPS_META.length - 1 && <div className="ob-line"/>}
              </div>
              <div className="ob-txt"><b>{s.label}</b><span>{s.sub}</span></div>
            </div>
          ))}
        </div>
        <div className="rail-foot">
          <div className="tip-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>
            <p><b>Tip:</b> You can change task type and classes anytime from project settings.</p>
          </div>
        </div>
      </aside>

      {/* STAGE */}
      <div className="ob-stage">
        <div className="stage-top">
          <div className="stage-prog">Step <b>{step + 1}</b> of {TOTAL}</div>
          <div className="stage-actions">
            {step < TOTAL - 1 && (
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
                Skip setup
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            )}
            <div className="theme-switch" role="group" aria-label="Theme">
              {(['light','dark','system'] as const).map(t => (
                <button key={t} data-theme-btn={t} aria-pressed={mode === t} onClick={() => setMode(t)} title={t}>
                  {t === 'light' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>}
                  {t === 'dark' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>}
                  {t === 'system' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stage-body">
          <div className="ob-panel">

            {/* SCENE 0 — Role */}
            {step === 0 && (
              <section>
                <div className="panel-head">
                  <div className="eyebrow">Welcome, Jordan</div>
                  <h1>What brings you to Studio?</h1>
                  <p>This helps us tailor your defaults — tools, export formats, and review workflow. You can change everything later.</p>
                </div>
                <div className="opt-cards">
                  {ROLES.map(r => (
                    <button key={r.key} className={`opt-card${role === r.key ? ' sel' : ''}`} onClick={() => setRole(r.key)}>
                      <div className="oc-ico">{r.icon}</div>
                      <b>{r.label}</b>
                      <span>{r.desc}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* SCENE 1 — Project setup */}
            {step === 1 && (
              <section>
                <div className="panel-head">
                  <div className="eyebrow">New project</div>
                  <h1>Set up your first project</h1>
                  <p>Give it a name, choose what you&apos;re labeling, and seed a few classes to get started.</p>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="pname">Project name</label>
                    <input className="input" id="pname" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Retail Shelf Audit"/>
                  </div>
                  <div className="field">
                    <label>Annotation task</label>
                    <div className="tasktype">
                      {TASKS.map(t => (
                        <button key={t.key} className={`tt${task === t.key ? ' sel' : ''}`} onClick={() => setTask(t.key)}>
                          <div className="tt-vis">{t.vis}</div>
                          <b>{t.label}</b>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label>Classes <span className="hint" style={{fontWeight:400}}>— add the objects you&apos;ll label</span></label>
                    <div className="class-row">
                      {classes.map((c, i) => (
                        <span key={i} className="class-chip">
                          <span className="cdot" style={{background: c.color}}/>
                          {c.name}
                          <span className="cx" onClick={() => removeClass(i)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                          </span>
                        </span>
                      ))}
                      {addingClass
                        ? (
                          <span className="class-chip" style={{borderColor:'var(--primary)',background:'var(--input-bg)'}}>
                            <span className="cdot" style={{background: PALETTE[palIdx % PALETTE.length]}}/>
                            <input
                              className="class-input"
                              style={{border:0,outline:'none',background:'transparent',fontFamily:'var(--font-sans)',fontSize:'var(--text-label-size)',fontWeight:500,color:'var(--foreground)',width:96,padding:0}}
                              placeholder="Class name"
                              autoFocus
                              value={newClassName}
                              onChange={e => setNewClassName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addClass(); if (newClassName.trim()) setAddingClass(true); } if (e.key === 'Escape') { setAddingClass(false); setNewClassName(''); } }}
                              onBlur={addClass}
                            />
                          </span>
                        )
                        : <button className="add-class" onClick={() => setAddingClass(true)}>+ Add class</button>
                      }
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SCENE 2 — Upload */}
            {step === 2 && (
              <section>
                <div className="panel-head">
                  <div className="eyebrow">Upload</div>
                  <h1>Add your first images</h1>
                  <p>Drop a batch to label. We support JPG, PNG, and WebP up to 50 MB each — or connect a cloud bucket later.</p>
                </div>
                {!uploaded ? (
                  <div
                    className="dropzone"
                    onClick={simulateUpload}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('drag')}
                    onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); simulateUpload(); }}
                  >
                    <div className="dz-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    </div>
                    <h3>Drag &amp; drop images here</h3>
                    <p>or <span className="dz-browse">browse your files</span></p>
                  </div>
                ) : (
                  <>
                    <div className="thumbs">
                      {thumbs.map((g, i) => (
                        <div key={i} className="thumb" style={{background: g, animationDelay: `${i * 30}ms`}}>
                          <div className="ov">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                          </div>
                        </div>
                      ))}
                      {thumbs.length >= 11 && <div className="thumb more">+13</div>}
                    </div>
                    <div className="upload-summary">
                      <div className="us-left">
                        <div className="us-ico">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                        </div>
                        <div className="us-text">
                          <b>24 images uploaded</b>
                          <span>Ready to label · 18.4 MB</span>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm">Add more</button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* SCENE 3 — Done */}
            {step === 3 && (
              <section>
                <div className="done-wrap">
                  <div className={`done-badge${doneBadge ? ' animate' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                  </div>
                  <h1 style={{margin:'0 0 var(--space-3)'}}>You&apos;re ready to label</h1>
                  <p className="t-body-lg muted" style={{margin:'0 auto',maxWidth:'46ch'}}>
                    &ldquo;{projectName || 'Untitled project'}&rdquo; is set up with {uploaded ? 24 : 0} images and {classes.length} classes. Jump into the workspace and draw your first box.
                  </p>
                  <div className="recap">
                    <div className="rc"><div className="k">Project</div><div className="v sm">{projectName || 'Untitled project'}</div></div>
                    <div className="rc"><div className="k">Images</div><div className="v">{uploaded ? '24' : '0'}</div></div>
                    <div className="rc"><div className="k">Classes</div><div className="v">{classes.length}</div></div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="stage-foot">
          <button className="btn btn-ghost" style={{visibility: step === 0 ? 'hidden' : 'visible'}} onClick={() => go(step - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
            Back
          </button>
          <ol className="foot-dots" style={{listStyle:'none',margin:0,padding:0}}>
            {Array.from({length: TOTAL}).map((_, i) => <li key={i} className={`${i === step ? 'on' : ''}`}/>)}
          </ol>
          <button className="btn btn-primary" onClick={handleNext}>
            {nextLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
