import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '⚡', label: 'Explain Code', desc: 'Understand any codebase instantly with clear, structured explanations.', color: '#22d3ee' },
  { icon: '🔍', label: 'Debug Code', desc: 'Pinpoint bugs and get actionable fixes with root cause analysis.', color: '#f87171' },
  { icon: '🚀', label: 'Optimize Code', desc: 'Transform slow or messy code into clean, performant solutions.', color: '#34d399' },
  { icon: '📄', label: 'Generate Docs', desc: 'Auto-generate professional documentation and inline comments.', color: '#fbbf24' },
  { icon: '🔄', label: 'Convert Languages', desc: 'Translate code between Python, JS, Java, Go, and more.', color: '#c084fc' },
];

const WHY = [
  { icon: '⏱', title: 'Faster Debugging', desc: 'Diagnose issues in seconds, not hours.' },
  { icon: '🧠', title: 'Deeper Understanding', desc: 'Learn what code does, not just how to copy it.' },
  { icon: '📈', title: 'Improved Productivity', desc: 'Ship more with less friction in your workflow.' },
  { icon: '✨', title: 'Cleaner Code', desc: 'Write better code with AI-guided improvements.' },
];

const STEPS = [
  { n: '01', label: 'Write or Paste Code', desc: 'Drop in any code snippet, function, or file.' },
  { n: '02', label: 'Ask the AI', desc: 'Explain, debug, optimize, document, or convert.' },
  { n: '03', label: 'Receive Suggestions', desc: 'Get structured, actionable AI responses instantly.' },
  { n: '04', label: 'Improve Your Workflow', desc: 'Iterate faster and ship with confidence.' },
];

function AnimatedBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 600, height: 600,
        borderRadius: '50%', top: '-20%', left: '-10%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', bottom: '10%', right: '-5%',
        background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)',
        animation: 'float 10s ease-in-out infinite 2s',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', top: '40%', left: '40%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite 4s',
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goAuth = (tab) => navigate('/auth', { state: { tab } });
  const goDash = () => navigate('/dashboard');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <AnimatedBg />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5%', height: 64,
        background: scrolled ? 'rgba(5,5,8,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: '#f0f0f8' }}>
            CodePilot
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['Features', 'How It Works', 'Why Us'].map(label => (
            <button key={label} onClick={() => {
              const el = document.getElementById(label.toLowerCase().replace(/ /g, '-'));
              el?.scrollIntoView({ behavior: 'smooth' });
            }} style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)',
              padding: '6px 12px', borderRadius: 6, transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{label}</button>
          ))}
          {isAuthenticated ? (
            <button className="btn-ghost" onClick={goDash} style={{ padding: '7px 16px', fontSize: 13 }}>Dashboard</button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => goAuth('login')} style={{ padding: '7px 16px', fontSize: 13 }}>Login</button>
              <button className="btn-glow" onClick={() => goAuth('signup')} style={{ padding: '7px 16px', fontSize: 13 }}>Try Now</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '80px 5% 60px',
        opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
          padding: '6px 16px', borderRadius: 'var(--radius-full)',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI-Powered Developer Workspace
          </span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24,
          maxWidth: 900,
        }}>
          Code Smarter with
          <br />
          <span className="gradient-text">AI Assistance</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--text-secondary)',
          maxWidth: 600, lineHeight: 1.7, marginBottom: 48,
        }}>
          Debug, explain, optimize and interact with code intelligently.
          Your AI-powered coding workspace that works the way you think.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 80 }}>
          <button className="btn-glow" onClick={() => isAuthenticated ? goDash() : goAuth('signup')}
            style={{ padding: '14px 36px', fontSize: 15, borderRadius: 12, animation: 'glow 3s infinite' }}>
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
          </button>
          <button className="btn-ghost" onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }} style={{ padding: '14px 32px', fontSize: 15, borderRadius: 12 }}>
            See Features →
          </button>
        </div>

        {/* Product preview mock */}
        <div style={{
          width: '100%', maxWidth: 900, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,10,20,0.8)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.1)',
        }}>
          {/* Window chrome */}
          <div style={{
            padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {['#f87171', '#fbbf24', '#34d399'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
            ))}
            <div style={{
              flex: 1, margin: '0 16px', height: 22, borderRadius: 4,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', paddingLeft: 10,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>app.aicode.helper</span>
            </div>
          </div>
          {/* Workspace preview */}
          <div style={{ display: 'flex', height: 320 }}>
            {/* Sidebar */}
            <div style={{ width: 50, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 12 }}>
              {['⚡','📁','🕐','⚙️'].map((ic,i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? 'rgba(99,102,241,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>{ic}</div>
              ))}
            </div>
            {/* Code editor */}
            <div style={{ flex: 1, padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12, overflowY: 'auto' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11 }}>bubble_sort.py</div>
              {[
                ['keyword', 'def '], ['func', 'bubble_sort'], ['text', '(arr):'],
                ['keyword', '    for '], ['var', 'i '], ['text', 'in '], ['func', 'range'], ['text', '(len(arr)):'],
                ['keyword', '        for '], ['var', 'j '], ['text', 'in '], ['func', 'range'], ['text', '(0, len(arr)-i-1):'],
                ['comment', '            # Compare adjacent'],
                ['keyword', '            if '], ['text', 'arr[j] > arr[j+1]:'],
                ['text', '                arr[j], arr[j+1] = arr[j+1], arr[j]'],
              ].map((line, i) => (
                <div key={i} style={{ lineHeight: 1.7, color: line[0] === 'keyword' ? '#c084fc' : line[0] === 'func' ? '#22d3ee' : line[0] === 'var' ? '#a5a8ff' : line[0] === 'comment' ? '#5a5a78' : 'var(--text-secondary)' }}>
                  {line[1]}
                </div>
              ))}
            </div>
            {/* AI panel */}
            <div style={{ width: 260, borderLeft: '1px solid rgba(255,255,255,0.05)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Assistant</div>
              {[
                { label: 'Explain', color: '#22d3ee' },
                { label: 'Debug', color: '#f87171' },
                { label: 'Optimize', color: '#34d399' },
                { label: 'Generate Docs', color: '#fbbf24' },
              ].map(btn => (
                <button key={btn.label} style={{
                  padding: '8px 12px', borderRadius: 8, border: `1px solid ${btn.color}30`,
                  background: `${btn.color}10`, color: btn.color,
                  fontSize: 12, fontWeight: 500, cursor: 'default',
                  fontFamily: 'var(--font-sans)', textAlign: 'left',
                }}>{btn.label}</button>
              ))}
              <div style={{ marginTop: 'auto', padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>AI Response</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  This function implements bubble sort with O(n²) time complexity. Consider using Python's built-in sort for better performance...
                </div>
                <div className="loading-dots" style={{ marginTop: 8 }}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>FEATURES</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Everything you need to<br /><span className="gradient-text">code with AI</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Five powerful AI actions covering your entire development workflow.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <div key={f.label} className="glass" style={{
              padding: '28px 24px', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.3s ease', cursor: 'default',
              animationDelay: `${i * 0.1}s`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '40'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 24px ${f.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, marginBottom: 20,
                background: f.color + '15', border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{f.label}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: '100px 5%', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            From code to insight in<br /><span className="gradient-text">four steps</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ textAlign: 'center', padding: '32px 24px', position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 52, right: -12, width: 24,
                  height: 1, background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)',
                  display: 'none',
                }} />
              )}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-mono)', color: 'var(--accent-light)',
              }}>{s.n}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{s.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section id="why-us" style={{ position: 'relative', zIndex: 1, padding: '100px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>WHY CHOOSE US</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
              Built for developers
              <br /><span className="gradient-text">who ship fast</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
              CodePilot isn't just another chatbot. It's a structured workspace designed around your workflow — with session history, persistent context, and AI that understands code deeply.
            </p>
            <button className="btn-glow" onClick={() => isAuthenticated ? goDash() : goAuth('signup')}
              style={{ padding: '12px 28px', fontSize: 14, borderRadius: 12 }}>
              Start Building →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {WHY.map(w => (
              <div key={w.title} className="glass" style={{
                padding: '24px 20px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <div style={{ fontSize: 24, marginBottom: 12 }}>{w.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{w.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        position: 'relative', zIndex: 1, padding: '100px 5%', textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Ready to code<br /><span className="gradient-text">smarter?</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}>
          Join developers who use CodePilot to debug faster, understand deeper, and ship more.
        </p>
        <button className="btn-glow" onClick={() => isAuthenticated ? goDash() : goAuth('signup')}
          style={{ padding: '16px 48px', fontSize: 16, borderRadius: 14, animation: 'glow 3s infinite' }}>
          {isAuthenticated ? 'Open Dashboard' : 'Get Started — It\'s Free'}
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1, padding: '40px 5%',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
          }}>⚡</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>CodePilot</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Terms', 'Privacy', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >{l}</span>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2024 CodePilot. All rights reserved.</span>
      </footer>
    </div>
  );
}
