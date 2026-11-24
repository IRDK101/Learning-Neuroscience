/**
 * Site-wide search: a button in the top bar, also opened with "/" or Ctrl/⌘-K.
 * Arrow keys move through results, Enter opens one, Escape closes.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { search } from '../lib/search';
import { Icon } from './bits';

function typingInField(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const { pathname, search: qs } = useLocation();
  useEffect(() => setOpen(false), [pathname, qs]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !typingInField(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <button type="button" className="icon-btn" onClick={() => setOpen(true)} title="Search (press /)" aria-label="Search" aria-haspopup="dialog">
        <Icon name="search" />
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const listId = useId();
  const hits = useMemo(() => search(q, 14), [q]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    input.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);
  useEffect(() => setActive(0), [q]);

  const go = (i: number) => {
    const h = hits[i];
    if (!h) return;
    onClose();
    navigate(h.to);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(active);
    }
  };

  return (
    <div className="search-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-dialog panel" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={onKey}>
        <div className="search-field">
          <Icon name="search" />
          <input
            ref={input}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search structures, terms, lessons…"
            aria-label="Search"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls={listId}
            aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="chip" onClick={onClose}>
            Esc
          </button>
        </div>
        {q.trim() && (
          <ul className="search-results" id={listId} role="listbox">
            {hits.length === 0 && <li className="search-empty muted">No matches.</li>}
            {hits.map((h, i) => (
              <li
                key={h.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(i)}
              >
                <span className="search-title">{h.title}</span>
                <span className="search-tag">{h.tag}</span>
                <span className="search-detail">{h.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
