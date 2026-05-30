// src/components/common/ChatWidget.jsx — Professional Website Assistant
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCommentDots, FaXmark, FaRotateLeft, FaPaperPlane,
         FaWhatsapp, FaMinus, FaTicket } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import { chatAPI, ticketAPI, authAPI } from '../../api/index.js';
import s from './ChatWidget.module.css';

// ── Ticket inline styles ──────────────────────────────────────
const tkInput = {
  width:'100%', border:'1px solid #e0e0e0', borderRadius:8, padding:'8px 12px',
  fontSize:13, marginBottom:10, outline:'none', boxSizing:'border-box',
};
const tkBtn = {
  width:'100%', background:'linear-gradient(135deg,#b35c00,#e07b2a)',
  color:'#fff', border:'none', borderRadius:8, padding:'10px', fontSize:13,
  fontWeight:700, cursor:'pointer', marginBottom:6,
};
const tkLabel = {
  display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:4,
};

// ── Quick action categories ───────────────────────────────────
const QUICK_ACTIONS = [
  { label: '🪔 पूजा बुकिंग',    msg: 'पूजा बुकिंग कशी करावी?',          route: '/pooja'        },
  { label: '📅 पंचांग पाहा',    msg: 'आजचे पंचांग कसे पाहावे?',           route: '/panchang'     },
  { label: '🔮 राशीभविष्य',     msg: 'माझ्या राशीचे भविष्य सांगा',        route: '/rashifal'     },
  { label: '💻 ऑनलाइन पूजा',   msg: 'ऑनलाइन पूजा कशी करावी?',           route: '/online-puja'  },
  { label: '🏛️ हॉल बुकिंग',    msg: 'हॉल बुकिंग कशी करावी?',            route: '/hall-booking' },
  { label: '📖 ब्लॉग वाचा',     msg: 'पूजेबद्दल माहिती कुठे मिळेल?',     route: '/blog'         },
];

// ── Time-based greeting ───────────────────────────────────────
function getGreeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? 'शुभ प्रभात 🌅' : h < 17 ? 'शुभ दुपार ☀️' : 'शुभ संध्या 🌙';
  if (name) return `${time}, ${name}! 🙏`;
  return `${time}! 🙏`;
}

// ── Format bot message text ───────────────────────────────────
function FormattedText({ text, onNavigate }) {
  const routes = ['/pooja','/panchang','/rashifal','/blog','/online-puja',
                  '/hall-booking','/muhurat','/my-bookings','/login','/register',
                  '/pujari-nondni','/contact'];

  // Bold **text**
  const parseBold = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i}>{p.slice(2,-2)}</strong>;
      }
      // Route links
      const routeParts = p.split(/(\/[a-z\-:]+)/g);
      return routeParts.map((rp, j) => {
        if (routes.some(r => rp === r || rp.startsWith(r+'/'))) {
          return (
            <button key={`${i}-${j}`} className={s.inlineLink}
              onClick={() => onNavigate(rp)}>
              {rp}
            </button>
          );
        }
        return rp;
      });
    });
  };

  return (
    <div className={s.msgText}>
      {text.split('\n').map((line, i) => {
        // Numbered list items: 1️⃣ / 1. / -
        const isListItem = /^[\d]+[.)]/.test(line) || /^[-•]/.test(line) || /^[1-9]️⃣/.test(line);
        return (
          <span key={i} className={isListItem ? s.listItem : ''}>
            {parseBold(line)}
            {i < text.split('\n').length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const [open,        setOpen]        = useState(false);
  const [minimized,   setMinimized]   = useState(false);
  const [mode,        setMode]        = useState('chat'); // 'chat' | 'ticket'
  const [messages,    setMessages]    = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showQuick,   setShowQuick]   = useState(true);
  const [unread,      setUnread]      = useState(0);

  // Support ticket state
  const [tkStep,      setTkStep]      = useState('form'); // 'otp' | 'form' | 'success'
  const [tkOtpPhone,  setTkOtpPhone]  = useState('');
  const [tkOtpCode,   setTkOtpCode]   = useState('');
  const [tkOtpSent,   setTkOtpSent]   = useState(false);
  const [tkOtpLoading,setTkOtpLoading]= useState(false);
  const [tkSubject,   setTkSubject]   = useState('');
  const [tkMessage,   setTkMessage]   = useState('');
  const [tkSubmitting,setTkSubmitting]= useState(false);
  const [tkCode,      setTkCode]      = useState('');
  const [tkId,        setTkId]        = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Build welcome message dynamically
  const welcomeMsg = useCallback(() => ({
    role: 'assistant',
    text: `${getGreeting(user?.name)}\n\nमी **पूजारी Assistant** आहे.\n\nपूजा बुकिंग, पंचांग, राशीभविष्य, ऑनलाइन पूजा किंवा इतर कोणत्याही सेवेबद्दल विचारा — मी तुम्हाला step-by-step मदत करेन! 😊\n\nखाली पर्याय निवडा किंवा थेट प्रश्न विचारा:`,
  }), [user?.name]);

  // Initialize messages
  useEffect(() => {
    setMessages([welcomeMsg()]);
  }, [welcomeMsg]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input
  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, minimized]);

  // Unread badge when closed
  useEffect(() => {
    if (!open && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg !== messages[0]) {
        setUnread(n => n + 1);
      }
    }
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowQuick(false);
    setSuggestions([]);

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const history = messages
        .slice(1) // skip welcome
        .slice(-8)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

      const res  = await chatAPI.send(msg, history);
      const data = res.data.data;
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'माफ करा, आत्ता उत्तर देता आले नाही. 🙏\nकृपया WhatsApp वर संपर्क करा: **9561903219**',
      }]);
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setMessages([welcomeMsg()]);
    setShowQuick(true);
    setSuggestions([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNavigate = (route) => {
    setOpen(false);
    navigate(route);
  };

  // ── Ticket handlers ───────────────────────────────────────
  const switchToTicket = () => {
    setMode('ticket');
    setTkStep(isAuthenticated ? 'form' : 'otp');
    setTkOtpPhone(''); setTkOtpCode(''); setTkOtpSent(false);
    setTkSubject(''); setTkMessage(''); setTkCode(''); setTkId(null);
  };

  const handleTkSendOtp = async () => {
    if (tkOtpPhone.replace(/\D/g,'').length < 10) { alert('वैध फोन नंबर टाका.'); return; }
    setTkOtpLoading(true);
    try {
      await authAPI.sendOtp(tkOtpPhone.replace(/\D/g,''));
      setTkOtpSent(true);
    } catch (e) { alert(e.response?.data?.message || 'OTP पाठवताना त्रुटी.'); }
    finally { setTkOtpLoading(false); }
  };

  const handleTkVerifyOtp = async () => {
    if (tkOtpCode.length !== 6) { alert('6 अंकी OTP टाका.'); return; }
    setTkOtpLoading(true);
    try {
      await authAPI.verifyOtp({ phone: tkOtpPhone.replace(/\D/g,''), otp: tkOtpCode });
      setTkStep('form');
    } catch (e) { alert(e.response?.data?.message || 'OTP चुकीचा.'); }
    finally { setTkOtpLoading(false); }
  };

  const handleTkSubmit = async () => {
    if (!tkSubject.trim() || !tkMessage.trim()) { alert('विषय व संदेश भरा.'); return; }
    setTkSubmitting(true);
    try {
      const res = await ticketAPI.create({ subject: tkSubject.trim(), message: tkMessage.trim() });
      setTkCode(res.data.data.ticket_code);
      setTkId(res.data.data.ticket_id);
      setTkStep('success');
    } catch (e) { alert(e.response?.data?.message || 'Ticket तयार करताना त्रुटी.'); }
    finally { setTkSubmitting(false); }
  };

  return (
    <>
      {/* ── FAB Button ───────────────────────────────────────── */}
      <button
        className={`${s.fab} ${open ? s.fabOpen : ''}`}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="पूजारी Assistant"
        title="पूजारी Assistant"
      >
        {open ? <FaXmark /> : <FaCommentDots />}
        {!open && <span className={s.fabPulse} />}
        {!open && unread > 0 && (
          <span className={s.unreadBadge}>{unread}</span>
        )}
      </button>

      {/* ── Chat Window ──────────────────────────────────────── */}
      {open && (
        <div className={`${s.window} ${minimized ? s.windowMinimized : ''}`}>

          {/* Header */}
          <div className={s.header}>
            <div className={s.headerLeft}>
              <div className={s.botAvatarWrap}>
                <span className={s.botAvatar}>🙏</span>
                <span className={s.onlineDot} />
              </div>
              <div>
                <div className={s.botName}>पूजारी Assistant</div>
                <div className={s.botStatus}>
                  {loading ? (
                    <><span className={s.statusDot} style={{background:'#f59e0b'}}/> उत्तर देत आहे...</>
                  ) : (
                    <><span className={s.statusDot}/> ऑनलाइन — सेवेत आहे</>
                  )}
                </div>
              </div>
            </div>
            <div className={s.headerActions}>
              <a href="https://wa.me/9561903219?text=नमस्कार! मला मदत हवी आहे."
                target="_blank" rel="noreferrer"
                className={s.waHeaderBtn} title="WhatsApp वर संपर्क">
                <FaWhatsapp />
              </a>
              <button className={s.resetBtn} onClick={handleReset} title="नवीन संभाषण">
                <FaRotateLeft />
              </button>
              <button className={s.minimizeBtn} onClick={() => setMinimized(m => !m)} title="Minimize">
                <FaMinus />
              </button>
              <button className={s.closeBtn} onClick={() => setOpen(false)}>
                <FaXmark />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Mode tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid #f0e0c8', background:'#fdf8f3' }}>
                {[
                  { key:'chat',   label:'🤖 AI सहाय्यक' },
                  { key:'ticket', label:'🎫 Support Ticket' },
                ].map(t => (
                  <button key={t.key} onClick={() => t.key === 'ticket' ? switchToTicket() : setMode('chat')}
                    style={{
                      flex:1, padding:'8px 4px', fontSize:12, fontWeight:700,
                      border:'none', cursor:'pointer',
                      background: mode === t.key ? '#fff' : 'transparent',
                      color: mode === t.key ? '#b35c00' : '#888',
                      borderBottom: mode === t.key ? '2px solid #b35c00' : '2px solid transparent',
                      transition:'all 0.15s',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TICKET MODE ─────────────────────────────── */}
              {mode === 'ticket' && (
                <div style={{ padding:'16px', overflowY:'auto', flex:1 }}>

                  {/* OTP step */}
                  {tkStep === 'otp' && (
                    <div>
                      <p style={{ fontSize:13, color:'#555', marginBottom:14 }}>
                        तिकीट तयार करण्यासाठी आपला मोबाईल नंबर सत्यापित करा.
                      </p>
                      <input type="tel" maxLength={10} placeholder="फोन नंबर *"
                        value={tkOtpPhone} onChange={e => setTkOtpPhone(e.target.value.replace(/\D/g,''))}
                        style={tkInput} disabled={tkOtpSent} />
                      {!tkOtpSent ? (
                        <button style={tkBtn} onClick={handleTkSendOtp} disabled={tkOtpLoading}>
                          {tkOtpLoading ? '...' : '📲 OTP पाठवा'}
                        </button>
                      ) : (
                        <>
                          <input type="text" maxLength={6} placeholder="6 अंकी OTP *"
                            value={tkOtpCode} onChange={e => setTkOtpCode(e.target.value.replace(/\D/g,''))}
                            style={{ ...tkInput, textAlign:'center', letterSpacing:8, fontSize:18, fontWeight:700 }} />
                          <button style={tkBtn} onClick={handleTkVerifyOtp} disabled={tkOtpLoading}>
                            {tkOtpLoading ? '...' : '✅ OTP पडताळा'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Ticket form */}
                  {tkStep === 'form' && (
                    <div>
                      <p style={{ fontSize:13, color:'#555', marginBottom:12 }}>
                        आपली शंका किंवा समस्या लिहा. आमची टीम लवकरच उत्तर देईल.
                      </p>
                      <label style={tkLabel}>विषय *</label>
                      <input type="text" placeholder="उदा: बुकिंग रद्द करायची आहे"
                        value={tkSubject} onChange={e => setTkSubject(e.target.value)}
                        style={tkInput} />
                      <label style={tkLabel}>संदेश *</label>
                      <textarea placeholder="तुमची समस्या सविस्तर लिहा..."
                        value={tkMessage} onChange={e => setTkMessage(e.target.value)}
                        rows={4} style={{ ...tkInput, resize:'vertical' }} />
                      <button style={tkBtn} onClick={handleTkSubmit} disabled={tkSubmitting}>
                        {tkSubmitting ? '⏳ पाठवत आहे...' : '🎫 Ticket तयार करा'}
                      </button>
                    </div>
                  )}

                  {/* Success */}
                  {tkStep === 'success' && (
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
                      <p style={{ fontWeight:800, color:'#2e7d32', marginBottom:6 }}>Ticket तयार झाले!</p>
                      <div style={{ background:'#e8f5e9', border:'1px solid #a5d6a7', borderRadius:10, padding:'10px 16px', marginBottom:14 }}>
                        <div style={{ fontSize:11, color:'#888' }}>Ticket ID</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'#1b5e20', letterSpacing:2 }}>#{tkCode}</div>
                      </div>
                      <p style={{ fontSize:12, color:'#777', marginBottom:14 }}>
                        आमची टीम लवकरच उत्तर देईल. उत्तर आल्यावर "मदत" विभागात दिसेल.
                      </p>
                      <button style={{ ...tkBtn, background:'#e07b2a' }}
                        onClick={() => { setOpen(false); navigate('/my-tickets'); }}>
                        माझे Tickets पाहा →
                      </button>
                      <button style={{ ...tkBtn, background:'#f5f5f5', color:'#555', marginTop:8 }}
                        onClick={() => { setMode('chat'); }}>
                        AI Chat कडे परत जा
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── CHAT MODE ───────────────────────────────── */}
              {mode === 'chat' && <>
              {/* Messages */}
              <div className={s.messages}>
                {messages.map((msg, i) => (
                  <div key={i} className={`${s.msg} ${msg.role === 'user' ? s.msgUser : s.msgBot}`}>
                    {msg.role === 'assistant' && (
                      <div className={s.msgAvatar}>🙏</div>
                    )}
                    <div className={s.msgBubble}>
                      <FormattedText text={msg.text} onNavigate={handleNavigate} />
                      <div className={s.msgTime}>
                        {new Date().toLocaleTimeString('mr-IN', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick Actions — initial */}
                {showQuick && messages.length === 1 && (
                  <div className={s.quickWrap}>
                    {QUICK_ACTIONS.map(a => (
                      <button key={a.label} className={s.quickBtn}
                        onClick={() => sendMessage(a.msg)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggested follow-ups */}
                {!loading && suggestions.length > 0 && (
                  <div className={s.suggestWrap}>
                    {suggestions.map((sg, i) => (
                      <button key={i} className={s.suggestBtn}
                        onClick={() => sendMessage(sg)}>
                        {sg}
                      </button>
                    ))}
                  </div>
                )}

                {/* Typing indicator */}
                {loading && (
                  <div className={`${s.msg} ${s.msgBot}`}>
                    <div className={s.msgAvatar}>🙏</div>
                    <div className={s.typing}>
                      <span/><span/><span/>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className={s.inputArea}>
                <textarea
                  ref={inputRef}
                  className={s.input}
                  placeholder="प्रश्न विचारा... (Enter दाबा)"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    // auto-height
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  rows={1}
                  disabled={loading}
                />
                <button className={s.sendBtn} onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}>
                  {loading ? <span className={s.sendSpinner} /> : <FaPaperPlane />}
                </button>
              </div>

              {/* Footer */}
              <div className={s.chatFooter}>
                <span>🪔 pojjari.com — AI द्वारे संचालित</span>
                <a href="https://wa.me/9561903219" target="_blank" rel="noreferrer"
                  className={s.footerWa}>
                  <FaWhatsapp /> WhatsApp
                </a>
              </div>
              </> /* end chat mode */}
            </>
          )}
        </div>
      )}
    </>
  );
}
