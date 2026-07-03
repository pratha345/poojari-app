// src/pages/admin/GranthLibrary.jsx — Granth Library: upload + OCR + Q&A
import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import s from './GranthLibrary.module.css';
import {
  FaBookOpen, FaUpload, FaSpinner, FaCircleCheck, FaCircleXmark,
  FaTrash, FaRotateRight, FaBookmark, FaPaperPlane, FaChevronDown, FaChevronUp,
  FaCircleExclamation, FaPause,
} from 'react-icons/fa6';
import toast from 'react-hot-toast';
import api from '../../api/axios';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:    { icon: <FaCircleExclamation />, label: 'प्रतीक्षा',   cls: s.pending },
    processing: { icon: <FaSpinner className={s.spin} />, label: 'OCR चालू', cls: s.processing },
    completed:  { icon: <FaCircleCheck />, label: 'पूर्ण',      cls: s.completed },
    error:      { icon: <FaCircleXmark />, label: 'त्रुटी',      cls: s.error },
    paused:     { icon: <FaPause />,       label: 'थांबले',     cls: s.paused },
  };
  const m = map[status] || map.pending;
  return <span className={`${s.badge} ${m.cls}`}>{m.icon} {m.label}</span>;
}

// ── Source card ───────────────────────────────────────────────────────────────
function SourceCard({ src }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.sourceCard}>
      <div className={s.sourceHeader} onClick={() => setOpen(o => !o)}>
        <span className={s.sourceBadge}><FaBookmark /> पान {src.page_no}</span>
        <span>{open ? <FaChevronUp /> : <FaChevronDown />}</span>
      </div>
      {open && <p className={s.sourceText}>{src.excerpt}</p>}
    </div>
  );
}

// ── Book card ─────────────────────────────────────────────────────────────────
function BookCard({ book, onSelect, onDelete, onRestart, selected }) {
  return (
    <div className={`${s.bookCard} ${selected ? s.bookCardSelected : ''}`} onClick={() => onSelect(book)}>
      <div className={s.bookTop}>
        <FaBookOpen className={s.bookIcon} />
        <div className={s.bookInfo}>
          <h3 className={s.bookTitle}>{book.title}</h3>
          {book.author && <p className={s.bookAuthor}>{book.author}</p>}
        </div>
        <StatusBadge status={book.status} />
      </div>

      {book.total_pages > 0 && (
        <div className={s.progressWrap}>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${book.pct}%` }} />
          </div>
          <span className={s.progressText}>{book.processed_pages}/{book.total_pages} पाने ({book.pct}%)</span>
        </div>
      )}

      <div className={s.bookActions}>
        {(book.status === 'error' || book.status === 'paused') && (
          <button className={s.btnRestart} onClick={e => { e.stopPropagation(); onRestart(book.id); }}>
            <FaRotateRight /> Restart
          </button>
        )}
        <button className={s.btnDelete} onClick={e => { e.stopPropagation(); onDelete(book.id, book.title); }}>
          <FaTrash /> काढा
        </button>
      </div>
    </div>
  );
}

// ── Q&A Panel ─────────────────────────────────────────────────────────────────
function QAPanel({ book }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const bottomRef = useRef(null);

  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/granth/${book.id}/ask`, { question });
      setResult(res.data.data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('प्रश्न विचारताना त्रुटी झाली.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.qaPanel}>
      <div className={s.qaHeader}>
        <FaBookOpen className={s.qaBookIcon} />
        <div>
          <h2 className={s.qaTitle}>{book.title}</h2>
          {book.author && <p className={s.qaAuthor}>{book.author}</p>}
        </div>
      </div>

      {book.status !== 'completed' && (
        <div className={s.qaWarning}>
          <FaCircleExclamation /> OCR {book.processed_pages}/{book.total_pages} पाने ({book.pct}%) पूर्ण — काही उत्तरे अपूर्ण असू शकतात.
        </div>
      )}

      <div className={s.qaInputRow}>
        <input
          className={s.qaInput}
          placeholder={`"${book.title}" मधून प्रश्न विचारा...`}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask()}
        />
        <button className={s.qaBtn} onClick={ask} disabled={loading || !question.trim()}>
          {loading ? <FaSpinner className={s.spin} /> : <FaPaperPlane />}
          {loading ? 'शोधत आहे...' : 'विचारा'}
        </button>
      </div>

      {loading && (
        <div className={s.qaLoading}>
          <FaSpinner className={`${s.spin} ${s.loadingIcon}`} />
          <p>{book.title} मधून उत्तर शोधत आहे...</p>
        </div>
      )}

      {result && (
        <div className={s.qaResult}>
          <div
            className={s.answerText}
            dangerouslySetInnerHTML={{
              __html: result.answer
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>'),
            }}
          />

          {result.sources?.length > 0 && (
            <div className={s.sources}>
              <h4 className={s.sourcesTitle}><FaBookmark /> मूळ मजकूर ({result.sources.length} पाने)</h4>
              {result.sources.map(src => <SourceCard key={src.page_no} src={src} />)}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ── Upload form ───────────────────────────────────────────────────────────────
function UploadForm({ onUploaded }) {
  const [title, setTitle]       = useState('');
  const [author, setAuthor]     = useState('');
  const [lang, setLang]         = useState('marathi');
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const submit = async () => {
    if (!title.trim() || !file) return toast.error('नाव आणि PDF आवश्यक आहे.');
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('author', author.trim());
    fd.append('language', lang);
    fd.append('pdf', file);
    setUploading(true);
    try {
      await api.post('/granth', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('ग्रंथ upload झाला! OCR सुरू होईल.');
      setTitle(''); setAuthor(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onUploaded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload त्रुटी.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={s.uploadForm}>
      <h3 className={s.uploadTitle}><FaUpload /> नवीन ग्रंथ जोडा</h3>
      <div className={s.formGrid}>
        <div className={s.formGroup}>
          <label>ग्रंथाचे नाव *</label>
          <input placeholder="उदा. दासबोध, ज्ञानेश्वरी..." value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className={s.formGroup}>
          <label>लेखक / संकलक</label>
          <input placeholder="उदा. समर्थ रामदास स्वामी" value={author} onChange={e => setAuthor(e.target.value)} />
        </div>
        <div className={s.formGroup}>
          <label>भाषा</label>
          <select value={lang} onChange={e => setLang(e.target.value)}>
            <option value="marathi">मराठी</option>
            <option value="sanskrit">संस्कृत</option>
            <option value="hindi">हिंदी</option>
          </select>
        </div>
        <div className={s.formGroup}>
          <label>PDF File * (max 200 MB)</label>
          <input type="file" accept=".pdf" ref={fileRef} onChange={e => setFile(e.target.files[0])} />
        </div>
      </div>
      <button className={s.uploadBtn} onClick={submit} disabled={uploading}>
        {uploading ? <><FaSpinner className={s.spin} /> Upload होत आहे...</> : <><FaUpload /> Upload करा</>}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GranthLibrary() {
  const [books, setBooks]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading]     = useState(true);
  const pollRef = useRef(null);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await api.get('/granth');
      setBooks(res.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchBooks();
    // Poll every 8s while any book is processing
    pollRef.current = setInterval(() => {
      fetchBooks();
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchBooks]);

  // Stop polling when no books are processing
  useEffect(() => {
    const anyProcessing = books.some(b => b.status === 'processing' || b.status === 'pending');
    if (!anyProcessing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    } else if (anyProcessing && !pollRef.current) {
      pollRef.current = setInterval(fetchBooks, 8000);
    }
  }, [books, fetchBooks]);

  const handleDelete = async (id, title) => {
    if (!confirm(`"${title}" काढायचा का?`)) return;
    try {
      await api.delete(`/granth/${id}`);
      toast.success('ग्रंथ काढला.');
      if (selected?.id === id) setSelected(null);
      fetchBooks();
    } catch { toast.error('Delete त्रुटी.'); }
  };

  const handleRestart = async (id) => {
    try {
      await api.post(`/granth/${id}/restart`);
      toast.success('OCR पुन्हा सुरू केला.');
      fetchBooks();
    } catch { toast.error('Restart त्रुटी.'); }
  };

  return (
    <AdminLayout>
      <div className={s.page}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <FaBookOpen className={s.headerIcon} />
            <div>
              <h1 className={s.headerTitle}>ग्रंथ संग्रह</h1>
              <p className={s.headerSub}>PDF upload करा → OCR → AI Q&A</p>
            </div>
          </div>
          <button className={s.addBtn} onClick={() => setShowUpload(v => !v)}>
            <FaUpload /> {showUpload ? 'बंद करा' : 'नवीन ग्रंथ जोडा'}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <UploadForm onUploaded={() => { fetchBooks(); setShowUpload(false); }} />
        )}

        {/* Books + QA layout */}
        <div className={s.layout}>
          {/* Book list */}
          <div className={s.bookList}>
            <h2 className={s.listTitle}>ग्रंथ ({books.length})</h2>
            {loading ? (
              <div className={s.listLoading}><FaSpinner className={s.spin} /> Loading...</div>
            ) : books.length === 0 ? (
              <div className={s.empty}>
                <FaBookOpen className={s.emptyIcon} />
                <p>अजून कोणता ग्रंथ नाही.</p>
                <p>वर "नवीन ग्रंथ जोडा" वापरा.</p>
              </div>
            ) : (
              books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  selected={selected?.id === book.id}
                  onSelect={setSelected}
                  onDelete={handleDelete}
                  onRestart={handleRestart}
                />
              ))
            )}
          </div>

          {/* Q&A panel */}
          <div className={s.qaArea}>
            {selected ? (
              <QAPanel book={selected} />
            ) : (
              <div className={s.qaEmpty}>
                <FaBookOpen className={s.qaEmptyIcon} />
                <p>डाव्या बाजूने ग्रंथ निवडा</p>
                <p className={s.qaEmptyHint}>मग प्रश्न विचारा — धर्मसिंधूप्रमाणेच उत्तर मिळेल</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
