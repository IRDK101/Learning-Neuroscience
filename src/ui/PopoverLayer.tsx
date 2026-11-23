/**
 * One global popover for the whole site:
 *  - hover / focus / tap on a <dfn class="term"> or <a class="ref"> shows the entity's one-line definition
 *  - click on a .badge[data-corr] shows the CORRECTIONS.md entry (original wording → fix → why)
 * Uses event delegation, so lesson HTML, info panels and cards all get it for free.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { content, entity, ENTITY_TYPE_LABEL } from '../content';

type State = { kind: 'entity'; id: string; rect: DOMRect } | { kind: 'corr'; id: string; rect: DOMRect } | null;

export function PopoverLayer() {
  const [state, setState] = useState<State>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const showTimer = useRef<number | undefined>(undefined);
  const lastPointer = useRef<string>('mouse');

  const hide = useCallback(() => {
    window.clearTimeout(showTimer.current);
    setState(null);
  }, []);

  useEffect(() => {
    const termOf = (t: EventTarget | null) => (t instanceof Element ? (t.closest('dfn.term, a.ref') as HTMLElement | null) : null);
    const badgeOf = (t: EventTarget | null) => (t instanceof Element ? (t.closest('.badge[data-corr]') as HTMLElement | null) : null);

    const onPointerDown = (e: PointerEvent) => {
      lastPointer.current = e.pointerType;
    };
    const onClick = (e: MouseEvent) => {
      const badge = badgeOf(e.target);
      if (badge) {
        e.preventDefault();
        e.stopPropagation();
        setState({ kind: 'corr', id: badge.dataset.corr!, rect: badge.getBoundingClientRect() });
        return;
      }
      const term = termOf(e.target);
      if (term) {
        // Touch: first tap shows the definition (it has an "Open" link). Mouse clicks on links navigate.
        const isLink = term.tagName === 'A';
        if (!isLink || lastPointer.current !== 'mouse') {
          e.preventDefault();
          setState((s) =>
            s && s.kind === 'entity' && s.id === term.dataset.ref ? null : { kind: 'entity', id: term.dataset.ref!, rect: term.getBoundingClientRect() },
          );
        } else {
          hide();
        }
        return;
      }
      if (popRef.current && e.target instanceof Node && popRef.current.contains(e.target)) return;
      hide();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const term = termOf(e.target);
      if (term) {
        window.clearTimeout(hideTimer.current);
        window.clearTimeout(showTimer.current);
        showTimer.current = window.setTimeout(
          () => setState({ kind: 'entity', id: term.dataset.ref!, rect: term.getBoundingClientRect() }),
          220,
        );
      }
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (termOf(e.target)) {
        window.clearTimeout(showTimer.current);
        hideTimer.current = window.setTimeout(() => setState((s) => (s?.kind === 'entity' ? null : s)), 250);
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const term = e.target instanceof HTMLElement && e.target.matches('dfn.term') ? e.target : null;
      if (term) setState({ kind: 'entity', id: term.dataset.ref!, rect: term.getBoundingClientRect() });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
      if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLElement && e.target.matches('dfn.term')) {
        e.preventDefault();
        setState({ kind: 'entity', id: e.target.dataset.ref!, rect: e.target.getBoundingClientRect() });
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide);
    };
  }, [hide]);

  // Position after render so we know the popover's size.
  useEffect(() => {
    if (!state || !popRef.current) return setPos(null);
    const pop = popRef.current.getBoundingClientRect();
    const r = state.rect;
    const margin = 8;
    let left = Math.min(Math.max(margin, r.left + r.width / 2 - pop.width / 2), window.innerWidth - pop.width - margin);
    let top = r.bottom + 8;
    if (top + pop.height > window.innerHeight - 70) top = Math.max(margin, r.top - pop.height - 8);
    left = Math.max(margin, left);
    setPos({ left, top });
  }, [state]);

  if (!state) return null;
  const style = pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 };

  if (state.kind === 'entity') {
    const e = entity(state.id);
    if (!e) return null;
    return (
      <div
        ref={popRef}
        className="popover"
        role="tooltip"
        style={style}
        onPointerEnter={() => window.clearTimeout(hideTimer.current)}
        onPointerLeave={(ev) => ev.pointerType === 'mouse' && hide()}
      >
        <div className="tiny muted">{ENTITY_TYPE_LABEL[e.type]}</div>
        <h4>
          {e.name}
          {e.aliases[0] && <span className="muted"> ({e.aliases[0]})</span>}
        </h4>
        <p>{e.short}</p>
        <Link to={`/entity/${e.id}`} onClick={hide}>
          Open {e.name} →
        </Link>
      </div>
    );
  }

  const c = content.corrections[state.id];
  const f = content.flags[state.id];
  return (
    <div ref={popRef} className="popover" role="dialog" aria-label={`Correction ${state.id}`} style={style}>
      {c ? (
        <>
          <div className="tiny muted">
            {c.id} · corrected from your notes
          </div>
          <h4>{c.where}</h4>
          <p>
            <b>Your notes:</b> <i>{c.notes}</i>
          </p>
          <p style={{ whiteSpace: 'pre-line' }}>
            <b>Corrected:</b> {c.fixed}
          </p>
          <p className="muted small">
            <b>Why:</b> {c.why}
          </p>
        </>
      ) : f ? (
        <>
          <div className="tiny muted">{f.id} · flagged, kept as in your notes</div>
          <h4>{f.where}</h4>
          <p>
            <b>Your notes:</b> <i>{f.notes}</i>
          </p>
          <p className="muted small">{f.why}</p>
        </>
      ) : (
        <p>Unknown correction {state.id}</p>
      )}
      <Link to={`/corrections#${state.id}`} onClick={hide} className="small">
        All corrections →
      </Link>
    </div>
  );
}
