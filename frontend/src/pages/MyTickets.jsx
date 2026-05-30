// src/pages/MyTickets.jsx — User support ticket list + detail
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { ticketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = {
  open:        { label: 'उघडा',       color: '#b35c00', bg: '#fff8f0' },
  in_progress: { label: 'प्रक्रियेत', color: '#1565c0', bg: '#e3f2fd' },
  resolved:    { label: 'निराकरण',    color: '#2e7d32', bg: '#e8f5e9' },
  closed:      { label: 'बंद',        color: '#757575', bg: '#f5f5f5' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || STATUS_LABEL.open;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

// ── Ticket List View ──────────────────────────────────────────
function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketAPI.getMyTickets()
      .then(r => setTickets(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#7c2d00', fontFamily: 'Noto Serif Devanagari, serif' }}>
            🎫 माझे Support Tickets
          </h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>तुमच्या सर्व तक्रारी व प्रश्नांची स्थिती येथे दिसेल</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}
          onClick={() => navigate('/my-tickets/new')}>
          + नवे Ticket
        </button>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #f0e0c8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
          <p style={{ color: '#888' }}>अद्याप कोणतेही ticket नाही.</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }}
            onClick={() => navigate('/my-tickets/new')}>पहिले Ticket तयार करा</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tickets.map(t => (
            <div key={t.id}
              onClick={() => navigate(`/my-tickets/${t.id}`)}
              style={{
                background: '#fff', borderRadius: 14, padding: '16px 20px',
                border: '1px solid #f0e0c8', cursor: 'pointer',
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(179,92,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.05)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#b35c00', fontWeight: 700 }}>#{t.ticket_code}</span>
                    <StatusBadge status={t.status} />
                    {t.unread_admin > 0 && (
                      <span style={{ background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
                        नवे उत्तर
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#2d1a00', marginBottom: 4 }}>{t.subject}</div>
                  {t.last_message && (
                    <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>
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
      )}
    </div>
  );
}

// ── New Ticket Form ───────────────────────────────────────────
function NewTicketForm() {
  const navigate   = useNavigate();
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { alert('विषय व संदेश भरा.'); return; }
    setLoading(true);
    try {
      const res = await ticketAPI.create({ subject: subject.trim(), message: message.trim() });
      setSuccess(res.data.data);
    } catch (e) { alert(e.response?.data?.message || 'त्रुटी झाली.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', textAlign: 'center', border: '1px solid #f0e0c8' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#2e7d32', margin: '0 0 8px' }}>Ticket तयार झाले!</h2>
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 12, padding: '12px 20px', margin: '16px 0 20px' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Ticket ID</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1b5e20', letterSpacing: 3 }}>#{success.ticket_code}</div>
        </div>
        <p style={{ color: '#777', fontSize: 13, marginBottom: 24 }}>
          आमची टीम लवकरच उत्तर देईल. उत्तर आल्यावर येथे दिसेल.
        </p>
        <button className="btn btn-primary" style={{ width: '100%' }}
          onClick={() => navigate(`/my-tickets/${success.ticket_id}`)}>
          Ticket पाहा →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: '32px auto', padding: '0 16px 64px' }}>
      <Link to="/my-tickets" style={{ color: '#b35c00', fontSize: 13, display: 'inline-block', marginBottom: 20 }}>← माझे Tickets</Link>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', border: '1px solid #f0e0c8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#7c2d00', fontFamily: 'Noto Serif Devanagari, serif' }}>🎫 नवे Support Ticket</h2>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>आपली समस्या किंवा शंका लिहा</p>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>विषय *</label>
          <input type="text" placeholder="उदा: बुकिंग रद्द करायची आहे, पैसे परत हवेत..."
            value={subject} onChange={e => setSubject(e.target.value)}
            style={inp} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>संदेश *</label>
          <textarea placeholder="तुमची समस्या सविस्तर सांगा..."
            value={message} onChange={e => setMessage(e.target.value)}
            rows={5} style={{ ...inp, resize: 'vertical' }} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ पाठवत आहे...' : '🎫 Ticket पाठवा'}
        </button>
      </div>
    </div>
  );
}

// ── Ticket Detail / Conversation ─────────────────────────────
function TicketDetail({ id }) {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply,   setReply]   = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = () => {
    setLoading(true);
    ticketAPI.getTicket(id)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [data?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketAPI.reply(id, reply.trim());
      setReply('');
      load();
    } catch (e) { alert(e.response?.data?.message || 'त्रुटी झाली.'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data)   return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Ticket सापडला नाही.</div>;

  const { ticket, messages } = data;
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 16px 64px' }}>
      <Link to="/my-tickets" style={{ color: '#b35c00', fontSize: 13, display: 'inline-block', marginBottom: 16 }}>← माझे Tickets</Link>

      {/* Ticket header */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0e0c8', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#b35c00', fontWeight: 700, marginBottom: 4 }}>#{ticket.ticket_code}</div>
            <h2 style={{ margin: 0, fontSize: 17, color: '#2d1a00' }}>{ticket.subject}</h2>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
        {ticket.assigned_name && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#888' }}>
            👤 नियुक्त: <strong>{ticket.assigned_name}</strong>
          </p>
        )}
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {messages.map(m => {
          const isUser = m.sender_type === 'user';
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: isUser ? 'linear-gradient(135deg,#b35c00,#e07b2a)' : '#fff',
                color: isUser ? '#fff' : '#2d1a00',
                border: isUser ? 'none' : '1px solid #f0e0c8',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4, fontWeight: 600 }}>
                  {isUser ? '👤 ' : '🛡️ Admin — '}{m.sender_name}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.message}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 6, textAlign: 'right' }}>
                  {new Date(m.created_at).toLocaleString('mr-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {!isClosed ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #f0e0c8' }}>
          <textarea
            placeholder="उत्तर लिहा..."
            value={reply} onChange={e => setReply(e.target.value)}
            rows={3} style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleReply} disabled={sending || !reply.trim()}>
            {sending ? '⏳ पाठवत आहे...' : '📨 उत्तर पाठवा'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 6 }}>Ctrl+Enter ने पाठवा</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: 12, color: '#888', fontSize: 13 }}>
          हे ticket {ticket.status === 'resolved' ? 'निराकरण झाले' : 'बंद'} आहे.
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 6 };
const inp = { width: '100%', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box' };

// ── Main export — routes to sub-views ─────────────────────────
export default function MyTickets() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated]);

  return (
    <div>
      <Header />
      <main style={{ background: '#f7f1ea', minHeight: '80vh' }}>
        {id === 'new' ? <NewTicketForm /> : id ? <TicketDetail id={id} /> : <TicketList />}
      </main>
      <Footer />
    </div>
  );
}
