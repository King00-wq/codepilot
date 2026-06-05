import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['', '#f87171', '#fbbf24', '#fbbf24', '#34d399'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: colors[score] || 'var(--text-muted)', fontWeight: 500 }}>{labels[score]}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 10, color: c.ok ? '#34d399' : 'var(--text-muted)' }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type, value, onChange, placeholder, error, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input-field"
          style={{ borderColor: error ? 'var(--red)' : undefined, paddingRight: isPassword ? 44 : undefined }}
        />
        {isPassword && (
          <button onClick={() => setShow(!show)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, padding: 4,
          }}>{show ? '🙈' : '👁'}</button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [tab, setTab] = useState(location.state?.tab === 'login' ? 'login' : 'signup');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState({});

  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);

  const setSignup = (k, v) => { setSignupForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };
  const setLoginF = (k, v) => { setLoginForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const handleSignup = async () => {
    const errs = {};
    if (!signupForm.username.trim() || signupForm.username.length < 2) errs.username = 'Username must be at least 2 characters';
    if (!signupForm.email) errs.email = 'Email is required';
    if (!signupForm.password) errs.password = 'Password is required';
    if (signupForm.password !== signupForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // No byte-length limit enforced on the client (server uses Argon2)

    setLoading(true);
    try {
      const r = await authAPI.signup({ username: signupForm.username, email: signupForm.email, password: signupForm.password, confirm_password: signupForm.confirm });
      login(r.data.token, r.data.user);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (e) {
      const msg = e.response?.data?.detail || e.response?.data?.error || 'Signup failed. Please try again.';
      toast.error(msg);
      if (msg.includes('email') || msg.includes('username')) setErrors({ email: msg });
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    const errs = {};
    if (!loginForm.email) errs.email = 'Email is required';
    if (!loginForm.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const r = await authAPI.login({ email: loginForm.email, password: loginForm.password });
      login(r.data.token, r.data.user);
      if (loginForm.remember) localStorage.setItem('ach_remember', '1');
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (e) {
      const msg = e.response?.data?.error || 'Login failed. Please try again.';
      toast.error(msg);
      setErrors({ password: msg });
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail) { setErrors({ forgot: 'Email is required' }); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      setForgotSent(true);
      toast.success('Reset instructions sent!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', position: 'relative',
      background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.08) 0%, transparent 60%), var(--bg-base)',
    }}>
      {/* Back */}
      <button onClick={() => navigate('/')} style={{
        position: 'fixed', top: 20, left: 24, background: 'none', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)',
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
        borderRadius: 8, transition: 'color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >← Back</button>

      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fadeIn">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 16, boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>CodePilot</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {forgotMode ? 'Reset your password' : tab === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: 32, borderRadius: 20, border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>

          {forgotMode ? (
            /* Forgot Password */
            <div>
              <button onClick={() => { setForgotMode(false); setForgotSent(false); setErrors({}); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', marginBottom: 20 }}>
                ← Back to login
              </button>
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Check your email</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                    If an account exists for <strong>{forgotEmail}</strong>, we've sent reset instructions.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <InputField label="Email Address" type="email" value={forgotEmail} onChange={setForgotEmail}
                    placeholder="you@example.com" error={errors.forgot} />
                  <button className="btn-glow" onClick={handleForgot} disabled={loading}
                    style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 8 }}>
                    {loading ? <><span className="loading-dots"><span/><span/><span/></span></> : 'Send Reset Link'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                padding: 4, marginBottom: 28, gap: 4,
              }}>
                {['signup', 'login'].map(t => (
                  <button key={t} onClick={() => { setTab(t); setErrors({}); }} style={{
                    flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
                    background: tab === t ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' : 'transparent',
                    color: tab === t ? 'var(--text-accent)' : 'var(--text-muted)',
                    border: tab === t ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                    {t === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>
                ))}
              </div>

              {tab === 'signup' ? (
                <div className="animate-fadeIn">
                  <InputField label="Username" type="text" value={signupForm.username} onChange={v => setSignup('username', v)}
                    placeholder="yourname" error={errors.username} autoComplete="username" />
                  <InputField label="Email" type="email" value={signupForm.email} onChange={v => setSignup('email', v)}
                    placeholder="you@example.com" error={errors.email} autoComplete="email" />
                  <InputField label="Password" type="password" value={signupForm.password} onChange={v => setSignup('password', v)}
                    placeholder="Min. 8 characters" error={errors.password} autoComplete="new-password" />
                  <PasswordStrength password={signupForm.password} />
                  <div style={{ marginTop: 16 }}>
                    <InputField label="Confirm Password" type="password" value={signupForm.confirm} onChange={v => setSignup('confirm', v)}
                      placeholder="Repeat password" error={errors.confirm} autoComplete="new-password" />
                  </div>
                  <button className="btn-glow" onClick={handleSignup} disabled={loading}
                    style={{ width: '100%', padding: '13px', fontSize: 14, marginTop: 8 }}>
                    {loading ? <><span className="loading-dots"><span/><span/><span/></span> Creating account...</> : 'Create Account'}
                  </button>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <InputField label="Email" type="email" value={loginForm.email} onChange={v => setLoginF('email', v)}
                    placeholder="you@example.com" error={errors.email} autoComplete="email" />
                  <InputField label="Password" type="password" value={loginForm.password} onChange={v => setLoginF('password', v)}
                    placeholder="Your password" error={errors.password} autoComplete="current-password" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={loginForm.remember} onChange={e => setLoginF('remember', e.target.checked)}
                        style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                      Remember me
                    </label>
                    <button onClick={() => { setForgotMode(true); setErrors({}); }} style={{
                      background: 'none', border: 'none', color: 'var(--accent-light)',
                      cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)',
                    }}>Forgot password?</button>
                  </div>
                  <button className="btn-glow" onClick={handleLogin} disabled={loading}
                    style={{ width: '100%', padding: '13px', fontSize: 14 }}>
                    {loading ? <><span className="loading-dots"><span/><span/><span/></span> Signing in...</> : 'Sign In'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          By continuing, you agree to our{' '}
          <span style={{ color: 'var(--accent-light)', cursor: 'pointer' }}>Terms</span> and{' '}
          <span style={{ color: 'var(--accent-light)', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
