// src/pages/admin/AdminTickets.jsx — Admin support ticket management
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { ticketAPI } from '../../api/index.js';
import styles from './Admin.module.css';

const STATUS_OPTIONS = [
  { value: 'all',         label: 'सर्व' },
  { value: 'open',        label: 'उघडे' },
  { value: 'in_progress', label: 'प्रक्रियेत' },
  { value: 'resolved',    label: 'निराकरण' },
  { value: 'closed',      label: 'बंद' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'कमी' },
  { value: 'normal', label: 'सामान्य' },
  { value: 'high',   label: 'उच्च' },
  { value: 'urgent', label: 'तातडी' },
];

const STATUS_STYLE = {
  open:        { color: '#b35c00', bg: '#fff8f0' },
  in_progress: { color: '#1565c0', bg: '#e3f2fd' },
  resolved:    { color: '#2e7d32', bg: '#e8f5e9' },
  closed:      { color: '#757575', bg: '#f5f5f5' },
};

const PRIORITY_STYLE = {
  low:    { color: '#757575', bg: '#f5f5f5' },
  normal: { color: '#1565c0', bg: '#e3f2fd' },
  high:   { color: '#e65100', bg: '#fff3e0' },
  urgent: { color: '#b71c1c', bg: '#ffebee' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.open;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
      {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLE[priority] || PRIORITY_STYLE.normal;
  return (
    <span style={{ background: p.bg, color: p.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
      {PRIORITY_OPTIONS.find(o => o.value === priority)?.label || priority}
    </span>
  );
}

// ── Ticket List ───────────────────────────────────────────────
function TicketList() {
  const navigate = useNavigate();
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('open');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = { page, limit };
    if (filter !== 'all') params.status = filter;
    ticketAPI.adminGetAll(params)
      .then(r => {
        setTickets(r.data.data?.rows || []);
        setTotal(r.data.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { load(); }, [filter, page]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_OPTIONS.map(o => (
          <button key={o.value}
            onClick={() => setFilter(o.value)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid',
              borderColor: filter === o.value ? '#b35c00' : '#e0e0e0',
              background: filter === o.value ? '#b35c00' : '#fff',
              color: filter === o.value ? '#fff' : '#555',
              fontWeight: filter === o.value ? 700 : 400,
              cursor: 'pointer', fontSize: 13,
            }}>
            {o.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>
          एकूण: {total} tickets
        </span>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          कोणतेही ticket नाही.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.map(t => (
              <div key={t.id}
                onClick={() => navigate(`/admin/tickets/${t.id}`)}
                style={{
                  background: '#fff', borderRadius: 12, padding: '14px 18px',
                  border: '1px solid #f0e0c8', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(179,92,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#b35c00', fontWeight: 700 }}>#{t.ticket_code}</span>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      {t.unread_user > 0 && (
                        <span style={{ background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
                          {t.unread_user} नवे
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2d1a00', marginBottom: 2 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      👤 {t.user_name || t.user_phone || 'अनामिक'}
                      {t.assigned_name && <> · 🛡️ {t.assigned_name}</>}
                    </div>
                    {t.last_message && (
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 500 }}>
                        {t.last_sender}: {t.last_message}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{new Date(t.updated_at).toLocaleDateString('mr-IN')}</div>
                    <div style={{ fontSize: 11, color: '#b35c00', fontWeight: 600, marginTop: 4 }}>पाहा →</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: '1px solid',
                    borderColor: p === page ? '#b35c00' : '#e0e0e0',
                    background: p === page ? '#b35c00' : '#fff',
                    color: p === page ? '#fff' : '#555',
                    cursor: 'pointer', fontWeight: p === page ? 700 : 400,
                  }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Ticket Detail ─────────────────────────────────────────────
function TicketDetail({ id }) {
  const navigate  = useNavigate();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [reply,    setReply]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [admins,   setAdmins]   = useState([]);
  const [saving,   setSaving]   = useState(false);
  const bottomRef = useRef(null);

  const load = () => {
    setLoading(true);
    ticketAPI.getTicket(id)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    ticketAPI.getAdmins()
      .then(r => setAdmins(r.data.data || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketAPI.adminReply(id, reply.trim());
      setReply('');
      load();
    } catch (e) { alert(e.response?.data?.message || 'त्रुटी झाली.'); }
    finally { setSending(false); }
  };

  const handleAssign = async (assigned_to) => {
    setSaving(true);
    try {
      await ticketAPI.assignTicket(id, assigned_to ? Number(assigned_to) : null);
      load();
    } catch (e) { alert('नियुक्ती झाली नाही.'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (status) => {
    setSaving(true);
    try {
      await ticketAPI.updateStatus(id, { status });
      load();
    } catch (e) { alert('स्थिती बदलली नाही.'); }
    finally { setSaving(false); }
  };

  const handlePriority = async (priority) => {
    setSaving(true);
    try {
      await ticketAPI.updateStatus(id, { priority });
      load();
    } catch (e) { alert('प्राधान्य बदलले नाही.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Ticket सापडला नाही.</div>;

  const { ticket, messages } = data;

  return (
    <div>
      <button onClick={() => navigate('/admin/tickets')}
        style={{ background: 'none', border: 'none', color: '#b35c00', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
        ← सर्व Tickets
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Left: conversation */}
        <div>
          {/* Header card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f0e0c8', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#b35c00', fontWeight: 700, marginBottom: 4 }}>#{ticket.ticket_code}</div>
                <h2 style={{ margin: 0, fontSize: 16, color: '#2d1a00' }}>{ticket.subject}</h2>
                <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                  👤 {ticket.user_name || 'अनामिक'}
                  {ticket.user_phone && <> · 📞 {ticket.user_phone}</>}
                </div>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          {/* Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {messages.map(m => {
              const isAdmin = m.sender_type === 'admin';
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px',
                    borderRadius: isAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: isAdmin ? 'linear-gradient(135deg,#1565c0,#1976d2)' : '#fff',
                    color: isAdmin ? '#fff' : '#2d1a00',
                    border: isAdmin ? 'none' : '1px solid #f0e0c8',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 3, fontWeight: 600 }}>
                      {isAdmin ? '🛡️ Admin — ' : '👤 '}{m.sender_name}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.message}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                      {new Date(m.created_at).toLocaleString('mr-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          {ticket.status !== 'closed' ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f0e0c8' }}>
              <textarea
                placeholder="उत्तर लिहा..."
                value={reply} onChange={e => setReply(e.target.value)}
                rows={3}
                style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
              />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleReply} disabled={sending || !reply.trim()}>
                {sending ? '⏳ पाठवत आहे...' : '📨 उत्तर पाठवा'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 6 }}>Ctrl+Enter ने पाठवा</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 14, background: '#f5f5f5', borderRadius: 12, color: '#888', fontSize: 13 }}>
              हे ticket बंद आहे.
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Status */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f0e0c8' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>स्थिती</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => (
                <button key={o.value}
                  onClick={() => handleStatus(o.value)}
                  disabled={saving || ticket.status === o.value}
                  style={{
                    padding: '7px 12px', borderRadius: 8, border: '1px solid',
                    borderColor: ticket.status === o.value ? '#b35c00' : '#e0e0e0',
                    background: ticket.status === o.value ? '#fff8f0' : '#fff',
                    color: ticket.status === o.value ? '#b35c00' : '#555',
                    fontWeight: ticket.status === o.value ? 700 : 400,
                    cursor: ticket.status === o.value ? 'default' : 'pointer',
                    textAlign: 'left', fontSize: 13,
                  }}>
                  {ticket.status === o.value ? '● ' : ''}{o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f0e0c8' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>प्राधान्य</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRIORITY_OPTIONS.map(o => (
                <button key={o.value}
                  onClick={() => handlePriority(o.value)}
                  disabled={saving || ticket.priority === o.value}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: ticket.priority === o.value ? '#b35c00' : '#e0e0e0',
                    background: ticket.priority === o.value ? '#b35c00' : '#fff',
                    color: ticket.priority === o.value ? '#fff' : '#555',
                    cursor: ticket.priority === o.value ? 'default' : 'pointer',
                    fontSize: 12, fontWeight: ticket.priority === o.value ? 700 : 400,
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assign */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f0e0c8' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>नियुक्ती</div>
            {ticket.assigned_name && (
              <div style={{ fontSize: 13, color: '#2e7d32', fontWeight: 600, marginBottom: 8 }}>
                ✅ {ticket.assigned_name}
              </div>
            )}
            <select
              value={ticket.assigned_to || ''}
              onChange={e => handleAssign(e.target.value)}
              disabled={saving}
              style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
              <option value="">— नियुक्त करा —</option>
              {admins.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Meta */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f0e0c8', fontSize: 12, color: '#888', lineHeight: 2 }}>
            <div>📅 तयार: {new Date(ticket.created_at).toLocaleDateString('mr-IN')}</div>
            <div>🔄 अपडेट: {new Date(ticket.updated_at).toLocaleDateString('mr-IN')}</div>
            {ticket.user_phone && <div>📞 {ticket.user_phone}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function AdminTickets() {
  const { id } = useParams();

  return (
    <AdminLayout>
      <div style={{ padding: '4px 0 8px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#7c2d00', fontFamily: 'Noto Serif Devanagari, serif' }}>
          🎫 Support Tickets
        </h1>
        {!id && <p style={{ margin: 0, color: '#888', fontSize: 13 }}>वापरकर्त्यांच्या तक्रारी व प्रश्न</p>}
      </div>
      {id ? <TicketDetail id={id} /> : <TicketList />}
    </AdminLayout>
  );
}
