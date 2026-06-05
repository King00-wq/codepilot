import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionAPI, aiAPI, userAPI } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

const ACTIONS = [
  { key: 'explain', label: 'Explain', icon: '⚡', color: '#22d3ee', desc: 'Understand this code' },
  { key: 'debug', label: 'Debug', icon: '🔍', color: '#f87171', desc: 'Find and fix issues' },
  { key: 'optimize', label: 'Optimize', icon: '🚀', color: '#34d399', desc: 'Improve performance' },
  { key: 'generate_docs', label: 'Generate Docs', icon: '📄', color: '#fbbf24', desc: 'Create documentation' },
  { key: 'convert', label: 'Convert', icon: '🔄', color: '#c084fc', desc: 'Change language' },
];

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'TypeScript', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin'];

const ALLOWED_EXTS = ['.py', '.js', '.java', '.txt', '.ts', '.jsx', '.tsx', '.cpp', '.c', '.cs', '.go', '.rb'];
const MAX_FILE_SIZE = 1 * 1024 * 1024;

function AIThinkingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent-light)',
            animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>AI is analyzing your code...</span>
    </div>
  );
}

function MessageBubble({ msg }) {
  const color = { explain: '#22d3ee', debug: '#f87171', optimize: '#34d399', generate_docs: '#fbbf24', convert: '#c084fc' }[msg.action_type] || '#6366f1';
  const icon = { explain: '⚡', debug: '🔍', optimize: '🚀', generate_docs: '📄', convert: '🔄' }[msg.action_type] || '🤖';

  const copyResponse = () => {
    navigator.clipboard.writeText(msg.response);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="animate-fadeIn" style={{ marginBottom: 24 }}>
      {/* User prompt */}
      {msg.prompt && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <div style={{
            maxWidth: '75%', padding: '10px 16px', borderRadius: '12px 12px 4px 12px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5,
          }}>
            {msg.prompt}
            {msg.submitted_code && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', maxHeight: 80, overflow: 'hidden' }}>
                {msg.submitted_code.slice(0, 200)}{msg.submitted_code.length > 200 ? '...' : ''}
              </div>
            )}
          </div>
        </div>
      )}
      {/* AI response */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: color + '15', border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {msg.action_type?.replace('_', ' ')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
            </span>
            <button onClick={copyResponse} style={{
              marginLeft: 'auto', background: 'none', border: '1px solid var(--border-subtle)',
              borderRadius: 5, padding: '2px 8px', fontSize: 11, color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}>Copy</button>
          </div>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px',
            border: '1px solid var(--border-subtle)', fontSize: 14, lineHeight: 1.7,
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                      customStyle={{ borderRadius: 8, fontSize: 12, margin: '8px 0' }} {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }} {...props}>
                      {children}
                    </code>
                  );
                },
                h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-accent)', margin: '12px 0 6px' }}>{children}</h3>,
                p: ({ children }) => <p style={{ margin: '6px 0', color: 'var(--text-secondary)' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '6px 0' }}>{children}</ul>,
                li: ({ children }) => <li style={{ color: 'var(--text-secondary)', marginBottom: 3 }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>,
              }}
            >
              {msg.response}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [sessionId, setSessionId] = useState(location.state?.sessionId || null);
  const [sessionTitle, setSessionTitle] = useState('New Session');
  const [messages, setMessages] = useState([]);
  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState(location.state?.defaultAction || 'explain');
  const [targetLanguage, setTargetLanguage] = useState('JavaScript');
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Restore draft code from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('ach_draft_code');
    if (draft && !sessionId) setCode(draft);
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (code) {
      clearTimeout(autoSaveTimer);
      const t = setTimeout(() => {
        localStorage.setItem('ach_draft_code', code);
        setUnsavedChanges(false);
      }, 1500);
      setAutoSaveTimer(t);
      setUnsavedChanges(true);
    }
    return () => clearTimeout(autoSaveTimer);
  }, [code]);

  // Warn before leave with unsaved
  useEffect(() => {
    const handler = (e) => {
      if (unsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedChanges]);

  // Load session
  useEffect(() => {
    if (sessionId) {
      setLoadingSession(true);
      sessionAPI.get(sessionId)
        .then(r => {
          setSessionTitle(r.data.session.title);
          setMessages(r.data.messages || []);
        })
        .catch(() => toast.error('Failed to load session'))
        .finally(() => setLoadingSession(false));
    }
  }, [sessionId]);

  // Load sidebar sessions
  useEffect(() => {
    sessionAPI.history({ sort: 'newest' })
      .then(r => setSessions(r.data.sessions?.slice(0, 10) || []))
      .catch(() => {});
  }, []);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const r = await sessionAPI.create();
    const id = r.data.session.id;
    setSessionId(id);
    return id;
  };

  const handleSubmit = async () => {
    if (!code.trim() && !prompt.trim()) {
      toast.error('Please enter code or a question');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const sid = await ensureSession();
      const actionMap = { explain: aiAPI.explain, debug: aiAPI.debug, optimize: aiAPI.optimize, generate_docs: aiAPI.generateDocs, convert: aiAPI.convert };
      const apiFn = actionMap[selectedAction];
      const r = await apiFn({ session_id: sid, code, prompt, target_language: targetLanguage });
      const newMsg = {
        prompt, submitted_code: code, response: r.data.response,
        action_type: selectedAction, timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      setPrompt('');
      setUnsavedChanges(false);

      // Reload session title if it was just named
      if (messages.length === 0) {
        const updated = await sessionAPI.get(sid);
        setSessionTitle(updated.data.session.title);
        setSessions(prev => {
          const exists = prev.find(s => s.id === sid);
          if (!exists) return [{ id: sid, title: updated.data.session.title }, ...prev];
          return prev.map(s => s.id === sid ? { ...s, title: updated.data.session.title } : s);
        });
      }
    } catch (e) {
      const msg = e.response?.data?.warning || e.response?.data?.error || 'AI service is temporarily unavailable. Please try again.';
      toast.error(msg, { duration: 5000 });
    } finally { setLoading(false); }
  };

  const handleNewSession = async () => {
    if (unsavedChanges && messages.length > 0) {
      if (!window.confirm('Start a new session? Current session is saved in history.')) return;
    }
    setSessionId(null);
    setMessages([]);
    setCode('');
    setPrompt('');
    setSessionTitle('New Session');
    setUnsavedChanges(false);
    localStorage.removeItem('ach_draft_code');
  };

  const handleOpenSession = async (id) => {
    if (id === sessionId) return;
    setLoadingSession(true);
    setSessionId(id);
    setCode('');
    setPrompt('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) { toast.error(`Unsupported file type "${ext}"`); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error('File exceeds 1MB size limit'); return; }
    if (file.size === 0) { toast.error('File is empty'); return; }
    const text = await file.text();
    if (!text.trim()) { toast.error('File appears to be empty'); return; }
    setCode(text);
    toast.success(`Loaded: ${file.name}`);
    e.target.value = '';
  };

  const handleTitleSave = async () => {
    if (!titleDraft.trim() || !sessionId) { setEditingTitle(false); return; }
    try {
      await sessionAPI.update(sessionId, { title: titleDraft });
      setSessionTitle(titleDraft);
      toast.success('Session renamed');
    } catch { toast.error('Failed to rename session'); }
    setEditingTitle(false);
  };

  const keyHandler = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)', background: 'rgba(5,5,8,0.95)',
        backdropFilter: 'blur(20px)', flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={() => setSidebarOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 18, padding: '4px 6px', borderRadius: 6,
          transition: 'color 0.2s',
        }}>☰</button>
        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
        {/* Breadcrumb */}
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Dashboard</button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/</span>
        {editingTitle ? (
          <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave} onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
            autoFocus className="input-field"
            style={{ fontSize: 13, padding: '4px 10px', width: 240, height: 28 }} />
        ) : (
          <span onClick={() => { setTitleDraft(sessionTitle); setEditingTitle(true); }}
            title="Click to rename" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', borderRadius: 4, padding: '2px 4px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.target.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >{sessionTitle}</span>
        )}
        {unsavedChanges && <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, background: 'var(--bg-elevated)' }}>unsaved</span>}
        <div style={{ flex: 1 }} />
        <button onClick={handleNewSession} className="btn-ghost" style={{ padding: '5px 14px', fontSize: 12, borderRadius: 7 }}>+ New</button>
        <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', padding: '4px 10px' }}>History</button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 220 : 0, flexShrink: 0, overflow: 'hidden',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)', transition: 'width 0.25s ease',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 12, flex: 1, overflowY: 'auto', minWidth: 220 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, padding: '0 4px' }}>Sessions</p>
            {sessions.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 4px' }}>No sessions yet</p>
            ) : sessions.map(s => (
              <button key={s.id} onClick={() => handleOpenSession(s.id)} style={{
                width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8,
                background: s.id === sessionId ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: s.id === sessionId ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                color: s.id === sessionId ? 'var(--text-accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)',
                marginBottom: 3, transition: 'all 0.15s', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (s.id !== sessionId) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { if (s.id !== sessionId) e.currentTarget.style.background = 'transparent'; }}
              >{s.title}</button>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', minWidth: 220 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              width: '100%', padding: '8px', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
              fontFamily: 'var(--font-sans)', borderRadius: 7, textAlign: 'left',
            }}>← Dashboard</button>
          </div>
        </div>

        {/* Center: Code Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Editor header */}
          <div style={{
            height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Code Editor</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{
                padding: '4px 10px', background: 'none', border: '1px solid var(--border-default)',
                borderRadius: 5, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11,
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              }}>📎 Upload</button>
              <button onClick={() => { setCode(''); toast.success('Editor cleared'); }} style={{
                padding: '4px 10px', background: 'none', border: '1px solid var(--border-default)',
                borderRadius: 5, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11,
                fontFamily: 'var(--font-sans)',
              }}>Clear</button>
              <input ref={fileInputRef} type="file" accept={ALLOWED_EXTS.join(',')} style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
          </div>
          {/* Code textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={keyHandler}
            placeholder={'// Paste or write your code here...\n// Ctrl+Enter to run AI action\n\nfunction example() {\n  console.log("Hello, CodePilot!");\n}'}
            spellCheck={false}
            style={{
              flex: 1, width: '100%', padding: '16px',
              background: 'var(--bg-base)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.65,
              border: 'none', outline: 'none', resize: 'none',
              caretColor: 'var(--accent-light)',
            }}
          />
          {/* Action bar */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)', padding: '12px 16px',
            background: 'var(--bg-surface)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {ACTIONS.map(a => (
                <button key={a.key} onClick={() => setSelectedAction(a.key)} style={{
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: selectedAction === a.key ? a.color + '20' : 'transparent',
                  border: selectedAction === a.key ? `1px solid ${a.color}50` : '1px solid var(--border-subtle)',
                  color: selectedAction === a.key ? a.color : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}>{a.icon} {a.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={keyHandler}
                  placeholder={`Ask AI to ${selectedAction.replace('_', ' ')} your code... (Ctrl+Enter to run)`}
                  rows={2} style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)', borderRadius: 10,
                    color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)',
                    resize: 'none', outline: 'none', lineHeight: 1.5, transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>
              {selectedAction === 'convert' && (
                <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} style={{
                  padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)',
                  outline: 'none', cursor: 'pointer',
                }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
              <button className="btn-glow" onClick={handleSubmit} disabled={loading}
                style={{ padding: '10px 22px', fontSize: 13, borderRadius: 10, flexShrink: 0, height: 64, display: 'flex', alignItems: 'center', gap: 8 }}>
                {loading ? <><span className="loading-dots"><span/><span/><span/></span></> : `${ACTIONS.find(a => a.key === selectedAction)?.icon} Run`}
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Output */}
        <div style={{
          width: 480, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)',
        }}>
          <div style={{
            height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Assistant</span>
            {messages.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{messages.length} response{messages.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {loadingSession ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
              </div>
            ) : messages.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>🤖</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>AI Assistant Ready</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                  Paste code in the editor, choose an action, and click Run.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ACTIONS.map(a => (
                    <div key={a.key} onClick={() => setSelectedAction(a.key)} style={{
                      padding: '10px 14px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      background: selectedAction === a.key ? a.color + '12' : 'var(--bg-card)',
                      border: `1px solid ${selectedAction === a.key ? a.color + '30' : 'var(--border-subtle)'}`,
                      transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 16 }}>{a.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: a.color, marginLeft: 8 }}>{a.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{a.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                {loading && <AIThinkingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
