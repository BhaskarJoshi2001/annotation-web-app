'use client';

import { useState, useEffect, useRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignIn, useSignUp, useAuth, useClerk } from '@clerk/nextjs';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import './auth.css';

type View = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

// ── SVG atoms ────────────────────────────────────────────────────────────────

function LogoMarkBrand() {
  return (
    <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="34" height="34" rx="9" fill="#2563eb"/>
      <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="#fff" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round"/>
      <rect x="6" y="6" width="5" height="5" rx="1.5" fill="#fff"/>
      <rect x="25" y="6" width="5" height="5" rx="1.5" fill="#fff"/>
      <rect x="6" y="25" width="5" height="5" rx="1.5" fill="#fff"/>
      <rect x="25" y="25" width="5" height="5" rx="1.5" fill="#fff"/>
    </svg>
  );
}

function LogoMarkThemed() {
  return (
    <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)"/>
      <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="var(--on-primary)" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round"/>
      <rect x="6" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="25" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="6" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="25" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
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

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <path d="M3 3l18 18M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m3 7 9 6 9-6" strokeLinecap="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
    </svg>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

const STR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
const STR_LABELS = ['Weak — keep going', 'Fair — add more variety', 'Good password', 'Strong password'];

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
  const color = score ? STR_COLORS[score - 1] : 'var(--surface-variant)';
  const hint = password ? STR_LABELS[Math.max(0, score - 1)] : 'Use 8+ characters with a mix of letters, numbers & symbols.';
  return (
    <>
      <div className="strength">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="seg" style={password && i < score ? { background: color } : {}} />
        ))}
      </div>
      <div className="strength-hint" style={password ? { color } : {}}>
        {hint}
      </div>
    </>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="err-banner">
      <AlertIcon />
      <span>{msg}</span>
    </div>
  );
}

// ── OTP input ─────────────────────────────────────────────────────────────────

interface OtpHandle {
  getValue: () => string;
  clear: () => void;
  setError: (on: boolean) => void;
}

function OtpInput({ otpRef }: { otpRef: React.Ref<OtpHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(otpRef, () => ({
    getValue: () => inputRefs.current.map(r => r?.value ?? '').join(''),
    clear: () => {
      inputRefs.current.forEach(r => { if (r) { r.value = ''; r.classList.remove('filled'); } });
      containerRef.current?.classList.remove('error');
    },
    setError: (on: boolean) => containerRef.current?.classList.toggle('error', on),
  }));

  function handleInput(i: number, e: React.FormEvent<HTMLInputElement>) {
    const box = e.currentTarget;
    box.value = box.value.replace(/\D/g, '').slice(0, 1);
    box.classList.toggle('filled', !!box.value);
    containerRef.current?.classList.remove('error');
    if (box.value && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    const boxes = inputRefs.current;
    if (e.key === 'Backspace' && !e.currentTarget.value && i > 0) {
      const prev = boxes[i - 1];
      if (prev) { prev.value = ''; prev.classList.remove('filled'); prev.focus(); }
    }
    if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) boxes[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, k) => {
      if (inputRefs.current[k]) { inputRefs.current[k]!.value = d; inputRefs.current[k]!.classList.add('filled'); }
    });
    const next = Math.min(digits.length, 5);
    inputRefs.current[next]?.focus();
    containerRef.current?.classList.remove('error');
  }

  return (
    <div className="otp" ref={containerRef}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          maxLength={1}
          inputMode="numeric"
          aria-label={`Digit ${i + 1}`}
          ref={el => { inputRefs.current[i] = el; }}
          onInput={e => handleInput(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';

  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isSignedIn) router.replace('/dashboard'); }, [isSignedIn]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── View transitions ──
  const [activeView, setActiveView] = useState<View>('signin');
  const [leavingView, setLeavingView] = useState<View | null>(null);
  const [enteringView, setEnteringView] = useState<View | null>(null);

  function switchView(to: View) {
    if (to === activeView || leavingView !== null) return;
    setLeavingView(activeView);
    setTimeout(() => {
      setLeavingView(null);
      setActiveView(to);
      setEnteringView(to);
      setTimeout(() => setEnteringView(null), 300);
    }, 180);
  }

  function vc(v: View): string {
    if (v === leavingView) return 'view active leaving';
    if (v === activeView) return `view active${enteringView === v ? ' entering' : ''}`;
    return 'view';
  }

  // ── Sign in state ──
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [showSiPw, setShowSiPw] = useState(false);
  const [siEmailErr, setSiEmailErr] = useState(false);
  const [siPwErr, setSiPwErr] = useState(false);
  const [siError, setSiError] = useState('');
  const [siLoading, setSiLoading] = useState(false);

  // ── Sign up state ──
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [showSuPw, setShowSuPw] = useState(false);
  const [suNameErr, setSuNameErr] = useState(false);
  const [suEmailErr, setSuEmailErr] = useState(false);
  const [suPwErr, setSuPwErr] = useState(false);
  const [suError, setSuError] = useState('');
  const [suLoading, setSuLoading] = useState(false);

  // ── Verify state ──
  const verifyOtpRef = useRef<OtpHandle>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // ── Forgot state ──
  const [fpEmail, setFpEmail] = useState('');
  const [fpEmailErr, setFpEmailErr] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  // ── Reset state ──
  const resetOtpRef = useRef<OtpHandle>(null);
  const [rsNewPw, setRsNewPw] = useState('');
  const [rsConfirmPw, setRsConfirmPw] = useState('');
  const [showRsNewPw, setShowRsNewPw] = useState(false);
  const [showRsConfirmPw, setShowRsConfirmPw] = useState(false);
  const [rsNewPwErr, setRsNewPwErr] = useState(false);
  const [rsError, setRsError] = useState('');
  const [rsLoading, setRsLoading] = useState(false);

  // ── Email echo (shown in verify/reset views) ──
  const [emailEcho, setEmailEcho] = useState('');

  // ── Resend countdown ──
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => {
    if (activeView === 'verify') {
      verifyOtpRef.current?.clear();
      setVerifyError('');
      setResendCountdown(60);
    }
    if (activeView === 'reset') {
      resetOtpRef.current?.clear();
      setRsError('');
    }
  }, [activeView]);

  // ── Demo animation ──
  const demoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!demoRef.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    demoRef.current.querySelectorAll<HTMLElement>('.bbox').forEach((box, i) => {
      box.animate(
        [{ clipPath: 'inset(0 100% 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 500, delay: 120 + i * 180, easing: 'cubic-bezier(.3,0,0,1)', fill: 'none' }
      );
    });
  }, []);

  const emailOK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const clerkMsg = (err: { longMessage?: string; message: string }) => err.longMessage ?? err.message;

  // ── Google OAuth ──
  async function handleGoogleOAuth() {
    if (!clerk.client) return;
    const origin = window.location.origin;
    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${origin}/auth/sso-callback`,
        redirectUrlComplete: `${origin}/dashboard`,
      });
    } catch (err) {
      const e = err as { errors?: { longMessage?: string; message: string }[] };
      const msg = e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? 'Google sign-in failed.';
      if (activeView === 'signin') setSiError(msg);
      else setSuError(msg);
    }
  }

  // ── Sign in ──
  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    const eb = !emailOK(siEmail), pb = !siPassword;
    setSiEmailErr(eb); setSiPwErr(pb);
    if (eb || pb) return;
    setSiLoading(true); setSiError('');
    try {
      const { error } = await signIn.create({ identifier: siEmail, password: siPassword });
      if (error) { setSiError(clerkMsg(error)); return; }
      if (signIn.status === 'complete') { await signIn.finalize(); router.push('/dashboard'); }
    } finally { setSiLoading(false); }
  }

  // ── Sign up ──
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const nb = !suName.trim(), eb = !emailOK(suEmail), pb = suPassword.length < 8;
    setSuNameErr(nb); setSuEmailErr(eb); setSuPwErr(pb);
    if (nb || eb || pb) return;
    setSuLoading(true); setSuError('');
    try {
      const [firstName, ...rest] = suName.trim().split(' ');
      const { error } = await signUp.password({
        firstName, lastName: rest.join(' ') || undefined,
        emailAddress: suEmail, password: suPassword,
      });
      if (error) { setSuError(clerkMsg(error)); return; }
      if (signUp.status === 'complete') { await signUp.finalize(); router.push('/onboarding'); return; }
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) { setSuError(clerkMsg(sendErr)); return; }
      setEmailEcho(suEmail);
      switchView('verify');
    } finally { setSuLoading(false); }
  }

  // ── Verify email ──
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = verifyOtpRef.current?.getValue() ?? '';
    if (code.length < 6) { verifyOtpRef.current?.setError(true); setVerifyError('Enter all 6 digits.'); return; }
    setVerifyLoading(true); setVerifyError('');
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) { setVerifyError(clerkMsg(error)); verifyOtpRef.current?.setError(true); return; }
      if (signUp.status === 'complete') { await signUp.finalize(); router.push('/onboarding'); }
    } finally { setVerifyLoading(false); }
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    setVerifyError('');
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) { setVerifyError(clerkMsg(error)); return; }
      setResendCountdown(60);
    } catch { setVerifyError('Failed to resend. Please try again.'); }
  }

  // ── Forgot password ──
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOK(fpEmail)) { setFpEmailErr(true); return; }
    setFpLoading(true); setFpError('');
    try {
      const { error: createErr } = await signIn.create({ identifier: fpEmail });
      if (createErr) { setFpError(clerkMsg(createErr)); return; }
      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendErr) { setFpError(clerkMsg(sendErr)); return; }
      setEmailEcho(fpEmail);
      switchView('reset');
    } finally { setFpLoading(false); }
  }

  // ── Reset password ──
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const code = resetOtpRef.current?.getValue() ?? '';
    const cb = code.length < 6, pb = rsNewPw.length < 8, mb = rsNewPw !== rsConfirmPw && !!rsConfirmPw;
    resetOtpRef.current?.setError(cb);
    setRsNewPwErr(pb);
    if (cb) { setRsError('Enter all 6 digits of the reset code.'); return; }
    if (pb || mb) return;
    setRsLoading(true); setRsError('');
    try {
      const { error: verifyErr } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (verifyErr) { setRsError(clerkMsg(verifyErr)); resetOtpRef.current?.setError(true); return; }
      const { error: submitErr } = await signIn.resetPasswordEmailCode.submitPassword({
        password: rsNewPw, signOutOfOtherSessions: true,
      });
      if (submitErr) { setRsError(clerkMsg(submitErr)); return; }
      if (signIn.status === 'complete') { await signIn.finalize(); router.push('/dashboard'); }
    } finally { setRsLoading(false); }
  }

  // ── Context link (top right) ──
  const ctxNode = activeView === 'signin'
    ? <><span>New here?</span> <button onClick={() => switchView('signup')}>Create account</button></>
    : activeView === 'signup'
    ? <><span>Have an account?</span> <button onClick={() => switchView('signin')}>Sign in</button></>
    : null;

  const resendLabel = resendCountdown > 0
    ? `Resend in 0:${String(resendCountdown).padStart(2, '0')}`
    : 'Resend code';

  return (
    <div className="ds auth">

      {/* ── BRAND PANEL ── */}
      <aside className="brand-panel">
        <div className="dotgrid" />

        <div className="bp-logo">
          <LogoMarkBrand />
          <b>Annotation Studio</b>
        </div>

        <div className="bp-hero">
          <h1>Label data your model can trust.</h1>
          <p className="lede">The fastest way for CV teams to build, review, and ship precise training datasets.</p>

          <div className="demo" ref={demoRef} aria-hidden="true">
            <div className="scene" />
            <div className="bbox" style={{ '--bc': '#3b82f6', left: '32px', top: '78px', width: '96px', height: '84px' } as React.CSSProperties}>
              <span className="chip">car · 0.98</span>
            </div>
            <div className="bbox" style={{ '--bc': '#10b981', left: '150px', top: '104px', width: '70px', height: '58px' } as React.CSSProperties}>
              <span className="chip">person</span>
            </div>
            <div className="bbox" style={{ '--bc': '#8b5cf6', left: '236px', top: '60px', width: '74px', height: '46px' } as React.CSSProperties}>
              <span className="chip">sign</span>
            </div>
          </div>
        </div>

        <div className="bp-social">
          <div className="bp-quote">
            <span className="av" />
            <div>
              <div className="qt">&ldquo;We cut our labeling review time by 60% the first month. The keyboard-first workspace is unreal.&rdquo;</div>
              <div className="at">Mara Köhler · ML Lead, Horizon Robotics</div>
            </div>
          </div>
          <div className="bp-logos">
            {['Horizon', 'Vionix', 'Deepfield', 'Cartographe'].map(n => <span key={n}>{n}</span>)}
          </div>
        </div>
      </aside>

      {/* ── FORM PANEL ── */}
      <main className="form-panel">
        <div className="fp-top">
          <div className="fp-ctx">{ctxNode}</div>
          <button className="theme-toggle" onClick={() => setMode(isDark ? 'light' : 'dark')} aria-label="Toggle theme">
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className="fp-body">

          {/* Mobile logo */}
          <div className="fp-mobile-logo">
            <LogoMarkThemed />
            <b>Annotation Studio</b>
          </div>

          {/* ── SIGN IN ── */}
          <section className={vc('signin')}>
            <div className="vhead"><h2>Welcome back</h2><p>Sign in to your workspace.</p></div>
            <ErrBanner msg={siError} />
            <button className="au-btn au-btn-google" onClick={handleGoogleOAuth}>
              <GoogleIcon />Continue with Google
            </button>
            <div className="au-divider">or continue with email</div>
            <div className={`au-field${siEmailErr ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="si-email">Email</label></div>
              <div className="input-wrap has-lead">
                <MailIcon />
                <input
                  className="au-input" id="si-email" type="email"
                  placeholder="you@company.com" autoComplete="email"
                  value={siEmail}
                  onChange={e => { setSiEmail(e.target.value); setSiEmailErr(false); setSiError(''); }}
                />
              </div>
              <div className="field-msg"><AlertIcon />Enter a valid email.</div>
            </div>
            <div className={`au-field${siPwErr ? ' has-error' : ''}`}>
              <div className="field-label-row">
                <label htmlFor="si-pw">Password</label>
                <button type="button" className="link-sm" onClick={() => switchView('forgot')}>Forgot password?</button>
              </div>
              <div className="input-wrap">
                <input
                  className="au-input" id="si-pw" type={showSiPw ? 'text' : 'password'}
                  placeholder="••••••••" autoComplete="current-password"
                  value={siPassword}
                  onChange={e => { setSiPassword(e.target.value); setSiPwErr(false); setSiError(''); }}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowSiPw(v => !v)} aria-label="Toggle password">
                  {showSiPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="field-msg"><AlertIcon />Password is required.</div>
            </div>
            <button className="au-btn au-btn-primary" onClick={handleSignin} disabled={siLoading}>
              {siLoading && <span className="au-spin" />}
              Sign in
            </button>
            <div className="bottom-note">
              Don&apos;t have an account? <button onClick={() => switchView('signup')}>Create one</button>
            </div>
          </section>

          {/* ── SIGN UP ── */}
          <section className={vc('signup')}>
            <div className="vhead"><h2>Create your account</h2><p>Start labeling in minutes.</p></div>
            <ErrBanner msg={suError} />
            <button className="au-btn au-btn-google" onClick={handleGoogleOAuth}>
              <GoogleIcon />Sign up with Google
            </button>
            <div className="au-divider">or continue with email</div>
            <div className={`au-field${suNameErr ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="su-name">Full name</label></div>
              <div className="input-wrap has-lead">
                <UserIcon />
                <input
                  className="au-input" id="su-name" type="text"
                  placeholder="Ada Lovelace" autoComplete="name"
                  value={suName}
                  onChange={e => { setSuName(e.target.value); setSuNameErr(false); setSuError(''); }}
                />
              </div>
              <div className="field-msg"><AlertIcon />Name is required.</div>
            </div>
            <div className={`au-field${suEmailErr ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="su-email">Email</label></div>
              <div className="input-wrap has-lead">
                <MailIcon />
                <input
                  className="au-input" id="su-email" type="email"
                  placeholder="you@company.com" autoComplete="email"
                  value={suEmail}
                  onChange={e => { setSuEmail(e.target.value); setSuEmailErr(false); setSuError(''); }}
                />
              </div>
              <div className="field-msg"><AlertIcon />Enter a valid email.</div>
            </div>
            <div className={`au-field${suPwErr ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="su-pw">Password</label></div>
              <div className="input-wrap">
                <input
                  className="au-input" id="su-pw" type={showSuPw ? 'text' : 'password'}
                  placeholder="At least 8 characters" autoComplete="new-password"
                  value={suPassword}
                  onChange={e => { setSuPassword(e.target.value); setSuPwErr(false); setSuError(''); }}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowSuPw(v => !v)} aria-label="Toggle password">
                  {showSuPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <StrengthMeter password={suPassword} />
            </div>
            <div id="clerk-captcha" />
            <button className="au-btn au-btn-primary" onClick={handleSignup} disabled={suLoading}>
              {suLoading && <span className="au-spin" />}
              Create account
            </button>
            <div className="terms-line">
              By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </div>
            <div className="bottom-note">
              Already have an account? <button onClick={() => switchView('signin')}>Sign in</button>
            </div>
          </section>

          {/* ── VERIFY EMAIL ── */}
          <section className={vc('verify')}>
            <div className="vicon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="m3 7 9 6 9-6"/>
              </svg>
            </div>
            <div className="vhead center">
              <h2>Check your inbox</h2>
              <p>We sent a 6-digit code to<br /><span className="mono">{emailEcho || 'your email'}</span></p>
            </div>
            <ErrBanner msg={verifyError} />
            <OtpInput otpRef={verifyOtpRef} />
            <button className="au-btn au-btn-primary" onClick={handleVerify} disabled={verifyLoading}>
              {verifyLoading && <span className="au-spin" />}
              Verify email
            </button>
            <div className="btn-stack">
              <button className="au-ghost" onClick={handleResend} disabled={resendCountdown > 0}>
                {resendLabel}
              </button>
              <button className="au-ghost" onClick={() => switchView('signup')}>
                <BackIcon />Back
              </button>
            </div>
          </section>

          {/* ── FORGOT PASSWORD ── */}
          <section className={vc('forgot')}>
            <div className="vhead"><h2>Reset your password</h2><p>We&apos;ll send a 6-digit code to your email.</p></div>
            <ErrBanner msg={fpError} />
            <div className={`au-field${fpEmailErr ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="fp-email">Email</label></div>
              <div className="input-wrap has-lead">
                <MailIcon />
                <input
                  className="au-input" id="fp-email" type="email"
                  placeholder="you@company.com" autoComplete="email"
                  value={fpEmail}
                  onChange={e => { setFpEmail(e.target.value); setFpEmailErr(false); setFpError(''); }}
                />
              </div>
              <div className="field-msg"><AlertIcon />Enter a valid email.</div>
            </div>
            <button className="au-btn au-btn-primary" onClick={handleForgot} disabled={fpLoading}>
              {fpLoading && <span className="au-spin" />}
              Send reset code
            </button>
            <button className="au-ghost" style={{ marginTop: 10 }} onClick={() => switchView('signin')}>
              <BackIcon />Back to sign in
            </button>
          </section>

          {/* ── RESET PASSWORD ── */}
          <section className={vc('reset')}>
            <div className="vicon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
            </div>
            <div className="vhead center">
              <h2>Set new password</h2>
              <p>Code sent to <span className="mono">{emailEcho || 'your email'}</span></p>
            </div>
            <ErrBanner msg={rsError} />
            <OtpInput otpRef={resetOtpRef} />
            <div className={`au-field${rsNewPwErr ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="rs-pw">New password</label></div>
              <div className="input-wrap">
                <input
                  className="au-input" id="rs-pw" type={showRsNewPw ? 'text' : 'password'}
                  placeholder="At least 8 characters" autoComplete="new-password"
                  value={rsNewPw}
                  onChange={e => { setRsNewPw(e.target.value); setRsNewPwErr(false); setRsError(''); }}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowRsNewPw(v => !v)} aria-label="Toggle password">
                  {showRsNewPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <StrengthMeter password={rsNewPw} />
            </div>
            <div className={`au-field${rsConfirmPw && rsNewPw !== rsConfirmPw ? ' has-error' : ''}`}>
              <div className="field-label-row"><label htmlFor="rs-confirm">Confirm password</label></div>
              <div className="input-wrap">
                <input
                  className="au-input" id="rs-confirm" type={showRsConfirmPw ? 'text' : 'password'}
                  placeholder="Re-enter password" autoComplete="new-password"
                  value={rsConfirmPw}
                  onChange={e => { setRsConfirmPw(e.target.value); setRsError(''); }}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowRsConfirmPw(v => !v)} aria-label="Toggle password">
                  {showRsConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="field-msg"><AlertIcon />Passwords don&apos;t match.</div>
            </div>
            <button className="au-btn au-btn-primary" onClick={handleReset} disabled={rsLoading}>
              {rsLoading && <span className="au-spin" />}
              Reset password
            </button>
            <button className="au-ghost" style={{ marginTop: 10 }} onClick={() => switchView('forgot')}>
              <BackIcon />Try a different email
            </button>
          </section>

        </div>

        <div className="fp-foot">
          © 2026 Annotation Studio · <Link href="/landing">Home</Link> · <a href="#">Privacy</a> · <a href="#">Terms</a>
        </div>
      </main>
    </div>
  );
}
