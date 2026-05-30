// src/pages/admin/DharmasindhuSearch.jsx
import { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../api/axios';
import s from './DharmasindhuSearch.module.css';
import { FaBookOpen, FaMagnifyingGlass, FaSpinner, FaCircleCheck,
         FaCircleExclamation, FaBookmark, FaArrowRight, FaGear } from 'react-icons/fa6';

const SAMPLE_QUESTIONS = [
  'विवाह मुहूर्त कसा काढावा?',
  'गणपती पूजेचे विधी कोणते?',
  'श्राद्ध कधी करावे?',
  'नामकरण संस्कार कसा करावा?',
  'एकादशी व्रत कसे पाळावे?',
  'गृहप्रवेश पूजेचा विधी?',
  'नवरात्र पूजा कशी करावी?',
];

function StatusBar({ status, onRefresh }) {
  if (!status) return null;
  const pct = Math.round((status.processed_pages / status.total_pages) * 100);

  return (
    <div className={`${s.statusBar} ${s[`status_${status.status}`]}`}>
      <div className={s.statusLeft}>
        {status.status === 'completed' ? (
          <><FaCircleCheck className={s.statusIcon} /> धर्मसिंधु तयार — {status.content_rows} पाने DB मध्ये</>
        ) : status.status === 'running' ? (
          <><FaSpinner className={`${s.statusIcon} ${s.spin}`} /> OCR चालू — {status.processed_pages}/{status.total_pages} पाने ({pct}%)</>
        ) : status.status === 'idle' && status.content_rows === 0 ? (
          <><FaCircleExclamation className={s.statusIcon} /> OCR अजून सुरू केला नाही</>
        ) : (
          <><FaBookOpen className={s.statusIcon} /> {status.content_rows} पाने उपलब्ध ({pct}% पूर्ण)</>
        )}
      </div>
      {status.status !== 'completed' && (
        <div className={s.statusRight}>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function OCRGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.ocrGuide}>
      <button className={s.ocrGuideToggle} onClick={() => setOpen(o => !o)}>
        <FaGear /> OCR कसा चालवायचा? {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className={s.ocrGuideContent}>
          <p><strong>एकदाच चालवायचे आहे — सुमारे ४५-६० मिनिटे लागतात (841 पाने)</strong></p>
          <ol>
            <li>Python install असणे आवश्यक (आधीच आहे ✓)</li>
            <li>mysql-connector-python install करा:<br/>
              <code>pip install mysql-connector-python</code>
            </li>
            <li>backend/scripts/ मध्ये जा:<br/>
              <code>cd backend/scripts</code>
            </li>
            <li>Script चालवा:<br/>
              <code>python ocr_dharmasindhu.py</code>
            </li>
            <li>Ctrl+C ने interrupt केल्यास, पुन्हा चालवल्यास आपोआप resume होतो</li>
            <li>फक्त काही pages process करायचे असल्यास:<br/>
              <code>python ocr_dharmasindhu.py 1 50</code> (pages 1 to 50)
            </li>
          </ol>
          <p className={s.ocrNote}>
            💡 GROQ_API_KEY backend/env मध्ये आधीच आहे. Script आपोआप वाचतो.
          </p>
        </div>
      )}
    </div>
  );
}

function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={s.sourceCard}>
      <div className={s.sourceHeader} onClick={() => setExpanded(e => !e)}>
        <span className={s.sourceBadge}><FaBookmark /> पान {source.page_no}</span>
        <span className={s.sourceToggle}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <p className={s.sourceText}>{source.excerpt}</p>
      )}
    </div>
  );
}

export default function DharmasindhuSearch() {
  const [question, setQuestion]   = useState('');
  const [loading,  setLoading]    = useState(false);
  const [result,   setResult]     = useState(null);
  const [error,    setError]      = useState('');
  const [status,   setStatus]     = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    api.get('/dharmasindhu/status')
      .then(r => setStatus(r.data.data))
      .catch(() => {});
  }, []);

  const handleAsk = async (q) => {
    const text = (q || question).trim();
    if (!text) return;

    setLoading(true);
    setError('');
    setResult(null);
    setQuestion(text);

    try {
      const res = await api.post('/dharmasindhu/ask', { question: text });
      setResult(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'त्रुटी झाली. नंतर प्रयत्न करा.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <AdminLayout>
      <div className={s.page}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className={s.header}>
          <div className={s.headerIcon}>🕉️</div>
          <div>
            <h1 className={s.title}>धर्मसिंधु शंका समाधान</h1>
            <p className={s.subtitle}>
              बापू शास्त्री मोघे — मराठी अनुवाद (१८८६) &nbsp;•&nbsp;
              ग्रंथातून थेट उत्तर
            </p>
          </div>
        </div>

        {/* ── OCR Status Bar ───────────────────────────────── */}
        <StatusBar status={status} />

        {/* ── OCR Guide (if not processed yet) ────────────── */}
        {status && status.content_rows === 0 && <OCRGuide />}

        {/* ── Search Box ──────────────────────────────────── */}
        <div className={s.searchSection}>
          <div className={s.searchBox}>
            <FaMagnifyingGlass className={s.searchIcon} />
            <textarea
              ref={textareaRef}
              className={s.searchInput}
              placeholder="आपली शंका येथे लिहा... (उदा. विवाह मुहूर्त कसा काढावा?)"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading}
            />
            <button
              className={s.searchBtn}
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
            >
              {loading
                ? <FaSpinner className={s.spin} />
                : <><FaArrowRight /> विचारा</>
              }
            </button>
          </div>

          {/* Sample Questions */}
          <div className={s.samples}>
            <span className={s.samplesLabel}>सुचवलेले प्रश्न:</span>
            {SAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                className={s.sampleBtn}
                onClick={() => handleAsk(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading State ────────────────────────────────── */}
        {loading && (
          <div className={s.loadingCard}>
            <div className={s.loadingIcon}>🙏</div>
            <p className={s.loadingText}>धर्मसिंधु शोधत आहे...</p>
            <p className={s.loadingSubtext}>841 पानांमधून संबंधित मजकूर काढत आहे</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {error && !loading && (
          <div className={s.errorCard}>
            <FaCircleExclamation className={s.errorIcon} />
            <p>{error}</p>
            {error.includes('OCR') && <OCRGuide />}
          </div>
        )}

        {/* ── Answer ──────────────────────────────────────── */}
        {result && !loading && (
          <div className={s.resultSection}>

            {/* Question echo */}
            <div className={s.questionEcho}>
              <span className={s.questionLabel}>प्रश्न:</span>
              <span className={s.questionText}>{question}</span>
            </div>

            {/* Search keywords used */}
            {result.search_keywords && (
              <div className={s.keywordsBadge}>
                <span className={s.kwLabel}>🔍 शोधलेले शब्द:</span>
                {result.search_keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                  <span key={k} className={s.kwTag}>{k}</span>
                ))}
              </div>
            )}

            {/* AI Answer */}
            <div className={s.answerCard}>
              <div className={s.answerHeader}>
                <FaBookOpen className={s.answerIcon} />
                <span>धर्मसिंधु उत्तर</span>
                {!result.has_db_content && (
                  <span className={s.generalNote}>(OCR अपूर्ण — सामान्य ज्ञानावर आधारित)</span>
                )}
              </div>
              <div className={s.answerText}>
                {result.answer.split('\n').map((line, i) => {
                  if (!line.trim()) return <br key={i} />;
                  // Bold section headers like **📖 धर्मसिंधु सांगतो:**
                  if (line.startsWith('**') && line.endsWith('**')) {
                    const text = line.slice(2, -2);
                    return <p key={i} className={s.answerSection}>{text}</p>;
                  }
                  // Line with ** in middle — bold parts
                  if (line.includes('**')) {
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </p>
                    );
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>

            {/* Sources */}
            {result.sources?.length > 0 && (
              <div className={s.sourcesSection}>
                <h3 className={s.sourcesTitle}>
                  <FaBookmark /> धर्मसिंधु मूळ मजकूर ({result.sources.length} पाने)
                </h3>
                <div className={s.sourcesList}>
                  {result.sources.map((src, i) => (
                    <SourceCard key={src.page_no} source={src} index={i} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Empty State ──────────────────────────────────── */}
        {!loading && !result && !error && (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>📖</div>
            <h3>धर्मसिंधु शंका समाधान</h3>
            <p>
              धार्मिक विधी, मुहूर्त, संस्कार, व्रत — कोणत्याही शंकेचे उत्तर<br/>
              धर्मसिंधु ग्रंथातून थेट मजकूर काढून मराठी व English मध्ये दाखवले जाते
            </p>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
