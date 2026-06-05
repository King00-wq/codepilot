import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionAPI, userAPI } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  explain: '#22d3ee', debug: '#f87171', optimize: '#34d399',
  generate_docs: '#fbbf24', convert: '#c084fc',
};
const ACTION_ICONS = { explain: '⚡', debug: '🔍', optimize: '🚀', generate_docs: '📄', convert: '🔄' };

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px',
      border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color + '15', border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

function SessionCard({ session, onOpen, onDelete }) {
  const actionType = session.last_action || 'general';
  const color = ACTION_COLORS[actionType] || '#6366f1';
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await onDelete(session.id);
    setDeleting(false);
  };

  return (
    <div onClick={() => onOpen(session.id)} style={{
      background: 'var(--bg-card)', borderRadius: 12, padding: '20px',
      border: '1px solid var(--border-subtle)', cursor: 'pointer',
      transition: 'all 0.2s ease', position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; setConfirm(false); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: color + '15', border: `1px solid ${color}25`,
          fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {ACTION_ICONS[actionType]} {actionType.replace('_', ' ')}
        </div>
        <button onClick={handleDelete} disabled={deleting} style={{
          background: confirm ? 'rgba(248,113,113,0.15)' : 'none',
          border: confirm ? '1px solid rgba(248,113,113,0.3)' : 'none',
          color: confirm ? '#f87171' : 'var(--text-muted)', cursor: 'pointer',
          borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'var(--font-sans)',
          transition: 'all 0.2s',
        }}>
          {deleting ? '...' : confirm ? '⚠ Confirm?' : '🗑'}
        </button>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {session.title}
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {session.message_count || 0} interaction{session.message_count !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {session.updated_at ? formatDistanceToNow(new Date(session.updated_at), { addSuffix: true }) : 'Just now'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, analyticsRes] = await Promise.allSettled([
        sessionAPI.history({ sort: 'newest' }),
        userAPI.getAnalytics(),
      ]);
      if (historyRes.status === 'fulfilled') setSessions(historyRes.value.data.sessions || []);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNewSession = async (actionType) => {
    setCreating(true);
    try {
      const r = await sessionAPI.create();
      navigate('/workspace', { state: { sessionId: r.data.session.id, defaultAction: actionType } });
    } catch {
      toast.error('Failed to create session. Please try again.');
    } finally { setCreating(false); }
  };

  const handleOpenSession = async (id) => {
    navigate('/workspace', { state: { sessionId: id } });
  };

  const handleDeleteSession = async (id) => {
    try {
      await sessionAPI.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Do you want to logout?')) return;
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const totalInteractions = analytics?.action_counts?.reduce((a, b) => a + b.count, 0) || 0;
  const topAction = analytics?.action_counts?.[0];
  const recentSessions = sessions.slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav */}
      <nav style={{
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>CodePilot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/history')} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--font-sans)', padding: '6px 12px', borderRadius: 7,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >History</button>
          <button onClick={() => navigate('/settings')} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--font-sans)', padding: '6px 12px', borderRadius: 7, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >⚙ Settings</button>
          <button onClick={() => navigate('/profile')} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
            border: '1px solid rgba(99,102,241,0.3)',
            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: 'var(--accent-light)',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }} className="animate-fadeIn">
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {sessions.length === 0 ? 'Welcome to CodePilot' : `Welcome back, ${user?.username || 'Developer'}`}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {sessions.length === 0
              ? 'Start your first AI coding session below.'
              : 'Continue where you left off or start something new.'}
          </p>
        </div>

        {/* Stats row */}
        {sessions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Sessions" value={sessions.length} icon="🗂" color="#6366f1" />
            <StatCard label="AI Interactions" value={totalInteractions} icon="⚡" color="#22d3ee" />
            <StatCard label="Most Used" value={topAction?.action_type?.replace('_', ' ') || '—'} icon="🏆" color="#34d399" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Left column */}
          <div>
            {/* New session card */}
            <div className="glass animate-fadeIn" style={{
              padding: '28px', borderRadius: 16, marginBottom: 24,
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>New Coding Session</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Start a fresh AI-assisted coding session</p>
                </div>
                <button className="btn-glow" onClick={() => handleNewSession(null)} disabled={creating}
                  style={{ padding: '10px 24px', fontSize: 14, borderRadius: 10, whiteSpace: 'nowrap' }}>
                  {creating ? <span className="loading-dots"><span/><span/><span/></span> : '+ New Session'}
                </button>
              </div>

              {/* Quick actions */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quick Start</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(ACTION_ICONS).map(([action, icon]) => (
                    <button key={action} onClick={() => handleNewSession(action)} disabled={creating} style={{
                      padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: ACTION_COLORS[action] + '12', border: `1px solid ${ACTION_COLORS[action]}25`,
                      color: ACTION_COLORS[action], fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = ACTION_COLORS[action] + '25'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ACTION_COLORS[action] + '12'; }}
                    >
                      {icon} {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent sessions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Sessions</h2>
                {sessions.length > 0 && (
                  <button onClick={() => navigate('/history')} style={{
                    background: 'none', border: 'none', color: 'var(--accent-light)',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)',
                  }}>View All →</button>
                )}
              </div>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '60px 24px',
                  border: '1px dashed var(--border-default)', borderRadius: 16,
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>No sessions yet</p>
                  <p style={{ fontSize: 13 }}>Start your first AI coding session above.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {recentSessions.map(s => (
                    <SessionCard key={s.id} session={s} onOpen={handleOpenSession} onDelete={handleDeleteSession} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile card */}
            <div className="glass" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))',
                  border: '2px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 18, color: 'var(--accent-light)',
                }}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'View Profile', icon: '👤', action: () => navigate('/profile') },
                  { label: 'Settings', icon: '⚙', action: () => navigate('/settings') },
                  { label: 'Session History', icon: '🕐', action: () => navigate('/history') },
                  { label: 'Logout', icon: '↩', action: handleLogout, danger: true },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontFamily: 'var(--font-sans)',
                    color: item.danger ? 'var(--red)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = item.danger ? 'rgba(248,113,113,0.08)' : 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity breakdown */}
            {analytics?.action_counts?.length > 0 && (
              <div className="glass" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Activity Breakdown
                </h3>
                {analytics.action_counts.map(item => {
                  const pct = Math.round((item.count / totalInteractions) * 100);
                  const color = ACTION_COLORS[item.action_type] || '#6366f1';
                  return (
                    <div key={item.action_type} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {ACTION_ICONS[item.action_type]} {item.action_type.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color }}>{item.count}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
