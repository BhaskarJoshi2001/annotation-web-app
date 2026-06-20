'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import './auth.css';

type View = 'signin' | 'signup' | 'forgot' | 'sent' | 'reset' | 'resetdone' | 'verify';

function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 36 36" fill="none">
      <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)"/>
      <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="#fff" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round"/>
      <rect x="6" y="6" width="5" height="5" rx="1.5" fill="#fff"/>
      <rect x="25" y="6" width="5" height="5" rx="1.5" fill="#fff"/>
      <rect x="6" y="25" width="5" height="5" rx="1.5" fill="#fff"/>
      <rect x="25" y="25" width="5" height="5" rx="1.5" fill="#fff"/>
    </svg>
  );
}

const STRENGTH_COLORS = ['var(--destructive)','var(--warning)','var(--warning)','var(--success)'];
const STRENGTH_LABELS = ['Weak password','Fair — add more variety','Good','Strong password'];

function scorePw(v: string): number {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

function StrengthMeter({ password }: { password: string }) {
  const score = password ? scorePw(password) : 0;
  const label = password ? STRENGTH_LABELS[Math.max(0, score - 1)] : 'Use 8+ characters with a mix of letters, numbers & symbols.';
  return (
    <>
      <div className="strength">
        {[0,1,2,3].map(i => (
          <div key={i} className="seg" style={password && i < score ? {background: STRENGTH_COLORS[Math.max(0, score-1)]} : {}}/>
        ))}
      </div>
      <span className="hint">{label}</span>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 1C5.92 1 1 5.92 1 12c0 4.87 3.16 9 7.54 10.46.55.1.75-.24.75-.53v-1.86c-3.07.67-3.72-1.48-3.72-1.48-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.69 2.59 1.2 3.22.92.1-.72.39-1.2.7-1.48-2.45-.28-5.03-1.23-5.03-5.46 0-1.21.43-2.2 1.14-2.97-.11-.28-.5-1.4.11-2.92 0 0 .93-.3 3.05 1.13a10.6 10.6 0 0 1 5.56 0c2.12-1.43 3.05-1.13 3.05-1.13.61 1.52.22 2.64.11 2.92.71.77 1.13 1.76 1.13 2.97 0 4.24-2.58 5.18-5.04 5.45.4.34.75 1.01.75 2.04v3.03c0 .3.2.64.76.53A11.01 11.01 0 0 0 23 12c0-6.08-4.92-11-11-11z"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';

  const [view, setView] = useState<View>('signin');
  const [loading, setLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showSiPw, setShowSiPw] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);
  const [showRsPw, setShowRsPw] = useState(false);
  const [showRsConf, setShowRsConf] = useState(false);
  const [suPassword, setSuPassword] = useState('');
  const [rsPassword, setRsPassword] = useState('');
  const [rsConfirm, setRsConfirm] = useState('');
  const [rsMatchErr, setRsMatchErr] = useState(false);
  const [siEmail, setSiEmail] = useState('ana@acmevision.ai');
  const [siEmailErr, setSiEmailErr] = useState(false);
  const [suEmailErr, setSuEmailErr] = useState(false);
  const [fpEmailErr, setFpEmailErr] = useState(false);

  const emailOK = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOK(siEmail)) { setSiEmailErr(true); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); router.push('/dashboard'); }, 900);
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    if (!emailOK(email)) { setSuEmailErr(true); return; }
    setSignupEmail(email);
    setView('verify');
  }

  function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    if (!emailOK(email)) { setFpEmailErr(true); return; }
    setForgotEmail(email);
    setView('sent');
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (scorePw(rsPassword) < 2 || rsPassword.length < 8) return;
    if (rsPassword !== rsConfirm) { setRsMatchErr(true); return; }
    setRsMatchErr(false);
    setTimeout(() => setView('resetdone'), 900);
  }

  return (
    <div className="ds auth-page">
      {/* BRAND SIDE */}
      <div className="brand-side">
        <div className="brand-bg" />
        <div className="brand-mesh" />
        <div className="blogo">
          <LogoMark />
          <b>Annotation Studio</b>
        </div>
        <div className="bhero">
          <h1>Label data your model can actually trust.</h1>
          <p>Bounding boxes, polygons, and keypoints with model-assisted labeling, review workflows, and one-click export to COCO &amp; YOLO.</p>
          <div className="demo-frame">
            <div className="ph" />
            {[
              {bc:'#3b6af5', left:'14%', top:'42%', w:'22%', h:'34%', label:'car 98%', delay:0},
              {bc:'#10b981', left:'44%', top:'38%', w:'28%', h:'40%', label:'truck 94%', delay:250},
              {bc:'#8b5cf6', left:'76%', top:'48%', w:'12%', h:'30%', label:'person', delay:500},
            ].map((b, i) => (
              <span
                key={i}
                className="dmb"
                style={{'--bc': b.bc, left: b.left, top: b.top, width: b.w, height: b.h, animationDelay: `${b.delay}ms`} as React.CSSProperties}
              >
                <span className="dlab">{b.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="quote">
            <div className="av" />
            <div className="qt">
              &ldquo;We cut labeling time by 60% and shipped our detector a month early.&rdquo;
              <b>Priya Nair · ML Lead, Northbeam</b>
            </div>
          </div>
          <div className="blogos">{['NORTHBEAM','VECTRA','OAKRIDGE AI','HELIX'].map(n => <span key={n}>{n}</span>)}</div>
        </div>
      </div>

      {/* FORM SIDE */}
      <div className="form-side">
        <div className="form-topnav">
          {view === 'signin'
            ? <><span className="t-caption muted">New here?</span><button className="btn btn-outline btn-sm" onClick={() => setView('signup')}>Create account</button></>
            : view === 'signup'
            ? <><span className="t-caption muted">Already have one?</span><button className="btn btn-outline btn-sm" onClick={() => setView('signin')}>Sign in</button></>
            : null
          }
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(isDark ? 'light' : 'dark')}>
            {isDark
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
            }
          </button>
        </div>

        <div className="formwrap">
          {/* SIGN IN */}
          {view === 'signin' && (
            <div>
              <div className="form-head"><h2>Welcome back</h2><p>Sign in to continue to your workspace.</p></div>
              <div className="oauth">
                <button className="oauth-btn"><GoogleIcon />Google</button>
                <button className="oauth-btn"><GitHubIcon />GitHub</button>
              </div>
              <div className="divider-or">or continue with email</div>
              <form className="form-fields" onSubmit={handleSignin} noValidate>
                <div className="field">
                  <label htmlFor="si-email">Email</label>
                  <div className="input-group">
                    <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6" strokeLinecap="round"/></svg>
                    <input className="input" id="si-email" type="email" placeholder="you@company.com" value={siEmail} onChange={e => { setSiEmail(e.target.value); setSiEmailErr(false); }} aria-invalid={siEmailErr}/>
                  </div>
                </div>
                <div className="field">
                  <div className="form-row">
                    <label htmlFor="si-pw">Password</label>
                    <a onClick={() => setView('forgot')}>Forgot password?</a>
                  </div>
                  <div className="pw-wrap">
                    <input className="input" id="si-pw" type={showSiPw ? 'text' : 'password'} placeholder="••••••••" defaultValue="supersecret"/>
                    <button type="button" className="icon-btn sm pw-toggle" onClick={() => setShowSiPw(v => !v)} aria-label="Show password"><EyeIcon /></button>
                  </div>
                </div>
                <label className="check" style={{fontSize:'var(--text-label-size)'}}>
                  <input type="checkbox" defaultChecked/>
                  <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  Keep me signed in
                </label>
                <button className="btn btn-primary btn-lg btn-block" type="submit" data-loading={loading || undefined}>
                  {loading && <span className="spinner"/>}
                  <span className="btn-label">Sign in</span>
                </button>
              </form>
            </div>
          )}

          {/* SIGN UP */}
          {view === 'signup' && (
            <div>
              <div className="form-head"><h2>Create your account</h2><p>Already have one? <a onClick={() => setView('signin')}>Sign in</a></p></div>
              <div className="oauth">
                <button className="oauth-btn"><GoogleIcon />Google</button>
                <button className="oauth-btn"><GitHubIcon />GitHub</button>
              </div>
              <div className="divider-or">or sign up with email</div>
              <form className="form-fields" onSubmit={handleSignup} noValidate>
                <div className="field">
                  <label htmlFor="su-name">Full name</label>
                  <input className="input" id="su-name" placeholder="Ana Marquez"/>
                </div>
                <div className="field">
                  <label htmlFor="su-email">Work email</label>
                  <div className="input-group">
                    <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6" strokeLinecap="round"/></svg>
                    <input className="input" id="su-email" name="email" type="email" placeholder="you@company.com" aria-invalid={suEmailErr} onChange={() => setSuEmailErr(false)}/>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="su-pw">Password</label>
                  <div className="pw-wrap">
                    <input className="input" id="su-pw" type={showSuPw ? 'text' : 'password'} placeholder="At least 8 characters" value={suPassword} onChange={e => setSuPassword(e.target.value)}/>
                    <button type="button" className="icon-btn sm pw-toggle" onClick={() => setShowSuPw(v => !v)} aria-label="Show password"><EyeIcon /></button>
                  </div>
                  <StrengthMeter password={suPassword} />
                </div>
                <button className="btn btn-primary btn-lg btn-block" type="submit">Create account</button>
                <p className="terms">By creating an account you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
              </form>
            </div>
          )}

          {/* FORGOT */}
          {view === 'forgot' && (
            <div>
              <div className="form-head"><h2>Reset password</h2><p>Enter your email and we&apos;ll send a reset link.</p></div>
              <form className="form-fields" onSubmit={handleForgot} noValidate>
                <div className="field">
                  <label htmlFor="fp-email">Email</label>
                  <div className="input-group">
                    <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6" strokeLinecap="round"/></svg>
                    <input className="input" id="fp-email" name="email" type="email" placeholder="you@company.com" aria-invalid={fpEmailErr} onChange={() => setFpEmailErr(false)}/>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg btn-block" type="submit">Send reset link</button>
                <button className="btn btn-ghost btn-block" type="button" onClick={() => setView('signin')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back to sign in
                </button>
              </form>
            </div>
          )}

          {/* LINK SENT */}
          {view === 'sent' && (
            <div className="verify-state">
              <div className="verify-icon" style={{background:'var(--success-container)',color:'var(--success)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9"/><path d="m2 7 10 6 10-6"/><path d="m16 19 2 2 4-4"/></svg>
              </div>
              <h2 className="t-headline" style={{margin:'0 0 8px'}}>Reset link sent</h2>
              <p className="muted" style={{margin:'0 0 28px'}}>We sent a reset link to <span className="verify-email">{forgotEmail}</span>. It expires in 30 minutes.</p>
              <button className="btn btn-primary btn-block" onClick={() => setView('reset')}>I have the link — set new password</button>
              <button className="btn btn-ghost btn-block" style={{marginTop:10}} onClick={() => setView('signin')}>Back to sign in</button>
            </div>
          )}

          {/* RESET */}
          {view === 'reset' && (
            <div>
              <div className="form-head">
                <h2>Set a new password</h2>
                <p>For <span style={{fontFamily:'var(--font-mono)',color:'var(--foreground)',fontWeight:600}}>{forgotEmail}</span>. Choose something you haven&apos;t used before.</p>
              </div>
              <form className="form-fields" onSubmit={handleReset} noValidate>
                <div className="field">
                  <label htmlFor="rs-pw">New password</label>
                  <div className="pw-wrap">
                    <input className="input" id="rs-pw" type={showRsPw ? 'text' : 'password'} placeholder="At least 8 characters" value={rsPassword} onChange={e => setRsPassword(e.target.value)}/>
                    <button type="button" className="icon-btn sm pw-toggle" onClick={() => setShowRsPw(v => !v)} aria-label="Show password"><EyeIcon /></button>
                  </div>
                  <StrengthMeter password={rsPassword} />
                </div>
                <div className="field">
                  <label htmlFor="rs-confirm">Confirm password</label>
                  <div className="pw-wrap">
                    <input className="input" id="rs-confirm" type={showRsConf ? 'text' : 'password'} placeholder="Re-enter password" value={rsConfirm} onChange={e => { setRsConfirm(e.target.value); setRsMatchErr(false); }} aria-invalid={rsMatchErr}/>
                    <button type="button" className="icon-btn sm pw-toggle" onClick={() => setShowRsConf(v => !v)} aria-label="Show password"><EyeIcon /></button>
                  </div>
                  {rsMatchErr && (
                    <span className="err" style={{display:'flex',gap:4,alignItems:'center'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                      Passwords don&apos;t match.
                    </span>
                  )}
                </div>
                <button className="btn btn-primary btn-lg btn-block" type="submit">Update password</button>
              </form>
            </div>
          )}

          {/* RESET DONE */}
          {view === 'resetdone' && (
            <div className="verify-state">
              <div className="verify-icon" style={{background:'var(--success-container)',color:'var(--success)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </div>
              <h2 className="t-headline" style={{margin:'0 0 8px'}}>Password updated</h2>
              <p className="muted" style={{margin:'0 0 28px'}}>Your password has been changed. You can now sign in with your new credentials.</p>
              <button className="btn btn-primary btn-block" onClick={() => setView('signin')}>Continue to sign in</button>
            </div>
          )}

          {/* VERIFY EMAIL */}
          {view === 'verify' && (
            <div className="verify-state">
              <div className="verify-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
              </div>
              <h2 className="t-headline" style={{margin:'0 0 8px'}}>Check your inbox</h2>
              <p className="muted" style={{margin:'0 0 28px'}}>We sent a verification link to <span className="verify-email">{signupEmail}</span>. Click it to activate your account.</p>
              <button className="btn btn-primary btn-block" onClick={() => router.push('/onboarding')}>Open email app</button>
              <button className="btn btn-ghost btn-block" style={{marginTop:10}}>Resend link</button>
              <p className="t-caption muted" style={{marginTop:20}}>
                Wrong address? <a onClick={() => setView('signup')} style={{color:'var(--primary)',cursor:'pointer',textDecoration:'none',fontWeight:600}}>Go back</a>
              </p>
            </div>
          )}
        </div>

        <div className="footer-note">
          © 2026 Annotation Studio · <Link href="/landing">Home</Link> · <a href="#">Privacy</a> · <a href="#">Terms</a>
        </div>
      </div>
    </div>
  );
}
