import { useState, useRef, useEffect } from 'react';
import s from './SearchableSelect.module.css';

export default function SearchableSelect({
  options,        // [{ label, value, sublabel? }] or string[]
  value,
  onChange,
  placeholder = 'निवडा...',
  searchPlaceholder = 'शोधा...',
  disabled = false,
  searchFn,       // optional: (query) => filteredOptions
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  // Normalize options to [{label, value, sublabel?}]
  const normalized = options.map(o =>
    typeof o === 'string' ? { label: o, value: o } : o
  );

  const filtered = query.trim()
    ? (searchFn ? searchFn(query) : normalized.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(query.toLowerCase()))
      ))
    : normalized;

  const selected = normalized.find(o => o.value === value);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // focus search input when dropdown opens
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const pick = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  return (
    <div className={`${s.wrap} ${disabled ? s.wrapDisabled : ''}`} ref={wrapRef}>
      {/* Trigger */}
      <button
        type="button"
        className={`${s.trigger} ${open ? s.triggerOpen : ''}`}
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? s.selectedText : s.placeholder}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={s.icons}>
          {selected && !disabled && (
            <span className={s.clearIcon} onClick={clear} title="रद्द करा">✕</span>
          )}
          <span className={s.arrow}>{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={s.dropdown} role="listbox">
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={s.searchInput}
              autoComplete="off"
            />
            {query && (
              <button type="button" className={s.clearQuery} onClick={() => setQuery('')}>✕</button>
            )}
          </div>

          <ul className={s.list}>
            {filtered.length === 0 ? (
              <li className={s.noResult}>"{query}" साठी काहीही सापडले नाही</li>
            ) : (
              filtered.map(opt => (
                <li
                  key={opt.value}
                  className={`${s.item} ${opt.value === value ? s.active : ''}`}
                  onClick={() => pick(opt)}
                  role="option"
                  aria-selected={opt.value === value}
                >
                  <span className={s.itemLabel}>{opt.label}</span>
                  {opt.sublabel && <span className={s.itemSub}>{opt.sublabel}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
