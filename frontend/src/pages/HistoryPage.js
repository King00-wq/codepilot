import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../utils/api';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_COLORS = { explain: '#22d3ee', debug: '#f87171', optimize: '#34d399', generate_docs: '#fbbf24', convert: '#c084fc' };
const ACTION_ICONS = { explain: '⚡', debug: '🔍', optimize: '🚀', generate_docs: '📄', convert: '🔄' };
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'explain', label: '⚡ Explain' },
  { key: 'debug', label: '🔍 Debug' },
  { key: 'optimize', label: '🚀 Optimize' },
  { key: 'generate_docs', label: '📄 Docs' },
  { key: 'convert', label: '🔄 Convert' },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await sessionAPI.history({ search: search || undefined, filter, sort });
      setSessions(r.data.sessions || []);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  }, [search, filter, sort]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setDeleting(id);
    try {
      await sessionAPI.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session deleted');
    } catch { toast.error('Failed to delete session'); }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Nav */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6,
          }}>← Dashboard</button>
          <span style={{ color: 'var(--border-default)' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Session History</span>
        </div>
        <button className="btn-glow" onClick={() => navigate('/workspace')} style={{ padding: '7px 16px', fontSize: 13, borderRadius: 9 }}>
          + New Session
        </button>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Session History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..."
              className="input-field" style={{ paddingLeft: 36 }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)',
            borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)',
            outline: 'none', cursor: 'pointer',
          }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
              background: filter === f.key ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
              border: filter === f.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border-subtle)',
              color: filter === f.key ? 'var(--text-accent)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Sessions */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--border-default)', borderRadius: 16, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🕐</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {search || filter !== 'all' ? 'No sessions match your filters' : 'No previous sessions found'}
            </p>
            <p style={{ fontSize: 13, marginBottom: 24 }}>
              {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'Begin your first AI coding session.'}
            </p>
            <button className="btn-glow" onClick={() => navigate('/workspace')} style={{ padding: '10px 24px', fontSize: 13, borderRadius: 10 }}>
              Start Coding
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map(s => {
              const color = ACTION_COLORS[s.last_action] || '#6366f1';
              const icon = ACTION_ICONS[s.last_action] || '💬';
              const isConfirm = confirmDelete === s.id;
              return (
                <div key={s.id} className="animate-fadeIn" style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  background: 'var(--bg-card)', borderRadius: 12,
                  border: '1px solid var(--border-subtle)', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onClick={() => navigate('/workspace', { state: { sessionId: s.id } })}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color + '35'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; setConfirmDelete(null); }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: color + '15', border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {s.last_action && (
                        <span style={{ fontSize: 11, color, background: color + '12', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {s.last_action.replace('_', ' ')}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {s.message_count || 0} interaction{s.message_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {s.updated_at ? formatDistanceToNow(new Date(s.updated_at), { addSuffix: true }) : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {s.created_at ? format(new Date(s.created_at), 'MMM d, yyyy') : ''}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                    disabled={deleting === s.id}
                    style={{
                      padding: '6px 12px', borderRadius: 7, border: isConfirm ? '1px solid rgba(248,113,113,0.4)' : '1px solid var(--border-subtle)',
                      background: isConfirm ? 'rgba(248,113,113,0.1)' : 'none',
                      color: isConfirm ? '#f87171' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >{deleting === s.id ? '...' : isConfirm ? '⚠ Confirm' : '🗑'}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
