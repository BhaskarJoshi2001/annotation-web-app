'use client';

import { useState, useRef, useCallback } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import '../app-shell.css';
import './models.css';

interface Toast { id: number; title: string; msg: string; }

export default function ModelsPage() {
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';
  const [notified, setNotified] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const addToast = useCallback((title: string, msg: string) => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3600);
  }, []);

  function handleNotify() {
    setNotified(true);
    addToast("You're on the list", "We'll email bj8212553@gmail.com the moment AI-assisted labeling ships.");
  }

  return (
    <div className="ds mdls-pg">
      <AppSidebar active="models" showUsage />

      <div className="main">
        <header className="topbar">
          <h1>Models</h1>
          <div className="grow" />
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(isDark ? 'light' : 'dark')}>
            {isDark
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            }
          </button>
        </header>

        <div className="stage">
          <div className="glow" />
          <div className="glow violet" />

          <div className="teaser">
            <div className="hero-ico">
              <span className="pulse" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
                <circle cx="12" cy="12" r="3.4" />
              </svg>
            </div>

            <div className="cs-badge"><span className="dot" />Coming soon · Beta</div>
            <h2>AI-assisted labeling</h2>
            <p className="lede">
              Use Segment Anything (SAM) to auto-generate polygon masks with a single click.
              Reduce annotation time by 60%. Available soon to Pro workspaces.
            </p>

            <div className="feat-list">
              {[
                { title: 'Click-to-segment with SAM', desc: 'One click on any object yields a precise mask' },
                { title: 'Box → polygon conversion', desc: 'Turn any bounding box into a tight polygon' },
                { title: 'Model-in-the-loop', desc: 'Pre-label with your own checkpoint, then refine' },
              ].map(f => (
                <div key={f.title} className="feat">
                  <span className="chk">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                  </span>
                  <div className="ft"><b>{f.title}</b><span>{f.desc}</span></div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={handleNotify}
              disabled={notified}
            >
              {notified ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><path d="M5 12l5 5L20 7" /></svg>
                  You&apos;re on the list
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                  Notify me when it&apos;s ready
                </>
              )}
            </button>
            <p className="notify-cap">
              You&apos;ll get an email at <b>bj8212553@gmail.com</b>
            </p>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast-item show">
            <span style={{ color: 'var(--primary)', flex: 'none', width: 18, height: 18, marginTop: 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
