import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{desc}</p>}
      </div>
      <div onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
        border: `1px solid ${checked ? 'rgba(99,102,241,0.5)' : 'var(--border-default)'}`,
        position: 'relative', transition: 'all 0.2s',
        boxShadow: checked ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'left 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userAPI.getSettings().then(r => setSettings(r.data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const updateNotif = (key, val) => setSettings(s => ({ ...s, notifications: { ...s.notifications, [key]: val } }));
  const updateWorkspace = (key, val) => setSettings(s => ({ ...s, workspace_preferences: { ...s.workspace_preferences, [key]: val } }));
  const updateSecurity = (key, val) => setSettings(s => ({ ...s, security_preferences: { ...s.security_preferences, [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateSettings(settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  );

  const n = settings?.notifications || {};
  const w = settings?.workspace_preferences || {};
  const sec = settings?.security_preferences || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>← Dashboard</button>
          <span style={{ color: 'var(--border-default)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Settings</span>
        </div>
        <button className="btn-glow" onClick={handleSave} disabled={saving} style={{ padding: '7px 20px', fontSize: 13, borderRadius: 9 }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em' }}>Settings</h1>

        {/* Notifications */}
        <div className="glass" style={{ padding: '28px', borderRadius: 20, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔔 Notifications
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Control when and how you receive notifications.</p>
          <Toggle checked={!!n.email} onChange={v => updateNotif('email', v)} label="Email Notifications" desc="Receive session summaries and updates via email" />
          <Toggle checked={!!n.browser} onChange={v => updateNotif('browser', v)} label="Browser Notifications" desc="Show desktop notifications for AI responses" />
          <Toggle checked={!!n.ai_complete} onChange={v => updateNotif('ai_complete', v)} label="AI Completion Alerts" desc="Notify when long AI requests complete" />
        </div>

        {/* Workspace */}
        <div className="glass" style={{ padding: '28px', borderRadius: 20, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            💻 Workspace
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Customize your coding environment.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Font Size</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[12, 13, 14, 15, 16].map(size => (
                <button key={size} onClick={() => updateWorkspace('fontSize', size)} style={{
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: w.fontSize === size ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                  border: `1px solid ${w.fontSize === size ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
                  color: w.fontSize === size ? 'var(--text-accent)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}>{size}px</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Tab Size</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[2, 4].map(size => (
                <button key={size} onClick={() => updateWorkspace('tabSize', size)} style={{
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: w.tabSize === size ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                  border: `1px solid ${w.tabSize === size ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
                  color: w.tabSize === size ? 'var(--text-accent)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}>{size} spaces</button>
              ))}
            </div>
          </div>

          <Toggle checked={!!w.autoSave} onChange={v => updateWorkspace('autoSave', v)} label="Auto-save Draft" desc="Automatically save code editor content" />
          <Toggle checked={!!w.lineNumbers} onChange={v => updateWorkspace('lineNumbers', v)} label="Line Numbers" desc="Show line numbers in code editor" />
          <Toggle checked={!!w.wordWrap} onChange={v => updateWorkspace('wordWrap', v)} label="Word Wrap" desc="Wrap long lines in the editor" />
        </div>

        {/* Security */}
        <div className="glass" style={{ padding: '28px', borderRadius: 20, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔒 Security
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Manage your security preferences.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Session Timeout</label>
            <select value={sec.sessionTimeout || 30} onChange={e => updateSecurity('sessionTimeout', Number(e.target.value))} style={{
              padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)',
              borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
            }}>
              {[15, 30, 60, 120, 480].map(v => <option key={v} value={v}>{v < 60 ? `${v} minutes` : `${v/60} hour${v > 60 ? 's' : ''}`}</option>)}
            </select>
          </div>

          <Toggle checked={!!sec.twoFactor} onChange={v => updateSecurity('twoFactor', v)} label="Two-Factor Authentication" desc="Extra security layer (future feature)" />
          <Toggle checked={!!sec.loginAlerts} onChange={v => updateSecurity('loginAlerts', v)} label="Login Alerts" desc="Get notified of new login activity" />
        </div>

        {/* Future roadmap note */}
        <div style={{ padding: '20px 24px', borderRadius: 14, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Coming in v2:</span> RAG-based project understanding, AI autocomplete, team workspaces, and advanced analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
