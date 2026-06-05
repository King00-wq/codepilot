import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    userAPI.getProfile().then(r => {
      setProfile(r.data);
      setUsername(r.data.user.username);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!username.trim() || username.length < 2) { toast.error('Username must be at least 2 characters'); return; }
    setSaving(true);
    try {
      await userAPI.updateProfile({ username });
      updateUser({ username });
      toast.success('Profile updated');
      setEditMode(false);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    const errs = {};
    if (!pwForm.current) errs.current = 'Required';
    if (!pwForm.newPw) errs.newPw = 'Required';
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setSaving(true);
    try {
      await userAPI.changePassword({ current_password: pwForm.current, new_password: pwForm.newPw });
      toast.success('Password changed successfully');
      setChangingPassword(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwErrors({});
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (!window.confirm('Do you want to logout?')) return;
    await logout();
    navigate('/');
    toast.success('Logged out');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  );

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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Profile</span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        {/* Avatar + name */}
        <div className="glass animate-fadeIn" style={{ padding: '32px', borderRadius: 20, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))',
              border: '2px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: 'var(--accent-light)',
              boxShadow: '0 0 30px rgba(99,102,241,0.2)',
            }}>
              {(profile?.user?.username?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile?.user?.username}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{profile?.user?.email}</p>
              {profile?.user?.created_at && (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                  Member since {format(new Date(profile.user.created_at), 'MMMM yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Sessions', value: profile?.stats?.session_count || 0, icon: '🗂' },
              { label: 'Interactions', value: profile?.stats?.message_count || 0, icon: '⚡' },
              { label: 'Top Action', value: profile?.stats?.most_used_action?.replace('_', ' ') || '—', icon: '🏆' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Edit profile */}
          {editMode ? (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="input-field" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-glow" onClick={handleSaveProfile} disabled={saving} style={{ padding: '9px 20px', fontSize: 13, borderRadius: 9 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-ghost" onClick={() => { setEditMode(false); setUsername(profile?.user?.username || ''); }} style={{ padding: '9px 20px', fontSize: 13, borderRadius: 9 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setEditMode(true)} style={{ padding: '9px 20px', fontSize: 13, borderRadius: 9 }}>Edit Profile</button>
          )}
        </div>

        {/* Security */}
        <div className="glass" style={{ padding: '28px', borderRadius: 20, border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Security</h2>
          {changingPassword ? (
            <div>
              {[
                { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                { key: 'newPw', label: 'New Password', placeholder: 'Min. 8 characters' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type="password" value={pwForm[f.key]} onChange={e => { setPwForm(p => ({ ...p, [f.key]: e.target.value })); setPwErrors(p => ({ ...p, [f.key]: '' })); }}
                    placeholder={f.placeholder} className="input-field"
                    style={{ borderColor: pwErrors[f.key] ? 'var(--red)' : undefined }} />
                  {pwErrors[f.key] && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 3 }}>{pwErrors[f.key]}</p>}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-glow" onClick={handleChangePassword} disabled={saving} style={{ padding: '9px 20px', fontSize: 13, borderRadius: 9 }}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
                <button className="btn-ghost" onClick={() => { setChangingPassword(false); setPwForm({ current: '', newPw: '', confirm: '' }); setPwErrors({}); }}
                  style={{ padding: '9px 20px', fontSize: 13, borderRadius: 9 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Password</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last changed: unknown</p>
              </div>
              <button className="btn-ghost" onClick={() => setChangingPassword(true)} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 9 }}>Change Password</button>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="glass" style={{ padding: '28px', borderRadius: 20, border: '1px solid rgba(248,113,113,0.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Account Actions</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Manage your account session.</p>
          <button onClick={handleLogout} style={{
            padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
          >↩ Logout</button>
        </div>
      </div>
    </div>
  );
}
